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

    public $cql(iss: string, token: string, patient: Patient, contentData: string): Observable<OperationOutcome | Bundle & { type: 'collection' }> {
        const parameters = {
            resourceType : ResourceType.Parameters,
            parameter: [
                {
                    name: 'code',
                    valueString: contentData
                },
                {
                    name : 'patientId',
                    valueString : patient.id
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
                    valueString : environment.library_url
                },
                {
                    name : 'libraryCredential',
                    valueString : environment.library_credential
                }
            ]
        } as Parameters;
        return this._fhirClient.operation<OperationOutcome | Bundle & { type: 'collection' }>(environment.cql_service_url, {
            name: '$cql',
            input: JSON.stringify(parameters)
        }, this._options);
    }
}
