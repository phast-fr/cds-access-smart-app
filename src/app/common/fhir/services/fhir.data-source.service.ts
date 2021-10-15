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
import {HttpHeaders} from '@angular/common/http';
import {Observable, of, switchMap} from 'rxjs';
import {filter, map} from 'rxjs/operators';

import { FhirSmartService } from '../smart/services/fhir.smart.service';
import {FhirClientService, Options} from './fhir.client.service';
import {Bundle, Composition, id, MedicationRequest, OperationOutcome, Patient, Practitioner, Resource} from 'phast-fhir-ts';
import * as lodash from 'lodash';
import {ReferenceBuilder} from '../builders/fhir.resource.builder';
import {FhirTypeGuard} from '../utils/fhir.type.guard';
import {OperationOutcomeIssue} from 'phast-fhir-ts/lib/hl7/r4/fhir';

@Injectable()
export class FhirDataSourceService {

  private _options?: Options;

  private _baseUrl?: string;

  constructor(private _smartService: FhirSmartService,
              private _fhirClient: FhirClientService) {
    this._smartService.baseUrl$
      .pipe(
        filter(value => value !== false),
        map(value => value as string)
      )
      .subscribe({
        next: url => this._baseUrl = url,
        error: err => console.error('error', err)
      });
    this._smartService.accessToken$
      .pipe(
        filter(value => value !== false),
        map(value => value as string)
      )
      .subscribe({
        next: accessToken => {
          this._options = {
            headers: new HttpHeaders()
              .set('Accept', 'application/json; charset=utf-8; q=1')
              .set('Content-type', 'application/fhir+json')
              .set('Authorization', `Bearer ${accessToken}`)
          } as Options;
        },
        error: err => console.error('error', err)
      });
  }

  public patientRead(patientId: id): Observable<OperationOutcome | Patient> | undefined {
    if (this._baseUrl) {
      return this._fhirClient.read<OperationOutcome | Patient>(
          this._baseUrl,
          {
            resourceType: 'Patient',
            id: patientId
          },
          this._options
      );
    }
    return undefined;
  }

  public practitionerRead(practitionerId: id): Observable<OperationOutcome | Practitioner> | undefined {
    if (this._baseUrl) {
      return this._fhirClient.read<OperationOutcome | Practitioner>(
          this._baseUrl,
          {
            resourceType: 'Practitioner',
            id: practitionerId
          },
          this._options
      );
    }
    return undefined;
  }

  public compositionRead(compositionId: id): Observable<OperationOutcome | Composition> | undefined {
    if (this._baseUrl) {
      return this._fhirClient.read<OperationOutcome | Composition>(
          this._baseUrl,
          {
            resourceType: 'Composition',
            id: compositionId
          },
          this._options
      );
    }
    return undefined;
  }

  public resourceSearch(path: string): Observable<OperationOutcome | Bundle & { type: 'searchset' }> | undefined {
    if (this._baseUrl) {
      const resourceTypeSearch = path.split('?');
      const resourceType = resourceTypeSearch[0];
      const search = resourceTypeSearch[1];

      const searchParams = new URLSearchParams();
      search.split('&').forEach(part => {
        const keyValue = part.split('=');
        const key = keyValue[0];
        searchParams.set(key, keyValue[1]);
      });
      return this._fhirClient.resourceSearch<OperationOutcome | Bundle & { type: 'searchset' }>(
          this._baseUrl,
          {
            resourceType,
            searchParams
          },
          this._options
      );
    }
    return undefined;
  }

  public patientSearch(name?: string): Observable<OperationOutcome | Bundle & { type: 'searchset' }> | undefined {
    if (this._baseUrl) {
      if (name) {
        let search = name.trim();
        search = search.replace(/ /g, ',');
        return this._fhirClient.resourceSearch<OperationOutcome | Bundle & { type: 'searchset' }>(
            this._baseUrl,
            {
              resourceType: 'Patient',
              searchParams: new URLSearchParams({
                _count: '10',
                name: search
              })
            },
            this._options
        );
      }
      return this._fhirClient.resourceSearch(
          this._baseUrl,
          {
            resourceType: 'Patient',
            searchParams: new URLSearchParams({
              _count: '10'
            })
          },
          this._options
      );
    }
    return undefined;
  }

  public medicationRequestSearch(patient: Patient, name?: string):
    Observable<OperationOutcome | Bundle & { type: 'searchset' }> | undefined {
    if (this._baseUrl && patient.id) {
      if (name) {
        let search = name.trim();
        search = search.replace(/ /g, ',');
        return this._fhirClient.resourceSearch<OperationOutcome | Bundle & { type: 'searchset' }>(
            this._baseUrl,
            {
              resourceType: 'MedicationRequest',
              searchParams: new URLSearchParams({
                subject: patient.id,
                'code:text': search
              })
            },
            this._options
        );
      }
      return this._fhirClient.resourceSearch<OperationOutcome | Bundle & { type: 'searchset' }>(
          this._baseUrl,
          {
            resourceType: 'MedicationRequest',
            searchParams: new URLSearchParams({
              subject: patient.id
            })},
          this._options
      );
    }
    return undefined;
  }

  public medicationRequestSave(medicationRequest: MedicationRequest): Observable<OperationOutcome | Resource> | undefined {
    if (medicationRequest.contained) {
      const medications = lodash.cloneDeep(medicationRequest.contained);
      medicationRequest.contained.length = 0;
      delete medicationRequest.contained;
      if (medications.length === 1) {
          const observable = this.resourceSave(medications[0]);
          if (observable) {
              return observable
                  .pipe(
                      switchMap(medication => {
                          if (FhirTypeGuard.isMedication(medication) && medication.id) {
                              medicationRequest.medicationReference = new ReferenceBuilder(medication.id)
                                  .resourceType('Medication')
                                  .build();
                          }
                          const innerObservable = this.resourceSave(medicationRequest);
                          if (innerObservable) {
                              return innerObservable;
                          }
                          return of({
                              issue: [{
                                  severity: 'error',
                                  code: 'unknown'
                              }]
                          } as OperationOutcome);
                      })
                  );
          }
      }
      else {
        const observables = new Array<Observable<OperationOutcome | Resource>>();
        // TODO manage compound medication (resolve id from medication tree)
        medications.forEach(medication => {
            const observable = this.resourceSave(medication);
            if (observable) {
                observables.push(observable);
            }
        });
      }
    }
    return undefined;
  }

  public resourceSave(resource: Resource): Observable<OperationOutcome | Resource> | undefined {
    if (this._baseUrl) {
      return this._fhirClient.create<OperationOutcome | Resource>(
        this._baseUrl,
          {
            resourceType: resource.resourceType,
            input: resource
          },
          this._options
      );
    }
    return undefined;
  }
}
