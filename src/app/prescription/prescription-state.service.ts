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

import { Injectable } from '@angular/core';
import {BehaviorSubject, forkJoin, Observable} from 'rxjs';

import * as lodash from 'lodash';
import { v4 as uuidv4 } from 'uuid';

import { StateService } from '../common/cds-access/services/state.service';
import { FhirCdsHooksService } from '../common/fhir/cds-hooks/services/fhir.cdshooks.service';
import { FhirDataSourceService } from '../common/fhir/services/fhir.data-source.service';
import {StateModel} from '../common/cds-access/models/core.model';
import { Hook, OrderSelectContext, OrderSelectHook } from '../common/fhir/cds-hooks/models/fhir.cdshooks.model';
import { CardReadable } from './prescription.model';
import {Bundle, Medication, MedicationRequest, OperationOutcome, Patient, Practitioner, Resource} from 'phast-fhir-ts';

@Injectable()
export class PrescriptionStateService {

  private readonly _medicationRequest$: BehaviorSubject<MedicationRequest | boolean>;

  private readonly _cards$: BehaviorSubject<Array<CardReadable> | boolean>;

  private readonly _medicationRequestMode$: BehaviorSubject<string>;

  private readonly _hasMedications$: BehaviorSubject<boolean>;

  constructor(private _stateService: StateService,
              private _dataSource: FhirDataSourceService,
              private _cdsHooksService: FhirCdsHooksService) {
    this._medicationRequest$ = new BehaviorSubject<MedicationRequest | boolean>(false);
    this._cards$ = new BehaviorSubject<Array<CardReadable> | boolean>(false);
    this._medicationRequestMode$ = new BehaviorSubject<string>('dc');
    this._hasMedications$ = new BehaviorSubject<boolean>(false);
  }

  public get cards$(): Observable<Array<CardReadable> | boolean> {
    return this._cards$.asObservable();
  }

  public get medicationRequest$(): Observable<MedicationRequest | boolean> {
    return this._medicationRequest$.asObservable();
  }

  public set medicationRequestMode(mode: string) {
    this._medicationRequestMode$.next(mode);
  }

  public get medicationRequestMode$(): Observable<string> {
    return this._medicationRequestMode$.asObservable();
  }

  public set hasMedication(hasMedication: boolean) {
    this._hasMedications$.next(hasMedication);
  }

  public get hasMedication$(): Observable<boolean> {
    return this._hasMedications$.asObservable();
  }

  public addMedicationRequest(medicationRequest: MedicationRequest): void {
    if (medicationRequest.dosageInstruction) {
      medicationRequest.dosageInstruction.forEach((dosage) => {
        if (dosage?.timing?.repeat?.boundsDuration) {
          delete dosage.timing.repeat.boundsDuration;
        }
      });
    }

    console.log('Medication Request: ', medicationRequest);
    this._cards$.next(false);
    this._medicationRequest$.next(medicationRequest);
  }

  public callCdsHooks(medicationRequest: MedicationRequest): void {
    const lMedicationRequest = lodash.cloneDeep(medicationRequest);
    if (lMedicationRequest && lMedicationRequest.contained) {
      // TODO to can filtered by medication request code into CQL
      const medication = lMedicationRequest.contained[0] as Medication;
      if (medication.code) {
        lMedicationRequest.id = 'tmp';
        lMedicationRequest.medicationCodeableConcept = medication.code;

        this._cdsHooksService.getServices()
          .subscribe(
            {
              next: services => {
                const service = services.services[0];
                const prefetch = {} as {[s: string]: Resource};
                let practitioner: Practitioner | undefined;
                let patient: Patient | undefined;
                if (this._stateService.state) {
                  const state = this._stateService.state as StateModel;
                  if (state.practitioner) {
                    practitioner = state.practitioner;
                  }
                  if (state.patient) {
                    patient = state.patient;
                    prefetch['item1'] = patient;
                  }
                }

                let hook: Hook;
                const hookInstance = uuidv4();
                if (service.hook === 'order-select') {
                  if (practitioner?.id && patient?.id && lMedicationRequest?.id) {
                    const context = new OrderSelectContext(practitioner.id, patient.id, [lMedicationRequest.id], {
                      resourceType: 'Bundle',
                      type: 'collection',
                      entry: [{
                        resource: lMedicationRequest
                      }],
                    });
                    prefetch['item2'] = lMedicationRequest;
                    hook = new OrderSelectHook(hookInstance, prefetch, context);
                  }
                  else {
                    console.error('error', 'id is null');
                    return;
                  }
                }
                else {
                  console.error('error', 'the hook ' + service.hook + ' is not supported');
                  return;
                }

                if (service.prefetch) {
                  const observables: Array<Observable<object>> = [];
                  Object.keys(service.prefetch)?.forEach(key => {
                    const item = service.prefetch[key];
                    if ('Patient?_id={{context.patientId}}' !== item) {
                      const observable = this.buildPrefetch(patient, item);
                      if (observable) {
                        observables.push(observable);
                      }
                    }
                  });
                  forkJoin(observables)
                      .subscribe({
                        next: values => {
                          let itemCount = 2;
                          values.forEach(value => {
                            const bundle = value as Bundle;
                            if (bundle.total && bundle.total > 0) {
                              hook.prefetch['item' + ++itemCount] = bundle;
                            }
                          });
                          this._cdsHooksService.postHook(service, hook)
                              .subscribe({
                                next: (cdsCards) => {
                                  const cards = Array<CardReadable>();
                                  for (const card of cdsCards.cards) {
                                    cards.push(new CardReadable(card));
                                  }
                                  this._cards$.next(cards);
                                },
                                error: err => console.error('error', err)
                              });
                        },
                        error: err => console.error('error', err),
                      });
                }
                else {
                  this._cdsHooksService.postHook(service, hook)
                      .subscribe({
                        next: (cdsCards) => {
                          const cards = Array<CardReadable>();
                          for (const card of cdsCards.cards) {
                            cards.push(new CardReadable(card));
                          }
                          this._cards$.next(cards);
                        },
                        error: err => console.error('error', err)
                      });
                }
              },
              error: err => console.error('error', err)
            }
          );
      }
    }
  }

  private buildPrefetch(patient: Patient | undefined | null, query: string): Observable<OperationOutcome | Resource> | undefined {
    if (patient?.id) {
      return this._dataSource.resourceSearch(query.replace('{{context.patientId}}', patient.id));
    }
    return undefined;
  }
}
