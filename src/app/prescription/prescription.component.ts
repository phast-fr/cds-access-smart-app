import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Subject } from 'rxjs';
import { retry, takeUntil } from 'rxjs/operators';

import { StateService } from '../common/services/state.service';
import { SmartService } from '../smart/services/smart.service';
import { StateModel } from '../common/models/state.model';
import { fhir } from '../common/fhir/fhir.types';
import { FhirDataSourceService } from '../common/services/fhir.data-source.service';
import { PrescriptionStateService } from './prescription-state.service';
import { CardReadable } from './prescription.model';
import Patient = fhir.Patient;

@Component({
  selector: 'app-prescription',
  templateUrl: './prescription.component.html',
  styleUrls: ['./prescription.component.css']
})
export class PrescriptionComponent implements OnInit, OnDestroy  {

  constructor(
    private stateService: StateService,
    private route: ActivatedRoute,
    private smartService: SmartService,
    private dataSource: FhirDataSourceService,
    private prescriptionState: PrescriptionStateService) { }

  private unsubscribe$ = new Subject<void>();

  public get patient(): Patient {
    return this.prescriptionState.patient;
  }

  public get cards(): Array<CardReadable> {
    return this.prescriptionState.cards;
  }

  ngOnInit(): void {
    /*this.form = this.formBuilder.group({
      medicationRequest: ['', Validators.required]
    });*/

    const oAuthCode = this.route.snapshot?.queryParamMap.get('code');
    const oAuthState = this.route.snapshot.queryParamMap.get('state');
    // smart on FHIR case
    if (oAuthCode != null && oAuthState != null) {
      this.stateService.stateSubject$
        .pipe(
          takeUntil(this.unsubscribe$),
          retry(3)
        )
        .subscribe(
          (stateModel: StateModel) => {
            this.dataSource.readPatient(stateModel.token.patient)
              .then(data => {
                this.prescriptionState.patient = data;
              })
              .catch(reason => {
                console.log('Reason: ', reason);
              });

            if (this.stateService.getUserType() === 'Practitioner') {
              this.dataSource.readPractitioner(this.stateService.getUserId())
                .then(data => {
                  this.prescriptionState.user = data;
                })
                .catch(reason => {
                  console.log('Reason: ', reason);
                });
            }
          }
        );

      if (!this.smartService.isTokenExist()) {
        this.smartService.retrieveToken(oAuthCode, oAuthState);
      }
    }
  }

  ngOnDestroy(): void {
    this.unsubscribe$.next();
    this.unsubscribe$.complete();
  }

  getBadge(): number {
    return this.prescriptionState.cards.filter((obj) => obj.isReaded === false).length;
  }

  onReadCards(): void {
    this.prescriptionState.cards.forEach(card => {
      card.isReaded = true;
    });
  }
}
