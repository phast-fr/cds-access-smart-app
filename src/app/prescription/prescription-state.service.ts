import * as lodash from 'lodash';
import { Injectable } from '@angular/core';
import {BehaviorSubject, forkJoin, Observable} from 'rxjs';

import { StateService } from '../common/cds-access/services/state.service';
import { FhirCdsHooksService } from '../common/fhir/cds-hooks/services/fhir.cdshooks.service';
import { FhirDataSourceService } from '../common/fhir/services/fhir.data-source.service';
import {StateModel} from '../common/cds-access/models/core.model';
import { Hook, OrderSelectContext, OrderSelectHook } from '../common/fhir/cds-hooks/models/fhir.cdshooks.model';
import { CardReadable } from './prescription.model';
import {Bundle, Medication, MedicationRequest, OperationOutcome, Patient, Resource} from 'phast-fhir-ts';

@Injectable()
export class PrescriptionStateService {

  private readonly _medicationRequest$: BehaviorSubject<MedicationRequest | boolean>;

  private readonly _cards: Array<CardReadable>;

  private readonly _medicationRequestMode$: BehaviorSubject<string>;

  constructor(private _stateService: StateService,
              private _dataSource: FhirDataSourceService,
              private _cdsHooksService: FhirCdsHooksService) {
    this._medicationRequest$ = new BehaviorSubject<MedicationRequest | boolean>(false);
    this._cards = new Array<CardReadable>();
    this._medicationRequestMode$ = new BehaviorSubject<string>('dc');
  }

  public get cards(): Array<CardReadable> {
    return this._cards;
  }

  public get medicationRequest$(): Observable<MedicationRequest | boolean> {
    return this._medicationRequest$.asObservable();
  }

  public set medicationRequestMode(mode) {
    this._medicationRequestMode$.next(mode);
  }

  public get medicationRequestMode$(): Observable<string> {
    return this._medicationRequestMode$.asObservable();
  }

  public addMedicationRequest(medicationRequest: MedicationRequest): void {
    medicationRequest.dosageInstruction.forEach((dosage) => {
      if (dosage?.timing?.repeat?.boundsDuration) {
        delete dosage.timing.repeat.boundsDuration;
      }
    });

    console.log('Medication Request: ', medicationRequest);
    this._cards.length = 0;
    this._medicationRequest$.next(medicationRequest);
  }

  public callCdsHooks(medicationRequest: MedicationRequest): void {
    const lMedicationRequest = lodash.cloneDeep(medicationRequest);
    // TODO to can filtered by medication request code into CQL
    const medication = lMedicationRequest.contained[0] as Medication;
    if (medication.code != null) {
      lMedicationRequest.medicationCodeableConcept = medication.code;

      this._cdsHooksService.getServices()
        .subscribe(
        {
          next: services => {
            const service = services.services[0];
            let practitioner = null;
            let patient = null;
            if (this._stateService.state) {
              const state = this._stateService.state as StateModel;
              if (state.practitioner) {
                practitioner = state.practitioner.id;
              }
              if (state.patient) {
                patient = state.patient.id;
              }
            }
            let hook: Hook;
            if (service.hook === 'order-select') {
              hook = new OrderSelectHook();
              (hook as OrderSelectHook).context = new OrderSelectContext();
              if (practitioner) {
                (hook as OrderSelectHook).context.userId = practitioner.id;
              }
              if (patient) {
                (hook as OrderSelectHook).context.patientId = patient.id;
              }
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
              item1: patient,
              item2: lMedicationRequest
            };

            const observables: Array<Observable<object>> = [];
            for (const item of Object.keys(service.prefetch)) {
              if ('Patient?_id={{context.patientId}}' !== service.prefetch[item]) {
                observables.push(this.buildPrefetch(patient, service.prefetch[item]));
              }
            }

            forkJoin(observables)
              .subscribe({
                next: values => {
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
                      error: err => console.error('error', err)
                    });
                },
                error: err => console.error('error', err),
              });
          },
          error: err => console.error('error', err)
        }
      );
    }
  }

  private buildPrefetch(patient: Patient, query: string): Observable<OperationOutcome | Resource> {
    return this._dataSource.resourceSearch(query.replace('{{context.patientId}}', patient.id));
  }
}
