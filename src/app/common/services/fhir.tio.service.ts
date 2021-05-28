import { Injectable } from '@angular/core';

import FhirClient from 'fhir-kit-client';

import { environment } from '../../../environments/environment';

import { fhir } from '../fhir/fhir.types';
import id = fhir.id;
import ValueSet = fhir.ValueSet;
import OperationOutcome = fhir.OperationOutcome;

@Injectable()
export class FhirTioService {

  private _fhirClient: FhirClient;

  constructor() {
    this._fhirClient = new FhirClient({
      baseUrl: environment.tio_url,
      customHeaders: {
        Authorization: 'Basic ' + environment.tio_credential,
        Accept: 'application/json'
      }
    });
  }

  public valueSet(valueSetId: id): Promise<OperationOutcome | ValueSet> {
    return this._fhirClient.read({
      resourceType: 'ValueSet',
      id: valueSetId
    });
  }

  public valueSet$expand(valueSetId: id): Promise<OperationOutcome | ValueSet> {
    const input = {
      displayLanguage: environment.display_language
    };
    return this._fhirClient.operation({
      name: '$expand',
      resourceType: 'ValueSet',
      id: valueSetId,
      method: 'get',
      input
    });
  }
}
