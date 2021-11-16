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

import {Injectable} from '@angular/core';
import {HttpHeaders} from '@angular/common/http';
import {Observable} from 'rxjs';

import {Bundle, OperationOutcome, Parameters, Patient} from 'phast-fhir-ts';

import {FhirClientService, Options} from '../../fhir/services/fhir.client.service';
import {ResourceType} from '../../fhir/utils/fhir.resource.type';

import {environment} from '../../../../environments/environment';

@Injectable()
export class PhastCQLService {

    private readonly _options: Options;

    constructor(private _fhirClient: FhirClientService) {
        this._options = {
            headers: new HttpHeaders()
                .set('Accept', 'application/json; charset=utf-8; q=1')
                .set('Content-type', 'application/fhir+json')
        } as Options;
    }

    public $cql(iss: string, token: string, patient: Patient | null | undefined, contentData: string):
        Observable<OperationOutcome | Bundle & { type: 'collection' }> {
        const parameters = {
            resourceType : ResourceType.Parameters,
            parameter: [
                {
                    name: 'code',
                    valueString: contentData
                },
                {
                    name : 'patientId',
                    valueString : patient?.id
                },
                {
                    name: 'context',
                    valueString: ResourceType.Patient
                },
                {
                    name : 'dataServiceUri',
                    valueString : iss
                },
                {
                    name : 'dataServiceAccessToken',
                    valueString : token
                },
                {
                    name : 'terminologyServiceUri',
                    valueString : environment.tio_url
                },
                {
                    name : 'terminologyCredential',
                    valueString : environment.tio_credential
                },
                {
                    name : 'libraryServiceUri',
                    valueString : environment.cio_dc_url
                },
                {
                    name : 'libraryCredential',
                    valueString : environment.cio_dc_credential
                }
            ]
        } as Parameters;
        return this._fhirClient.operation<OperationOutcome | Bundle & { type: 'collection' }>(environment.cql_service_url, {
            name: '$cql',
            input: JSON.stringify(parameters)
        }, this._options);
    }
}
