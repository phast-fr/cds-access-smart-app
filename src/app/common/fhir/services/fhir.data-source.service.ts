import { Injectable } from '@angular/core';
import {HttpHeaders} from '@angular/common/http';
import {Observable} from 'rxjs';
import {filter, map} from 'rxjs/operators';

import { FhirSmartService } from '../smart/services/fhir.smart.service';
import {FhirClientService, Options} from './fhir.client.service';
import { Bundle, Composition, id, OperationOutcome, Patient, Practitioner, Resource } from 'phast-fhir-ts';

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
      return this._fhirClient.read<OperationOutcome | Patient>(this._baseUrl, {
        resourceType: 'Patient',
        id: patientId
      }, this._options);
    }
    return undefined;
  }

  public practitionerRead(practitionerId: id): Observable<OperationOutcome | Practitioner> | undefined {
    if (this._baseUrl) {
      return this._fhirClient.read<OperationOutcome | Practitioner>(this._baseUrl, {
        resourceType: 'Practitioner',
        id: practitionerId
      }, this._options);
    }
    return undefined;
  }

  public compositionRead(compositionId: id): Observable<OperationOutcome | Composition> | undefined {
    if (this._baseUrl) {
      return this._fhirClient.read<OperationOutcome | Composition>(this._baseUrl, {
        resourceType: 'Composition',
        id: compositionId
      }, this._options);
    }
    return undefined;
  }

  public resourceSearch(path: string): Observable<OperationOutcome | Bundle & { type: 'searchset' }> | undefined {
    if (this._baseUrl) {
      const resourceTypeSearch = path.split('?');
      const resourceType = resourceTypeSearch[0];
      const search = resourceTypeSearch[1];

      const searchParams = new URLSearchParams();
      for (const part of search.split('&')) {
        const keyValue = part.split('=');
        const key = keyValue[0];
        searchParams.set(key, keyValue[1]);
      }
      return this._fhirClient.resourceSearch<OperationOutcome | Bundle & { type: 'searchset' }>(this._baseUrl, {
        resourceType,
        searchParams
      }, this._options);
    }
    return undefined;
  }

  public patientSearch(name?: string): Observable<OperationOutcome | Bundle & { type: 'searchset' }> | undefined {
    if (this._baseUrl) {
      if (name) {
        let search = name.trim();
        search = search.replace(/ /g, ',');
        return this._fhirClient.resourceSearch<OperationOutcome | Bundle & { type: 'searchset' }>(this._baseUrl, {
          resourceType: 'Patient',
          searchParams: new URLSearchParams({
              _count: '10',
              name: search
          })
        }, this._options);
      }
      return this._fhirClient.resourceSearch(this._baseUrl, {
        resourceType: 'Patient',
        searchParams: new URLSearchParams({
          _count: '10'
        })
      }, this._options);
    }
    return undefined;
  }

  public medicationRequestSearch(patient: Patient, name?: string):
    Observable<OperationOutcome | Bundle & { type: 'searchset' }> | undefined {
    if (this._baseUrl && patient.id) {
      if (name) {
        let search = name.trim();
        search = search.replace(/ /g, ',');
        if (search) {
          return this._fhirClient.resourceSearch<OperationOutcome | Bundle & { type: 'searchset' }>(this._baseUrl, {
            resourceType: 'MedicationRequest',
            searchParams: new URLSearchParams({
              subject: patient.id,
              'code:text': search
            })
          }, this._options);
        }
      }
      return this._fhirClient.resourceSearch<OperationOutcome | Bundle & { type: 'searchset' }>(this._baseUrl, {
        resourceType: 'MedicationRequest',
        searchParams: new URLSearchParams({
          subject: patient.id
        })
      }, this._options);
    }
    return undefined;
  }

  public resourceSave(resource: Resource): Observable<OperationOutcome | Resource> | undefined {
    if (this._baseUrl) {
      return this._fhirClient.create<OperationOutcome | Resource>(
        this._baseUrl, {
          resourceType: resource.resourceType,
          input: resource
        }, this._options);
    }
    return undefined;
  }
}
