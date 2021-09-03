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
