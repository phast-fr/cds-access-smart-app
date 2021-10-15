/*
 * MIT License
 *
 * Copyright (c) 2021 PHAST
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

import {ChangeDetectionStrategy, Component, OnDestroy, OnInit} from '@angular/core';
import {CardReadable} from '../prescription.model';
import {PrescriptionStateService} from '../prescription-state.service';
import {Observable, Subject} from 'rxjs';
import {filter, map} from 'rxjs/operators';

@Component({
  selector: 'app-card-list',
  templateUrl: './card-list.component.html',
  styleUrls: ['./card-list.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CardListComponent implements OnInit, OnDestroy {

  private readonly _cards: Array<CardReadable>;

  private readonly _unsubscribeTrigger$: Subject<void>;

  constructor(private _prescriptionState: PrescriptionStateService) {
    this._cards = new Array<CardReadable>();
    this._unsubscribeTrigger$ = new Subject<void>();
  }

  public get cards$(): Observable<Array<CardReadable> | boolean> {
    return this._prescriptionState.cards$;
  }

  public get cards(): Array<CardReadable> {
    return this._cards;
  }

  public ngOnInit(): void {
    this._prescriptionState.cards$
      .pipe(
        filter(value => value !== false),
        map(value => value as Array<CardReadable>)
      )
      .subscribe({
        next: value => this._cards.push(...value),
        error: err => console.error('error', err)
      });
    this._prescriptionState.cards$
      .pipe(
        filter(value => value === false)
      )
      .subscribe({
        next: () => this._cards.length = 0,
        error: err => console.error('error', err)
      });
  }

  public ngOnDestroy(): void {
    this._unsubscribeTrigger$.next();
    this._unsubscribeTrigger$.complete();
  }
}
