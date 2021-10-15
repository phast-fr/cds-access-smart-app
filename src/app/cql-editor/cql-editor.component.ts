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
import {ActivatedRoute} from '@angular/router';
import {BehaviorSubject, Observable} from 'rxjs';
import {filter, map, takeUntil} from 'rxjs/operators';

import {StateService} from '../common/cds-access/services/state.service';
import {FhirSmartService} from '../common/fhir/smart/services/fhir.smart.service';
import {SmartComponent, StateModel} from '../common/cds-access/models/core.model';

@Component({
  selector: 'app-cql-editor',
  templateUrl: './cql-editor.component.html',
  styleUrls: ['./cql-editor.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CqlEditorComponent extends SmartComponent implements OnInit, OnDestroy {

  private readonly _loading$: BehaviorSubject<boolean>;

  private readonly _needBanner$: BehaviorSubject<boolean>;

  constructor(route: ActivatedRoute,
              smartService: FhirSmartService,
              private _stateService: StateService) {
    super(route, smartService);
    this._loading$ = new BehaviorSubject<boolean>(true);
    this._needBanner$ = new BehaviorSubject<boolean>(false);
  }

  public get loading$(): Observable<boolean> {
    return this._loading$.asObservable();
  }

  public get needBanner$(): Observable<boolean> {
    return this._needBanner$.asObservable();
  }

  public ngOnInit(): void {
    super.ngOnInit();

    this._stateService.state$
      .pipe(
        takeUntil(this.unsubscribeTrigger$),
        filter(state => state !== false),
        map(state => state as StateModel),
      )
      .subscribe({
        next: state => {
          this._needBanner$.next(state.needPatientBanner);
          this._loading$.next(false);
        },
        error: err => console.error('error', err)
      });
  }

  public ngOnDestroy(): void {
    super.ngOnDestroy();

    this._loading$.complete();
    this._needBanner$.complete();
  }
}
