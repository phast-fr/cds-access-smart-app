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
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

import { Injectable } from '@angular/core';
import {BehaviorSubject, forkJoin, Observable} from 'rxjs';

import { v4 as uuidv4 } from 'uuid';

import { StateService } from '../common/cds-access/services/state.service';
import { FhirCdsHooksService } from '../common/fhir/cds-hooks/services/fhir.cdshooks.service';
import { FhirDataSourceService } from '../common/fhir/services/fhir.data-source.service';
import {StateModel} from '../common/cds-access/models/core.model';
import {Card, Hook, OrderSelectContext, OrderSelectHook, Service} from '../common/fhir/cds-hooks/models/fhir.cdshooks.model';
import { CardReadable } from './prescription.model';
import {Bundle, MedicationRequest, OperationOutcome, Patient, Practitioner, Resource} from 'phast-fhir-ts';
import {FhirTypeGuard} from '../common/fhir/utils/fhir.type.guard';

@Injectable()
export class PrescriptionStateService {

  private readonly _bundle$: BehaviorSubject<Bundle | boolean>;

  private readonly _cards$: BehaviorSubject<Array<CardReadable> | boolean>;

  private readonly _medicationRequestMode$: BehaviorSubject<string>;

  private readonly _hasMedications$: BehaviorSubject<boolean>;

  private readonly _onCDSHelp$: BehaviorSubject<boolean>;

  constructor(
      private _stateService: StateService,
      private _dataSource: FhirDataSourceService,
      private _cdsHooksService: FhirCdsHooksService
  ) {
    this._bundle$ = new BehaviorSubject<Bundle | boolean>(false);
    this._cards$ = new BehaviorSubject<Array<CardReadable> | boolean>(false);
    this._medicationRequestMode$ = new BehaviorSubject<string>('dc');
    this._hasMedications$ = new BehaviorSubject<boolean>(false);
    this._onCDSHelp$ = new BehaviorSubject<boolean>(false);
  }

  public get cards$(): Observable<Array<CardReadable> | boolean> {
    return this._cards$.asObservable();
  }

  public get bundle$(): Observable<Bundle | boolean> {
    return this._bundle$.asObservable();
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

  public set onCDSHelp(onCDSHelp: boolean) {
    this._onCDSHelp$.next(onCDSHelp);
  }

  public get onCDSHelp$(): Observable<boolean> {
    return this._onCDSHelp$;
  }

  public addBundle(bundle: Bundle): void {
    this._cards$.next(false);
    this._bundle$.next(bundle);
  }

  public resetCards() {
    this._cards$.next(false);
  }

  public callCdsHooks(bundle: Bundle): void {
    this._cdsHooksService.getServices()
          .subscribe({
            next: services => {
              let serviceId = 'fr.phast.cds';
              if (this._stateService.state) {
                const stateModel = this._stateService.state as StateModel;
                if (stateModel.context?.service_id !== undefined) {
                  serviceId = stateModel.context.service_id;
                }
              }
              const servicesFiltered = services.services.filter((serv: Service) => serv.id === serviceId);
              const service = servicesFiltered[0];
              const prefetch = {} as { [s: string]: Resource };
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
              const medicationRequest = bundle.entry?.filter(entry => FhirTypeGuard.isMedicationRequest(entry.resource))
                  .map(entry => entry.resource as MedicationRequest)
                  .reduce((_, current: MedicationRequest) => current);

              let hook: Hook;
              const hookInstance = uuidv4();
              if (service.hook === 'order-select') {
                if (practitioner?.id && patient?.id && medicationRequest?.id) {
                  const context = new OrderSelectContext(
                        practitioner.id,
                        patient.id,
                        [medicationRequest.id],
                        {
                          resourceType: 'Bundle',
                          type: 'collection'
                        });

                  if (bundle.entry) {
                    context.draftOrders.entry = bundle.entry;
                    context.draftOrders.total = bundle.entry.length;
                  }
                  hook = new OrderSelectHook(hookInstance, prefetch, context);
                }
                else {
                  console.error('error:', 'id is null');
                  return;
                }
              }
              else {
                console.error('error:', 'the hook ' + service.hook + ' is not supported');
                return;
              }

              if (service.prefetch) {
                const observables = new Array<Observable<object>>();
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
                        let itemCount = 1;
                        values.forEach(value => {
                          const bundleResponse = value as Bundle;
                          if (bundleResponse.total && bundleResponse.total > 0) {
                            hook.prefetch['item' + ++itemCount] = bundleResponse;
                          }
                        });
                        this._cdsHooksService.postHook(service, hook)
                            .subscribe({
                              next: (cdsCards) => this._cards$.next(
                                    cdsCards.cards.map<CardReadable>((card: Card) => new CardReadable(card))
                              ),
                              error: err => this.onError(err),
                              complete: () => this.onCDSHelp = false
                            });
                      },
                      error: err => this.onError(err),
                    });
              }
              else {
                this._cdsHooksService.postHook(service, hook)
                    .subscribe({
                      next: (cdsCards) => this._cards$.next(
                          cdsCards.cards.map<CardReadable>((card: Card) => new CardReadable(card))
                      ),
                      error: err => console.error('error:', err),
                      complete: () => this.onCDSHelp = false
                    });
              }
            },
            error: err => this.onError(err),
          });
  }

  private buildPrefetch(patient: Patient | undefined | null, query: string): Observable<OperationOutcome | Resource> | undefined {
    if (patient?.id) {
      return this._dataSource.postResourceSearch(query.replace('{{context.patientId}}', patient.id));
    }
    return undefined;
  }

  private onError(err?: any): void {
    this.onCDSHelp = false;
    console.error('error:', err);
    // TODO display error for user
  }
}
