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
import jwt_decode from 'jwt-decode';

import {nanoid} from 'nanoid';
import {Patient, Practitioner} from 'phast-fhir-ts';

import {Utils} from '../../../cds-access/utils/utils';
import {StateService} from '../../../cds-access/services/state.service';
import {FhirClientService, Options} from '../../services/fhir.client.service';
import {StateModel} from '../../../cds-access/models/core.model';
import {SmartContext, SmartOnFHIR} from '../models/fhir.smart.context.model';
import {SmartUser} from '../models/fhir.smart.user.model';
import {FhirTypeGuard} from '../../utils/fhir.type.guard';

import {environment} from '../../../../../environments/environment';


@Injectable()
export class FhirSmartService {

  private readonly _iss$: BehaviorSubject<string | boolean>;

  private readonly _accessToken$: BehaviorSubject<string | boolean>;

  constructor(
      private _stateService: StateService,
      private _fhirClient: FhirClientService,
      private _http: HttpClient
  ) {
    this._iss$ = new BehaviorSubject<string | boolean>(false);
    this._accessToken$ = new BehaviorSubject<string | boolean>(false);
  }

  public get iss$(): Observable<string | boolean> {
    return this._iss$.asObservable();
  }

  public get accessToken$(): Observable<string | boolean> {
    return this._accessToken$.asObservable();
  }

  public obtainAuthorizationCode(context: string, iss: string, redirectUri: string, launch: string | null): void {
    if (environment.override_iss) {
      iss = environment.overridden_iss;
    }
    const params = this.buildSmartLaunchParams(context, iss, redirectUri, launch);
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

  public obtainAccessToken(code: string, state: string): void {
    const body = this.buildAuthorizationBody(code, state);
    const iss = this.getISS();
    if (iss && body) {
      this._fhirClient.smartAuthMetadata(iss, this.getHttpOptions())
        .subscribe({
          next: metadata => {
            this.doPostToken(metadata.tokenUrl.href, body.toString());
          },
          error: err => console.error('error', err)
        });
    }
  }

  public isSupportedRefreshToken(): boolean {
    return !!sessionStorage.getItem(SmartOnFHIR.REFRESH_TOKEN);
  }

  public obtainRefreshToken(): void {
    const body = this.buildRefreshAuthorizationBody();
    const iss = this.getISS();
    if (iss && body) {
      this._fhirClient.smartAuthMetadata(iss, this.getHttpOptions())
        .subscribe({
          next: metadata => {
            this.doPostToken(metadata.tokenUrl.href, body.toString());
          },
          error: err => console.error('error', err)
        });
    }
  }

  public saveSmartContext(smartContext: SmartContext): void {
    const iss = this.getISS();
    if (iss) {
      smartContext.iss = iss;
    }
    this.setSmartContextToSession(smartContext);

    const state = this.getStateModel(smartContext);
    const options = this.getHttpOptionsWithAccessToken();
    let patientToken = null;

    if (smartContext.id_token){
      const bits = this.getDecodedAccessToken(smartContext.id_token)?.patient?.split("/");
      patientToken = bits? bits[bits.length-1] : undefined;
    }

    if (smartContext.iss) {
      if (smartContext.patient) {
        this._fhirClient.read<Patient>(
            smartContext.iss,
            {
              resourceType: 'Patient',
              id: smartContext.patient
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
      } else if (patientToken) {
        this._fhirClient.read<Patient>(
            smartContext.iss,
            {
              resourceType: 'Patient',
              id: patientToken
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

      const userId = state.userId();
      const userType = state.userType();
      if (userId && userType === 'Practitioner') {
        this._fhirClient.read(
            smartContext.iss,
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
                if (smartContext.patient && state.patient) {
                  this._stateService.emitState(state);
                }
                else if (!smartContext.patient) {
                  this._stateService.emitState(state);
                }
              },
              error: err => console.error('error', err)
            });
      }
      else {
        console.error('User', 'UserID cannot be empty and this Smart App is dedicated to Practitioner ' +
            `(userId: ${userId}, userType: ${userType})`);
      }
    }
  }

  public loadSmartContext(): void {
    if (this.isTokenExpired()) {
      if (this.isSupportedRefreshToken()) {
        this.obtainRefreshToken();
      }
      else {
        this.obtainAuthorizationCode(
            sessionStorage['context'],
            sessionStorage[SmartOnFHIR.ISS],
            sessionStorage[SmartOnFHIR.REDIRECT_URI],
            sessionStorage[SmartOnFHIR.LAUNCH]
        );
      }
    }
    else {
      const smartContext = this.getSmartContextFromSession();
      const state = this.getStateModel(smartContext);
      const options = this.getHttpOptionsWithAccessToken();
      if (smartContext.iss) {
        if (smartContext.patient
            && smartContext.patient !== 'undefined') {
          this._fhirClient.read(
              smartContext.iss,
              {
                resourceType: 'Patient',
                id: smartContext.patient
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
        const userId = state.userId();
        const userType = state.userType();
        if (userId && userType === 'Practitioner') {
          this._fhirClient.read(
              smartContext.iss,
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
                  if (smartContext.patient !== 'undefined' && state.patient) {
                    this._stateService.emitState(state);
                  }
                  else if (smartContext.patient === 'undefined') {
                    this._stateService.emitState(state);
                  }
                },
                error: err => console.error('error', err)
              });
        }
        else {
          console.error('User', 'UserID cannot be empty and this Smart App is dedicated to Practitioner ' +
              `(userId: ${userId}, userType: ${userType})`);
        }
      }
    }
  }

  public isTokenExpired(): boolean {
    const expireDate = sessionStorage.getItem(SmartOnFHIR.EXPIRE_DATE);
    if (expireDate) {
      return new Date().getTime() > +expireDate;
    }
    return true;
  }

  public isTokenExist(): boolean {
    return sessionStorage.getItem(SmartOnFHIR.ACCESS_TOKEN) != null;
  }

  public getUser<T>(tokenId: string): T {
    return Utils.jwtDecode(tokenId) as any;
  }

  private buildSmartLaunchParams(smartApp: string, iss: string, redirectUri: string, launch: string | null): HttpParams | boolean {
    if (!smartApp) {
      console.error('Smart Application cannot be undefined');
      return false;
    }
    if (smartApp !== 'prescription' && smartApp !== 'formulary'
        && smartApp !== 'dispense' && smartApp !== 'cqleditor') {
      console.error('context is not supported', smartApp);
      return false;
    }
    if (!environment.client_id) {
      console.error('client_id is undefined');
      return false;
    }
    if (!environment.client_id[smartApp]) {
      console.error('client_id is not supported for context', smartApp);
      return false;
    }
    const clientId = environment.client_id[smartApp];
    sessionStorage.clear();
    sessionStorage.setItem('context', smartApp);
    this.setISS(iss);
    sessionStorage.setItem(SmartOnFHIR.REDIRECT_URI, redirectUri);
    if (launch) {
      sessionStorage.setItem(SmartOnFHIR.LAUNCH, launch);
    }

    const state = nanoid(16);

    let params = new HttpParams()
        .set(SmartOnFHIR.RESPONSE_TYPE, 'code')
        .set(SmartOnFHIR.CLIENT_ID, clientId)
        .set(SmartOnFHIR.REDIRECT_URI, redirectUri)
        .set(SmartOnFHIR.SCOPE, environment.scope[smartApp])
        .set(SmartOnFHIR.STATE, state)
        .set(SmartOnFHIR.AUD, iss);

    if (launch) {
      params = params.set(SmartOnFHIR.LAUNCH, launch);
    }
    return params;
  }

  private setISS(value: string): void {
    sessionStorage.setItem(SmartOnFHIR.ISS, value);
    this._iss$.next(value);
  }

  private getISS(): string | undefined  {
    if (this._iss$.value) {
      return this._iss$.value as string;
    }

    const iss = sessionStorage.getItem(SmartOnFHIR.ISS);
    if (iss) {
      this._iss$.next(iss);
      return this._iss$.value as string;
    }
    return undefined;
  }

  private setAccessToken(value: string): void {
    sessionStorage.setItem(SmartOnFHIR.ACCESS_TOKEN, value);
    this._accessToken$.next(value);
  }

  private getAccessToken(): string | undefined {
    if (this._accessToken$.value) {
      return this._accessToken$.value as string;
    }
    const accessToken = sessionStorage.getItem(SmartOnFHIR.ACCESS_TOKEN);
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
          next: smartContext => {
            console.log('smart context: ', smartContext);
            smartContext.need_patient_banner = true;
            this.saveSmartContext(smartContext); 
          },
          error: err => console.error('error: ', err)
    });
  }

  private buildAuthorizationBody(code: string, state: string): HttpParams | boolean {
    const smartApp = sessionStorage['context'];
    if (typeof smartApp !== 'string') {
      console.error('context is not string type', smartApp);
      return false;
    }
    if (smartApp !== 'prescription' && smartApp !== 'formulary'
        && smartApp !== 'dispense' && smartApp !== 'cqleditor') {
      console.error('context is not supported', smartApp);
      return false;
    }
    if (!environment.client_id) {
      console.error('client_id is undefined');
      return false;
    }
    const clientId = environment.client_id[smartApp];
    let body = new HttpParams()
        .set(SmartOnFHIR.GRANT_TYPE, 'authorization_code')
        .set(SmartOnFHIR.CLIENT_ID, clientId)
        .set(SmartOnFHIR.CODE, code)
        .set(SmartOnFHIR.STATE, state);

    const redirectUri = sessionStorage.getItem(SmartOnFHIR.REDIRECT_URI);
    if (redirectUri) {
      body = body.set(SmartOnFHIR.REDIRECT_URI, redirectUri);
    }
    return body;
  }

  private buildRefreshAuthorizationBody(): HttpParams | boolean {
    const refreshToken = sessionStorage.getItem(SmartOnFHIR.REFRESH_TOKEN);
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
        .set(SmartOnFHIR.GRANT_TYPE, 'refresh_token')
        .set(SmartOnFHIR.REFRESH_TOKEN, refreshToken)
        .set(SmartOnFHIR.SCOPE, environment.scope[context]);
  }

  private setSmartContextToSession(context: SmartContext): void {
    this.setAccessToken(context.access_token);
    sessionStorage.setItem(SmartOnFHIR.EXPIRES_IN, String(context.expires_in));
    sessionStorage.setItem(SmartOnFHIR.EXPIRE_DATE, String(new Date().getTime() + (1000 * context.expires_in)));
    sessionStorage.setItem(SmartOnFHIR.SCOPE, context.scope);
    sessionStorage.setItem(SmartOnFHIR.TOKEN_TYPE, context.token_type);
    sessionStorage.setItem(SmartOnFHIR.ID_TOKEN, context.id_token);
    sessionStorage.setItem(SmartOnFHIR.PATIENT, context.patient);
    sessionStorage.setItem('need_patient_banner', String(context.need_patient_banner));
    if (context.refresh_token) {
      sessionStorage.setItem(SmartOnFHIR.REFRESH_TOKEN, context.refresh_token);
    }
    if (context.intent) {
      sessionStorage.setItem('intent', context.intent);
    }
    if (context.service_id) {
      sessionStorage.setItem('service_id', context.service_id);
    }
  }

  private getSmartContextFromSession(): SmartContext {
    const context = {} as SmartContext;
    const iss = this.getISS();
    if (iss) {
      context.iss = iss;
    }
    const accessToken = this.getAccessToken();
    if (accessToken) {
      context.access_token = accessToken;
    }
    context.expires_in = Number(sessionStorage.getItem(SmartOnFHIR.EXPIRES_IN));
    const scope = sessionStorage.getItem(SmartOnFHIR.SCOPE);
    if (scope) {
      context.scope = scope;
    }
    const tokenType = sessionStorage.getItem(SmartOnFHIR.TOKEN_TYPE);
    if (tokenType) {
      context.token_type = tokenType;
    }
    const idToken = sessionStorage.getItem(SmartOnFHIR.ID_TOKEN);
    if (idToken) {
      context.id_token = idToken;
    }
    const patientId = sessionStorage.getItem(SmartOnFHIR.PATIENT);
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

  private getDecodedAccessToken(token: string): any {
    try {
      return jwt_decode(token);
    } catch(Error) {
      return null;
    }
  }
}