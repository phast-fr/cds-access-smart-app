import { Injectable } from '@angular/core';
import {HttpHeaders} from '@angular/common/http';
import {Observable} from 'rxjs';
import {filter, map} from 'rxjs/operators';

import { FhirSmartService } from '../smart/services/fhir.smart.service';
import {FhirClientService, Options} from './fhir.client.service';
import { Bundle, Composition, id, OperationOutcome, Patient, Practitioner, Resource } from 'phast-fhir-ts';

@Injectable()
export class FhirDataSourceService {

  private readonly _options: Options;

  private _baseUrl: string;

  constructor(private _smartService: FhirSmartService,
              private _fhirClient: FhirClientService) {
    this._options = {
      headers: new HttpHeaders()
        .set('Accept', 'application/json; charset=utf-8; q=1')
        .set('Content-type', 'application/fhir+json')
    } as Options;
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
        next: accessToken => this._options.headers.set('Authorization', `Bearer ${accessToken}`),
        error: err => console.error('error', err)
      });
  }

  public patientRead(patientId: id): Observable<OperationOutcome | Patient> {
    return this._fhirClient.read<OperationOutcome | Patient>(this._baseUrl, {
      resourceType: 'Patient',
      id: patientId
    }, this._options);
  }

  public practitionerRead(practitionerId: id): Observable<OperationOutcome | Practitioner> {
    return this._fhirClient.read<OperationOutcome | Practitioner>(this._baseUrl, {
      resourceType: 'Practitioner',
      id: practitionerId
    }, this._options);
  }

  public compositionRead(compositionId: id): Observable<OperationOutcome | Composition> {
    return this._fhirClient.read<OperationOutcome | Composition>(this._baseUrl, {
      resourceType: 'Composition',
      id: compositionId
    }, this._options);
  }

  public resourceSearch(path: string): Observable<OperationOutcome | Bundle & { type: 'searchset' }> {
    const resourceTypeSearch = path.split('?');
    const resourceType = resourceTypeSearch[0];
    const search = resourceTypeSearch[1];

    const searchParams = {};
    for (const part of search.split('&')) {
      const keyValue = part.split('=');
      const key = keyValue[0];
      searchParams[key] = keyValue[1];
    }

    return this._fhirClient.resourceSearch<OperationOutcome | Bundle & { type: 'searchset' }>(this._baseUrl, {
      resourceType,
      searchParams
    }, this._options);
  }

  public patientSearch(name: string | undefined): Observable<OperationOutcome | Bundle & { type: 'searchset' }> {
      if (typeof name === 'string') {
          let search = name.trim();
          search = search.replace(/ /g, ',');
          return this._fhirClient.resourceSearch<OperationOutcome | Bundle & { type: 'searchset' }>(this._baseUrl, {
            resourceType: 'Patient',
            searchParams: {
              _count: '10',
              name: search
            }
          }, this._options);
      }
      return this._fhirClient.resourceSearch(this._baseUrl, {
        resourceType: 'Patient',
        searchParams: {
          _count: '10'
        }
      }, this._options);
  }

  public medicationRequestSearch(patient: Patient, name?: string): Observable<OperationOutcome | Bundle & { type: 'searchset' }> {
    if (typeof name === 'string') {
      let search = name.trim();
      search = search.replace(/ /g, ',');
      return this._fhirClient.resourceSearch<OperationOutcome | Bundle & { type: 'searchset' }>(this._baseUrl, {
        resourceType: 'MedicationRequest',
        searchParams: {
          subject: patient.id,
          'code:text': search
        }
      }, this._options);
    }
    return this._fhirClient.resourceSearch<OperationOutcome | Bundle & { type: 'searchset' }>(this._baseUrl, {
      resourceType: 'MedicationRequest',
      searchParams: {
        subject: patient.id
      }
    }, this._options);
  }

  public resourceSave(resource: Resource): Observable<OperationOutcome | Resource> {
    return this._fhirClient.create<OperationOutcome | Resource>(
      this._baseUrl, {
        resourceType: resource.resourceType,
        input: resource
      }, this._options);
  }
}
