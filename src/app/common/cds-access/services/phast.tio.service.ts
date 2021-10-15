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
        .set('Authorization', `Basic ${environment.tio_credential}`)
    } as Options;
  }

  public valueSet(valueSetId: id): Observable<OperationOutcome | ValueSet> {
    return this._fhirClient.read<OperationOutcome | ValueSet>(environment.tio_url, {
      resourceType: 'ValueSet',
      id: valueSetId
    }, this._options);
  }

  public valueSet$expand(valueSetUrl: url): Observable<OperationOutcome | ValueSet> {
    const input = new URLSearchParams({
      url: valueSetUrl,
      displayLanguage: environment.display_language
    });
    return this._fhirClient.operation<OperationOutcome | ValueSet>(environment.tio_url, {
      name: '$expand',
      resourceType: 'ValueSet',
      method: 'get',
      input
    }, this._options);
  }
}
