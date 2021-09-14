import { Injectable } from '@angular/core';
import {HttpClient, HttpContext, HttpHeaders, HttpParams} from '@angular/common/http';
import {Observable} from 'rxjs';
import {map} from 'rxjs/operators';

import * as queryString from 'querystring';
import {ParsedUrlQueryInput} from 'querystring';
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
  searchParams: ParsedUrlQueryInput;
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

  constructor(private _http: HttpClient) {
  }

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
        finalUrl.push(`?${queryString.stringify(params.input)}`);
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
    const query = queryString.stringify(params.searchParams);
    if (query) {
      searchPath += `?${query}`;
    }
    return this._http.get<T>(searchPath, options);
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
