import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { retry } from 'rxjs/operators';

import { v4 as uuidv4 } from 'uuid';

import { environment } from '../../../../../environments/environment';
import { CdsCards, Hook, Service, Services } from '../models/fhir.cdshooks.model';

@Injectable()
export class FhirCdsHooksService {

  private static readonly CDS_SERVICES = environment.cds_hooks_url + '/cds-services';

  private readonly _options: object;

  constructor(private _httpClient: HttpClient) {
    this._options = {
      headers: new HttpHeaders()
        .set('Accept', 'application/json; charset=utf-8; q=1')
    };
  }

  public getServices(): Observable<Services> {
    return this._httpClient.get<Services>(FhirCdsHooksService.CDS_SERVICES, this._options)
      .pipe(
        retry(3)
      );
  }

  public postHook(service: Service, hook: Hook): Observable<CdsCards> {
    hook.hook = service.hook;
    hook.hookInstance = uuidv4();
    // to manage cqf-ruler
    hook.fhirServer = environment.cds_hooks_url + '/fhir';

    return this._httpClient.post<CdsCards>(FhirCdsHooksService.CDS_SERVICES + '/' + service.id, hook, this._options)
      .pipe(
        retry(3)
      );
  }
}
