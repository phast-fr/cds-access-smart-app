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
import {find, forkJoin, Observable, of, switchMap} from 'rxjs';
import {catchError, filter, map} from 'rxjs/operators';

import { FhirSmartService } from '../smart/services/fhir.smart.service';
import {FhirClientService, Options} from './fhir.client.service';
import {Bundle, Composition, id, MedicationRequest, OperationOutcome, Patient, Practitioner, Resource} from 'phast-fhir-ts';
import {FhirTypeGuard} from '../utils/fhir.type.guard';
import {ReferenceBuilder} from '../builders/fhir.resource.builder';

@Injectable()
export class FhirDataSourceService {

  private _options?: Options;

  private _baseUrl?: string;

  constructor(
      private _smartService: FhirSmartService,
      private _fhirClient: FhirClientService
  ) {
    this._smartService.iss$
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

  public postResourceSearch(path: string): Observable<OperationOutcome | Bundle & { type: 'searchset' }> | undefined {
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
          return this._fhirClient.postResourceSearch<OperationOutcome | Bundle & { type: 'searchset' }>(
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

  public bundleSave(bundle: Bundle): Observable<OperationOutcome[] | Resource[]> {
      if (!bundle.entry) {
          throw new Error('bundle entry cannot be undefined');
      }
      const medicationRequest = bundle.entry
          .filter(entry => FhirTypeGuard.isMedicationRequest(entry.resource))
          .map(entry => entry.resource)
          .map(resource => resource as MedicationRequest)
          .reduce((_, current) => current);
      return forkJoin(
          bundle.entry
              .filter(entry => FhirTypeGuard.isMedication(entry.resource))
              .map(entry => { return {
                  // tslint:disable-next-line:no-non-null-assertion
                  localId: entry.resource!!.id!!,
                  observable: this.resourceSave(entry.resource)
              }; })
              .map(result => result.observable
                  .pipe(
                      // tslint:disable-next-line:no-non-null-assertion
                      find(() => medicationRequest.medicationReference!!.reference!!.endsWith(result.localId)),
                      switchMap(medication => {
                          if (!medication || !medication.id) {
                              return of({
                                  issue: [{
                                      severity: 'error',
                                      code: 'unknown',
                                      diagnostics: 'medication id is undefined'
                                  }]
                              } as OperationOutcome);
                          }
                          medicationRequest.authoredOn = new Date().toISOString();
                          medicationRequest.medicationReference = new ReferenceBuilder(medication.id)
                              .resourceType('Medication')
                              .build();
                          return this.resourceSave(medicationRequest);
                      })
                  )
              )
      );
  }

  public resourceSave(resource: Resource | undefined): Observable<OperationOutcome | Resource> {
      if (!this._baseUrl) {
          throw new Error('baseUrl cannot be undefined');
      }
      if (!resource) {
          throw new Error('resource cannot be undefined');
      }
      return this._fhirClient.create<OperationOutcome | Resource>(
        this._baseUrl,
          {
            resourceType: resource.resourceType,
            input: resource
          },
          this._options
      ).pipe(
          catchError(err =>
              of({
                  issue: [{
                      severity: err.severity,
                      code: err.code,
                      diagnostics: err
                  }]
              } as OperationOutcome)
          )
      );
  }
}
