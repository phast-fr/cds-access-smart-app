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
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import {retry} from 'rxjs/operators';

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
    // to manage cqf-ruler
    hook.fhirServer = environment.cds_hooks_url + '/fhir';
    return this._httpClient.post<CdsCards>(FhirCdsHooksService.CDS_SERVICES + '/' + service.id, hook, this._options)
      .pipe(
        retry(3)
      );
  }
}
