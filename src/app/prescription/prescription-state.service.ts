import * as lodash from 'lodash';
import { Injectable } from '@angular/core';
import { Observable, Subject } from 'rxjs';

import { FhirCdsHooksService } from '../common/fhir/fhir.cdshooks.service';
import { FhirDataSourceService } from '../common/services/fhir.data-source.service';
import { Hook, OrderSelectContext, OrderSelectHook } from '../common/fhir/fhir.cdshooks.model';
import { CardReadable } from './prescription.model';
import { fhir } from '../common/fhir/fhir.types';
import Practitioner = fhir.Practitioner;
import Patient = fhir.Patient;
import MedicationRequest = fhir.MedicationRequest;
import Medication = fhir.Medication;
import Bundle = fhir.Bundle;

@Injectable()
export class PrescriptionStateService {

  private _user: Patient | Practitioner;

  private _patient: Patient;

  private _medicationRequestSubject$ = new Subject<MedicationRequest>();

  private _cards = new Array<CardReadable>();

  constructor(private _dataSource: FhirDataSourceService,
              private _cdsHooksService: FhirCdsHooksService) {
  }

  public set user(user: Patient | Practitioner) {
    this._user = user;
  }

  public get user(): Patient | Practitioner {
    return this._user;
  }

  public set patient(patient: Patient) {
    this._patient = patient;
  }

  public get patient(): Patient {
    return this._patient;
  }

  public get cards(): Array<CardReadable> {
    return this._cards;
  }

  public get medicationRequestSubject(): Observable<MedicationRequest> {
    return this._medicationRequestSubject$;
  }

  public addMedicationRequest(medicationRequest: MedicationRequest): void {
    console.log('Medication Request: ', medicationRequest);
    this._cards.length = 0;
    this._medicationRequestSubject$.next(medicationRequest);
  }

  public callCdsHooks(medicationRequest: MedicationRequest): void {
    const lMedicationRequest = lodash.cloneDeep(medicationRequest);
    // TODO to can filtered by medication request code into CQL
    const medication = lMedicationRequest.contained[0] as Medication;
    if (medication.code != null) {
      lMedicationRequest.medicationCodeableConcept = medication.code;

      this._cdsHooksService.getServices().subscribe(
        {
          next: services => {
            const service = services.services[0];
            let hook: Hook;
            if (service.hook === 'order-select') {
              hook = new OrderSelectHook();
              (hook as OrderSelectHook).context = new OrderSelectContext();
              if (this.user) {
                (hook as OrderSelectHook).context.userId = this.user.id;
              }
              (hook as OrderSelectHook).context.patientId = this.patient.id;
              (hook as OrderSelectHook).context.selections = [lMedicationRequest.id];
              (hook as OrderSelectHook).context.draftOrders = {
                resourceType: 'Bundle',
                type: 'collection',
                entry: [{
                  resource: lMedicationRequest
                }],
              };
            }
            else {
              return;
            }

            hook.prefetch = {
              item1: this.patient,
              item2: lMedicationRequest
            };
            const promises: Array<Promise<object>> = [];
            for (const item of Object.keys(service.prefetch)) {
              if ('Patient?_id={{context.patientId}}' !== service.prefetch[item]) {
                promises.push(this.buildPrefetch(this.patient, service.prefetch[item]));
              }
            }

            Promise.all(promises).then(
              values => {
                let itemCount = 2;
                for (const value of values) {
                  const bundle = value as Bundle;
                  if (bundle.total > 0) {
                    hook.prefetch['item' + ++itemCount] = value;
                  }
                }

                this._cdsHooksService.postHook(service, hook)
                  .subscribe({
                    next: (cdsCards) => {
                      for (const card of cdsCards.cards) {
                        this.cards.push(new CardReadable(card));
                      }
                    },
                    error: (error) => {
                      console.log('Error: ', error);
                    }
                  });
              }
            ).catch(reason => {
              console.log('Reason: ', reason);
            });
          },
          error: err => {
            console.log('Error: ', err);
          }
        }
      );
    }
  }

  private buildPrefetch(patient: Patient, query: string): Promise<fhir.OperationOutcome | fhir.Resource> {
    return this._dataSource.searchResources(query.replace('{{context.patientId}}', patient.id));
  }
}
