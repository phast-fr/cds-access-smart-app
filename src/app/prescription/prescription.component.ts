import {ChangeDetectionStrategy, Component, OnDestroy} from '@angular/core';
import {ActivatedRoute} from '@angular/router';
import {BehaviorSubject, Observable} from 'rxjs';
import {filter, map, takeUntil} from 'rxjs/operators';

import {StateService} from '../common/cds-access/services/state.service';
import {FhirSmartService} from '../common/fhir/smart/services/fhir.smart.service';
import {FhirDataSourceService} from '../common/fhir/services/fhir.data-source.service';
import {PrescriptionStateService} from './prescription-state.service';
import {SmartComponent, StateModel} from '../common/cds-access/models/core.model';

@Component({
  selector: 'app-prescription',
  templateUrl: './prescription.component.html',
  styleUrls: ['./prescription.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PrescriptionComponent extends SmartComponent implements OnDestroy {

  private readonly _loading$: BehaviorSubject<boolean>;

  private readonly _needBanner$: BehaviorSubject<boolean>;

  constructor(route: ActivatedRoute,
              smartService: FhirSmartService,
              private _stateService: StateService,
              private _prescriptionState: PrescriptionStateService,
              private _dataSource: FhirDataSourceService) {
    super(route, smartService);
    this._loading$ = new BehaviorSubject<boolean>(true);
    this._needBanner$ = new BehaviorSubject<boolean>(false);
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

  public cards = this._prescriptionState.cards;

  public get loading$(): Observable<boolean> {
    return this._loading$.asObservable();
  }

  public get needBanner$(): Observable<boolean> {
    return this._needBanner$.asObservable();
  }

  public ngOnDestroy(): void {
    super.ngOnDestroy();

    this._loading$.complete();
    this._needBanner$.complete();
  }

  public getBadge(): number {
    return this._prescriptionState.cards.filter((obj) => obj.isReaded === false).length;
  }

  public onReadCards(): void {
    this._prescriptionState.cards.forEach(card => {
      card.isReaded = true;
    });
  }
}
