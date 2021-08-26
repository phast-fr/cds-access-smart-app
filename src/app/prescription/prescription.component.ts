import {ChangeDetectionStrategy, Component, OnDestroy, OnInit} from '@angular/core';
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
export class PrescriptionComponent extends SmartComponent implements OnInit, OnDestroy {

  private readonly _loading$: BehaviorSubject<boolean>;

  private readonly _needBanner$: BehaviorSubject<boolean>;

  private _mode: string;

  constructor(route: ActivatedRoute,
              smartService: FhirSmartService,
              private _stateService: StateService,
              private _prescriptionState: PrescriptionStateService,
              private _dataSource: FhirDataSourceService) {
    super(route, smartService);
    this._loading$ = new BehaviorSubject<boolean>(true);
    this._needBanner$ = new BehaviorSubject<boolean>(false);
  }

  public cards = this._prescriptionState.cards;

  public get loading$(): Observable<boolean> {
    return this._loading$.asObservable();
  }

  public get needBanner$(): Observable<boolean> {
    return this._needBanner$.asObservable();
  }

  public get medicationRequestMode$(): Observable<string> {
    return this._prescriptionState.medicationRequestMode$;
  }

  public get mode(): string {
    return this._mode;
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

  public getBadge(): number {
    return this._prescriptionState.cards.filter((obj) => obj.isReaded === false).length;
  }

  public onReadCards(): void {
    this._prescriptionState.cards.forEach(card => {
      card.isReaded = true;
    });
  }
}
