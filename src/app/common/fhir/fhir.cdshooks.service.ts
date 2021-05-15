import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { retry } from 'rxjs/operators';

import { environment } from '../../../environments/environment';
import { CdsCards, Hook, Service, Services } from './fhir.cdshooks.model';

@Injectable()
export class FhirCdsHooksService {

  private static readonly CDS_SERVICES = environment.cds_hooks_url + '/cds-services';

  private _options = {
    headers: new HttpHeaders()
      .set('Accept', 'application/json; charset=utf-8; q=1')
  };

  constructor(private _httpClient: HttpClient) { }

  public getServices(): Observable<Services> {
    return this._httpClient.get<Services>(FhirCdsHooksService.CDS_SERVICES, this._options)
      .pipe(
        retry(3)
      );
  }

  public postHook(service: Service, hook: Hook): Observable<CdsCards> {
    hook.hook = service.hook;
    hook.hookInstance = this.generateUUID();
    // to manage cqf-ruler
    hook.fhirServer = environment.cds_hooks_url + '/fhir';

    return this._httpClient.post<CdsCards>(FhirCdsHooksService.CDS_SERVICES + '/' + service.id, hook, this._options)
      .pipe(
        retry(3)
      );
  }

  private generateUUID(): string {
    let dt = new Date().getTime();
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g,
      (c) => {
      const r = (dt + Math.random() * 16) % 16 | 0;
      dt = Math.floor(dt / 16);
      return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
    });
  }
}
