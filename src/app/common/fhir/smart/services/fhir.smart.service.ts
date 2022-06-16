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
import {HttpClient, HttpHeaders, HttpParams} from '@angular/common/http';
import {BehaviorSubject, Observable} from 'rxjs';
import {filter, map} from 'rxjs/operators';

import {nanoid} from 'nanoid';
import {Patient, Practitioner} from 'phast-fhir-ts';

import {Utils} from '../../../cds-access/utils/utils';
import {StateService} from '../../../cds-access/services/state.service';
import {FhirClientService, Options} from '../../services/fhir.client.service';
import {StateModel} from '../../../cds-access/models/core.model';
import {SmartContext} from '../models/fhir.smart.context.model';
import {SmartUser} from '../models/fhir.smart.user.model';
import {FhirTypeGuard} from '../../utils/fhir.type.guard';

import {environment} from '../../../../../environments/environment';

@Injectable()
export class FhirSmartService {

  private readonly _baseUrl$: BehaviorSubject<string | boolean>;

  private readonly _accessToken$: BehaviorSubject<string | boolean>;

  constructor(
      private _stateService: StateService,
      private _fhirClient: FhirClientService,
      private _http: HttpClient
  ) {
    this._baseUrl$ = new BehaviorSubject<string | boolean>(false);
    this._accessToken$ = new BehaviorSubject<string | boolean>(false);
  }

  public get baseUrl$(): Observable<string | boolean> {
    return this._baseUrl$.asObservable();
  }

  public get accessToken$(): Observable<string | boolean> {
    return this._accessToken$.asObservable();
  }

  public obtainAuthorizationCode(context: string, iss: string, redirectUri: string, launch: string | null): void {
    const params = this.buildLaunchParams(context, iss, redirectUri, launch);
    if (params) {
      this._fhirClient.smartAuthMetadata(iss, this.getHttpOptions())
          .subscribe({
            next: metadata => {
              window.location.href = metadata.authorizeUrl.href + '?' + params.toString();
            },
            error: err => console.error('error', err)
          });
    }
  }

  public retrieveContext(code: string, state: string): void {
    const body = this.retrieveContextBody(code, state);
    const baseUrl = this.getBaseUrl();
    if (baseUrl && body) {
      this._fhirClient.smartAuthMetadata(baseUrl, this.getHttpOptions())
        .subscribe({
          next: metadata => {
            this.doPostToken(metadata.tokenUrl.href, body.toString());
          },
          error: err => console.error('error', err)
        });
    }
  }

  public isSupportedRefreshToken(): boolean {
    return !!sessionStorage.getItem('refresh_token');
  }

  public refreshContext(): void {
    const body = this.refreshContextBody();
    const baseUrl = this.getBaseUrl();
    if (baseUrl && body) {
      this._fhirClient.smartAuthMetadata(baseUrl, this.getHttpOptions())
        .subscribe({
          next: metadata => {
            this.doPostToken(metadata.tokenUrl.href, body.toString());
          },
          error: err => console.error('error', err)
        });
    }
  }

  public saveContext(context: SmartContext): void {
    const baseUrl = this.getBaseUrl();
    if (baseUrl) {
      context.iss = baseUrl;
    }
    this.setContextToSession(context);

    const state = this.getStateModel(context);
    const options = this.getHttpOptionsWithAccessToken();

    if (context.iss) {
      if (context.iss && context.patient) {
        this._fhirClient.read<Patient>(
            context.iss,
            {
              resourceType: 'Patient',
              id: context.patient
            },
            options
        )
          .pipe(
            filter(patient => FhirTypeGuard.isPatient(patient)),
            map(patient => patient as Patient)
          )
          .subscribe({
            next: patient => {
              state.patient = patient;
              if (state.practitioner) {
                this._stateService.emitState(state);
              }
            },
            error: err => console.error('error', err)
          });
      }

      this._fhirClient.read(
          context.iss,
          {
            resourceType: 'Practitioner',
            id: state.userId()
          },
          options
      )
          .pipe(
              filter(practitioner => FhirTypeGuard.isPractitioner(practitioner)),
              map(practitioner => practitioner as Practitioner)
          )
          .subscribe({
            next: practitioner => {
              state.practitioner = practitioner;
              if (context.patient && state.patient) {
                this._stateService.emitState(state);
              }
              else if (!context.patient) {
                this._stateService.emitState(state);
              }
            },
            error: err => console.error('error', err)
          });
    }
  }

  public loadContext(): void {
    if (this.isTokenExpired()) {
      if (this.isSupportedRefreshToken()) {
        this.refreshContext();
      }
      else {
        this.obtainAuthorizationCode(
            sessionStorage['context'],
            sessionStorage['iss'],
            sessionStorage['redirect_uri'],
            sessionStorage['launch']
        );
      }
    }
    else {
      const context = this.getContextFromSession();
      const state = this.getStateModel(context);
      const options = this.getHttpOptionsWithAccessToken();
      if (context.iss) {
        if (context.patient && context.patient !== 'undefined') {
          this._fhirClient.read(
              context.iss,
              {
                resourceType: 'Patient',
                id: context.patient
              },
              options)
              .pipe(
                filter(patient => FhirTypeGuard.isPatient(patient)),
                map(patient => patient as Patient)
              )
              .subscribe({
                next: patient => {
                  state.patient = patient;
                  if (state.practitioner) {
                    this._stateService.emitState(state);
                  }
                },
                error: err => console.error('error', err)
              });
        }
        const userId = state.userId();
        if (userId) {
          this._fhirClient.read(
              context.iss,
              {
                resourceType: 'Practitioner',
                id: userId
              },
              options
          )
              .pipe(
                  filter(practitioner => FhirTypeGuard.isPractitioner(practitioner)),
                  map(practitioner => practitioner as Practitioner)
              )
              .subscribe({
                next: practitioner => {
                  state.practitioner = practitioner;
                  if (context.patient !== 'undefined' && state.patient) {
                    this._stateService.emitState(state);
                  }
                  else if (context.patient === 'undefined') {
                    this._stateService.emitState(state);
                  }
                },
                error: err => console.error('error', err)
              });
        }
      }
    }
  }

  public isTokenExpired(): boolean {
    const expireDate = sessionStorage.getItem('expire_date');
    if (expireDate) {
      return new Date().getTime() > +expireDate;
    }
    return true;
  }

  public isTokenExist(): boolean {
    return sessionStorage.getItem('access_token') != null;
  }

  public getUser<T>(tokenId: string): T {
    return Utils.jwtDecode(tokenId) as any;
  }

  private buildLaunchParams(context: string, iss: string, redirectUri: string, launch: string | null): HttpParams | boolean {
    if (!context) {
      console.error('context cannot be undefined');
      return false;
    }
    if (context !== 'prescription' && context !== 'formulary'
        && context !== 'dispense' && context !== 'cqleditor') {
      console.error('context is not supported', context);
      return false;
    }
    if (!environment.client_id) {
      console.error('client_id is undefined');
      return false;
    }
    if (!environment.client_id[context]) {
      console.error('client_id is not supported for context', context);
      return false;
    }
    const clientId = environment.client_id[context];
    sessionStorage.clear();
    sessionStorage.setItem('context', context);
    this.setBaseUrl(iss);
    sessionStorage.setItem('redirect_uri', redirectUri);
    if (launch) {
      sessionStorage.setItem('launch', launch);
    }

    const state = nanoid(16);

    let params = new HttpParams()
        .set('response_type', 'code')
        .set('client_id', clientId)
        .set('redirect_uri', redirectUri)
        .set('scope', environment.scope[context])
        .set('state', state)
        .set('aud', iss);

    if (launch) {
      params = params.set('launch', launch);
    }
    return params;
  }

  private setBaseUrl(value: string): void {
    sessionStorage.setItem('iss', value);
    this._baseUrl$.next(value);
  }

  private getBaseUrl(): string | undefined  {
    if (this._baseUrl$.value) {
      return this._baseUrl$.value as string;
    }

    const baseUrl = sessionStorage.getItem('iss');
    if (baseUrl) {
      this._baseUrl$.next(baseUrl);
      return this._baseUrl$.value as string;
    }
    return undefined;
  }

  private setAccessToken(value: string): void {
    sessionStorage.setItem('access_token', value);
    this._accessToken$.next(value);
  }

  private getAccessToken(): string | undefined {
    if (this._accessToken$.value) {
      return this._accessToken$.value as string;
    }
    const accessToken = sessionStorage.getItem('access_token');
    if (accessToken) {
      this._accessToken$.next(accessToken);
      return this._accessToken$.value as string;
    }
    return undefined;
  }

  private doPostToken(url: string, body: string): void {
    this._http.post<SmartContext>(
        url,
        body,
        {
          headers: new HttpHeaders()
              .set('Content-Type', 'application/x-www-form-urlencoded;charset=utf-8')
              .set('Accept', 'application/json')
        })
        .subscribe({
          next: context => {
            console.log('smart context', context);
            this.saveContext(context);
          },
          error: err => console.error('error', err)
    });
  }

  private retrieveContextBody(code: string, state: string): HttpParams | boolean {
    const context = sessionStorage['context'];
    if (typeof context !== 'string') {
      console.error('context is not string type', context);
      return false;
    }
    if (context !== 'prescription' && context !== 'formulary'
        && context !== 'dispense' && context !== 'cqleditor') {
      console.error('context is not supported', context);
      return false;
    }
    if (!environment.client_id) {
      console.error('client_id is undefined');
      return false;
    }
    const clientId = environment.client_id[context];
    let body = new HttpParams()
        .set('grant_type', 'authorization_code')
        .set('client_id', clientId)
        .set('code', code)
        .set('state', state);

    const redirectUri = sessionStorage.getItem('redirect_uri');
    if (redirectUri) {
      body = body.set('redirect_uri', redirectUri);
    }
    return body;
  }

  private refreshContextBody(): HttpParams | boolean {
    const refreshToken = sessionStorage.getItem('refresh_token');
    if (!refreshToken) {
      console.error('refresh token is absent to session storage');
      return false;
    }
    const context = sessionStorage.getItem('context');
    if (context !== 'prescription' && context !== 'formulary'
        && context !== 'dispense' && context !== 'cqleditor') {
      console.error('context is not supported', context);
      return false;
    }
    return new HttpParams()
        .set('grant_type', 'refresh_token')
        .set('refresh_token', refreshToken)
        .set('scope', environment.scope[context]);
  }

  private setContextToSession(context: SmartContext): void {
    this.setAccessToken(context.access_token);
    sessionStorage.setItem('expires_in', String(context.expires_in));
    sessionStorage.setItem('expire_date', String(new Date().getTime() + (1000 * context.expires_in)));
    sessionStorage.setItem('scope', context.scope);
    sessionStorage.setItem('token_type', context.token_type);
    sessionStorage.setItem('id_token', context.id_token);
    sessionStorage.setItem('patient', context.patient);
    sessionStorage.setItem('need_patient_banner', String(context.need_patient_banner));
    if (context.refresh_token) {
      sessionStorage.setItem('refresh_token', context.refresh_token);
    }
    if (context.intent) {
      sessionStorage.setItem('intent', context.intent);
    }
    if (context.service_id) {
      sessionStorage.setItem('service_id', context.service_id);
    }
  }

  private getContextFromSession(): SmartContext {
    const context = {} as SmartContext;
    const baseUrl = this.getBaseUrl();
    if (baseUrl) {
      context.iss = baseUrl;
    }
    const accessToken = this.getAccessToken();
    if (accessToken) {
      context.access_token = accessToken;
    }
    context.expires_in = Number(sessionStorage.getItem('expires_in'));
    const scope = sessionStorage.getItem('scope');
    if (scope) {
      context.scope = scope;
    }
    const tokenType = sessionStorage.getItem('token_type');
    if (tokenType) {
      context.token_type = tokenType;
    }
    const idToken = sessionStorage.getItem('id_token');
    if (idToken) {
      context.id_token = idToken;
    }
    const patientId = sessionStorage.getItem('patient');
    if (patientId) {
      context.patient = patientId;
    }
    context.need_patient_banner = sessionStorage.getItem('need_patient_banner') === 'true';
    const intent = sessionStorage.getItem('intent');
    if (intent) {
      context.intent = intent;
    }
    const serviceId = sessionStorage.getItem('service_id');
    if (serviceId) {
      context.service_id = serviceId;
    }
    return context;
  }

  private getStateModel(context: SmartContext): StateModel {
    const state = new StateModel();
    state.context = context;
    if (context.id_token) {
      state.user = this.getUser<SmartUser>(context.id_token);
    }
    state.needPatientBanner = context.need_patient_banner;
    if (context.intent) {
      state.intent = context.intent;
    }
    return state;
  }

  private getHttpOptions(): Options {
    return  {
      headers: new HttpHeaders()
          .set('Accept', 'application/fhir+json,application/json')
          .set('Content-type', 'application/fhir+json')
    } as Options;
  }

  private getHttpOptionsWithAccessToken(): Options {
    return  {
      headers: new HttpHeaders()
          .set('Accept', 'application/fhir+json,application/json')
          .set('Content-type', 'application/fhir+json')
          .set('Authorization', `Bearer ${this.getAccessToken()}`)
    } as Options;
  }
}
