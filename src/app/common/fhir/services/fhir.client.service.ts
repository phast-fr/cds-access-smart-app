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

import { Injectable } from '@angular/core';
import {HttpClient, HttpContext, HttpHeaders, HttpParams} from '@angular/common/http';
import {Observable} from 'rxjs';
import {map} from 'rxjs/operators';

import {id, OperationOutcome, Resource} from 'phast-fhir-ts';

export interface Options {
  headers?: HttpHeaders;
  context?: HttpContext;
  observe?: 'body';
  params?: HttpParams | {
    [param: string]: string | number | boolean | ReadonlyArray<string | number | boolean>;
  };
  reportProgress?: boolean;
  responseType?: 'json';
  withCredentials?: boolean;
}

export interface RequestOptions {
  body?: any;
  headers?: HttpHeaders;
  context?: HttpContext;
  observe?: 'body';
  params?: HttpParams | {
    [param: string]: string | number | boolean | ReadonlyArray<string | number | boolean>;
  };
  reportProgress?: boolean;
  responseType: 'json';
  withCredentials?: boolean;
}

export interface SearchParameters {
  resourceType: string;
  searchParams: URLSearchParams;
}

export interface Parameters {
  name?: string;
  resourceType?: string;
  id?: id;
  method?: string;
  input?: any;
}

export interface SmartOAuthMetadata {
  authorizeUrl: URL;
  tokenUrl: URL;
  registerUrl: URL;
  manageUrl: URL;
}

@Injectable()
export class FhirClientService {

  constructor(
      private _http: HttpClient
  ) {}

  public smartAuthMetadata(baseUrl: string, options: Options): Observable<SmartOAuthMetadata> {
    const normalizedBaseUrl = baseUrl.replace(/\/*$/, '/');
    return this._http.get(`${normalizedBaseUrl}.well-known/smart-configuration`, options)
      .pipe(
        map(result => this.authFromWellKnown(result)),
      );
  }

  public operation<T>(baseUrl: string, params: Parameters, options: Options): Observable<T> {
    const finalUrl = ['/'];

    if (params.resourceType) { finalUrl.push(`${params.resourceType}/`); }
    if (params.id) { finalUrl.push(`${params.id}/`); }

    if (params.name) {
      finalUrl.push(`${params.name.startsWith('$') ? params.name : `$${params.name}`}`);
    }

    if (params.method === 'post') {
      return this._http.post<T>(baseUrl + finalUrl.join(''), params.input, options);
    }
    else if (params.method === 'get') {
      if (params.input) {
        finalUrl.push(`?${params.input.toString()}`);
      }
      return this._http.get<T>(baseUrl + finalUrl.join(''), options);
    }
    return this._http.post<T>(baseUrl + finalUrl.join(''), params.input, options);
  }

  public request(method: string, baseUrl: string, options: RequestOptions): Observable<OperationOutcome | Resource> {
    return this._http.request<OperationOutcome | Resource>(method, baseUrl, options);
  }

  public create<T>(baseUrl: string, params: Parameters, options?: Options): Observable<T> {
    return this._http.post<T>(`${baseUrl}/${params.resourceType}`, params.input, options);
  }

  // delete

  public read<T>(baseUrl: string, params: Parameters, options?: Options): Observable<T> {
    return this._http.get<T>(`${baseUrl}/${params.resourceType}/${params.id}`, options);
  }

  // vread

  public update<T>(baseUrl: string, params: Parameters, options: Options): Observable<T> {
    return this._http.put<T>(`${baseUrl}/${params.resourceType}/${params.id}`, params.input, options);
  }

  // patch
  // batch
  // transaction
  // nextPage
  // prevPage
  // history

  public resourceSearch<T>(baseUrl: string, params: SearchParameters, options?: Options): Observable<T> {
    let searchPath = `${baseUrl}/${params.resourceType}`;
    const query = params.searchParams.toString();
    if (query) {
      searchPath += `?${query}`;
    }
    return this._http.get<T>(searchPath, options);
  }

  public postResourceSearch<T>(baseUrl: string, params: SearchParameters, options?: Options): Observable<T> {
    const searchPath = `${baseUrl}/${params.resourceType}/_search`;
    if (options?.headers) {
      options.headers = options?.headers.set('Content-Type', 'application/x-www-form-urlencoded');
    }
    else if (options) {
      options.headers = new HttpHeaders().set('Content-Type', 'application/x-www-form-urlencoded');
    }
    else {
      options = {
        headers: new HttpHeaders().set('Content-Type', 'application/x-www-form-urlencoded')
      };
    }
    return this._http.post<T>(searchPath, params.searchParams.toString(), options);
  }

  private authFromWellKnown(wellKnown: any): SmartOAuthMetadata {
    const {
      authorization_endpoint,
      token_endpoint,
      registration_endpoint,
    } = wellKnown;

    return {
      authorizeUrl: authorization_endpoint && new URL(authorization_endpoint),
      tokenUrl: token_endpoint && new URL(token_endpoint),
      registerUrl: registration_endpoint && new URL(registration_endpoint),
    } as SmartOAuthMetadata;
  }
}
