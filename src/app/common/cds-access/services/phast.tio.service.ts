/**
 * @license
 * Copyright PHAST SARL All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://cds-access.phast.fr/license
 */
import { Injectable } from '@angular/core';
import {HttpHeaders} from '@angular/common/http';
import {Observable} from 'rxjs';

import { environment } from '../../../../environments/environment';
import {FhirClientService, Options} from '../../fhir/services/fhir.client.service';
import { id, OperationOutcome, ValueSet, url } from 'phast-fhir-ts';

/**
 * @ngModule CdsAccessModule
 * @description
 *
 * // TODO put here the description
 */
@Injectable()
export class PhastTioService {

  private readonly _options: Options;

  constructor(private _fhirClient: FhirClientService) {
    this._options = {
      headers: new HttpHeaders()
        .set('Accept', 'application/json; charset=utf-8; q=1')
        .set('Content-type', 'application/fhir+json')
        .set('Authorization', `Basic ${environment.cio_dc_credential}`)
    } as Options;
  }

  public valueSet(valueSetId: id): Observable<OperationOutcome | ValueSet> {
    return this._fhirClient.read<OperationOutcome | ValueSet>(environment.tio_url, {
      resourceType: 'ValueSet',
      id: valueSetId
    }, this._options);
  }

  public valueSet$expand(valueSetUrl: url): Observable<OperationOutcome | ValueSet> {
    const input = {
      url: valueSetUrl,
      displayLanguage: environment.display_language
    };
    return this._fhirClient.operation<OperationOutcome | ValueSet>(environment.tio_url, {
      name: '$expand',
      resourceType: 'ValueSet',
      method: 'get',
      input
    }, this._options);
  }
}
