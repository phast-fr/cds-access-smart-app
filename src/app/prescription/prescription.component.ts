import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Subject } from 'rxjs';
import { filter, map, switchMap, takeUntil } from 'rxjs/operators';

import { StateService } from '../common/services/state.service';
import { SmartService } from '../smart/services/smart.service';
import { FhirDataSourceService } from '../common/services/fhir.data-source.service';
import { PrescriptionStateService } from './prescription-state.service';
import { CardReadable } from './prescription.model';
import { fhir } from '../common/fhir/fhir.types';
import Patient = fhir.Patient;
import Practitioner = fhir.Practitioner;

@Component({
  selector: 'app-prescription',
  templateUrl: './prescription.component.html',
  styleUrls: ['./prescription.component.css']
})
export class PrescriptionComponent implements OnInit, OnDestroy  {

  private _unsubscribeTrigger$ = new Subject<void>();

  constructor(
    private _stateService: StateService,
    private _route: ActivatedRoute,
    private _smartService: SmartService,
    private _dataSource: FhirDataSourceService,
    private _prescriptionState: PrescriptionStateService) {
    this._stateService.stateSubject$
      .pipe(
        takeUntil(this._unsubscribeTrigger$),
        switchMap(stateModel => this._dataSource.readPatient(stateModel.patient))
      )
      .subscribe((patient: Patient) => this._prescriptionState.patient = patient);
    this._stateService.stateSubject$
      .pipe(
        takeUntil(this._unsubscribeTrigger$),
        filter(stateModel => stateModel.userType() === 'Practitioner'),
        switchMap(stateModel => this._dataSource.readPractitioner(stateModel.userId()))
      )
      .subscribe((user: Practitioner) => this._prescriptionState.user = user);
  }

  public get patient(): Patient {
    return this._prescriptionState.patient;
  }

  public get cards(): Array<CardReadable> {
    return this._prescriptionState.cards;
  }

  ngOnInit(): void {
    const routeWithoutToken$ = this._route.queryParams
      .pipe(
        filter(_ => !this._smartService.isTokenExist())
      );
    const routeWithToken$ = this._route.queryParams
      .pipe(
        filter(_ => this._smartService.isTokenExist())
      );
    routeWithoutToken$
      .pipe(
        takeUntil(this._unsubscribeTrigger$),
        map(params  => {
          console.log(params);
          return {
            code: params.code,
            state: params.state
          };
        })
      )
      .subscribe(value => this._smartService.retrieveToken(value.code, value.state));
    routeWithToken$
      .subscribe(_ => this._smartService.loadToken());
  }

  ngOnDestroy(): void {
    this._unsubscribeTrigger$.next();
    this._unsubscribeTrigger$.complete();
  }

  getBadge(): number {
    return this._prescriptionState.cards.filter((obj) => obj.isReaded === false).length;
  }

  onReadCards(): void {
    this._prescriptionState.cards.forEach(card => {
      card.isReaded = true;
    });
  }
}
