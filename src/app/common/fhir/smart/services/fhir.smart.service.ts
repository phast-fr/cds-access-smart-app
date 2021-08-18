import { Injectable } from '@angular/core';
import {HttpClient, HttpHeaders, HttpParams} from '@angular/common/http';
import {BehaviorSubject, Observable} from 'rxjs';
import {filter, map} from 'rxjs/operators';

import { Utils } from '../../../cds-access/utils/utils';
import { StateService } from '../../../cds-access/services/state.service';
import {FhirClientService, Options} from '../../services/fhir.client.service';
import {StateModel} from '../../../cds-access/models/core.model';
import { SmartToken } from '../models/fhir.smart.token.model';
import { FhirSmartUserModel } from '../models/fhir.smart.user.model';
import {FhirTypeGuard} from '../../utils/fhir.type.guard';
import { Patient, Practitioner } from 'phast-fhir-ts';

import {environment} from '../../../../../environments/environment';

@Injectable()
export class FhirSmartService {

  private readonly _baseUrl: BehaviorSubject<string | boolean>;

  private readonly _accessToken: BehaviorSubject<string | boolean>;

  constructor(private _stateService: StateService,
              private _fhirClient: FhirClientService,
              private _http: HttpClient) {
    this._baseUrl = new BehaviorSubject<string | boolean>(false);
    this._accessToken = new BehaviorSubject<string | boolean>(false);
  }

  public get baseUrl$(): Observable<string | boolean> {
    return this._baseUrl.asObservable();
  }

  public get accessToken$(): Observable<string | boolean> {
    return this._accessToken.asObservable();
  }

  public launch(context: string, iss: string, launch: string, redirectUri?: string): void {
    sessionStorage.clear();
    sessionStorage.setItem('context', context);
    if (redirectUri) {
      sessionStorage.setItem('redirect_uri', redirectUri);
    }
    this.baseUrl = iss;

    const state = Utils.randomString(16);

    const options = {
      headers: new HttpHeaders()
        .set('Accept', 'application/fhir+json,application/json')
        .set('Content-type', 'application/fhir+json')
    } as Options;

    this._fhirClient.smartAuthMetadata(iss, options)
      .subscribe({
        next: metadata => {
          const params = new HttpParams()
            .set('response_type', 'code')
            .set('client_id', environment.client_id[context])
            .set('redirect_uri', redirectUri)
            .set('launch', launch)
            .set('scope', environment.scope[context])
            .set('state', state)
            .set('aud', iss);

          window.location.href = metadata.authorizeUrl.href + '?' + params.toString();
        },
        error: err => console.error('error', err)
      });
  }

  public retrieveToken(code: string, state: string): void {
    const options = {
      headers: new HttpHeaders()
        .set('Accept', 'application/fhir+json,application/json')
        .set('Content-type', 'application/fhir+json')
    } as Options;

    this._fhirClient.smartAuthMetadata(sessionStorage.getItem('iss'), options)
      .subscribe({
        next: metadata => {
          const context = sessionStorage.getItem('context');
          const redirectUri = sessionStorage.getItem('redirect_uri');
          const body = new HttpParams()
            .set('grant_type', 'authorization_code')
            .set('redirect_uri', redirectUri)
            .set('client_id', environment.client_id[context])
            .set('code', code)
            .set('state', state);

          this.doPostToken(metadata.tokenUrl.href, body.toString());
        },
        error: err => console.error('error', err)
      });
  }

  public refreshToken(): void {
    const context = sessionStorage.getItem('context');
    const refreshToken = sessionStorage.getItem('refresh_token');
    if (refreshToken == null || refreshToken === '') { return; }
    const options = {
      headers: new HttpHeaders()
        .set('Accept', 'application/fhir+json,application/json')
        .set('Content-type', 'application/fhir+json')
    } as Options;

    this._fhirClient.smartAuthMetadata(sessionStorage.getItem('iss'), options)
      .subscribe({
        next: metadata => {
          const body = new HttpParams()
            .set('grant_type', 'refresh_token')
            .set('refresh_token', refreshToken)
            .set('scope', environment.scope[context]);

          this.doPostToken(metadata.tokenUrl.href, body.toString());
        },
        error: err => console.error('error', err)
      });
  }

  public saveToken(token: SmartToken): void {
    const expireDate = new Date().getTime() + (1000 * token.expires_in);
    sessionStorage.setItem('access_token', token.access_token);
    sessionStorage.setItem('expire_date', String(expireDate));
    sessionStorage.setItem('id_token', token.id_token);
    sessionStorage.setItem('patient_id', token.patient);
    sessionStorage.setItem('need_patient_banner', String(token.need_patient_banner));
    sessionStorage.setItem('intent', token?.intent);

    const user = this.getUser<FhirSmartUserModel>(token.id_token);
    console.log('smartUser', user);

    const state = new StateModel();
    state.user = user;
    state.needPatientBanner = token.need_patient_banner;
    state.intent = token.intent;

    const options = {
      headers: new HttpHeaders()
        .set('Accept', 'application/fhir+json,application/json')
        .set('Content-type', 'application/fhir+json')
        .set('Authorization', `Bearer ${sessionStorage.getItem('access_token')}`)
    } as Options;

    if (token.patient) {
      this._fhirClient.read<Patient>(sessionStorage.getItem('iss'), {
        resourceType: 'Patient',
        id: token.patient
      }, options)
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

    this._fhirClient.read(sessionStorage.getItem('iss'), {
        resourceType: 'Practitioner',
        id: state.userId()
      }, options)
      .pipe(
        filter(practitioner => FhirTypeGuard.isPractitioner(practitioner)),
        map(practitioner => practitioner as Practitioner)
      )
      .subscribe({
        next: practitioner => {
          state.practitioner = practitioner;
          if (token.patient && state.patient) {
            this._stateService.emitState(state);
          }
          else if (!token.patient) {
            this._stateService.emitState(state);
          }
        },
        error: err => console.error('error', err)
      });
  }

  public loadToken(): void {
    if (this.isTokenExpired()) {
      this.refreshToken();
    }
    else {
      const idPatient = sessionStorage.getItem('patient_id');
      const idToken = sessionStorage.getItem('id_token');
      const needPatientBanner = sessionStorage.getItem('need_patient_banner');
      const intent = sessionStorage.getItem('intent');

      const state = new StateModel();
      state.user = this.getUser<FhirSmartUserModel>(idToken);
      state.needPatientBanner = needPatientBanner === 'true';
      state.intent = intent;

      const options = {
        headers: new HttpHeaders()
          .set('Accept', 'application/fhir+json,application/json')
          .set('Content-type', 'application/fhir+json')
          .set('Authorization', `Bearer ${sessionStorage.getItem('access_token')}`)
      } as Options;

      if (idPatient !== 'undefined') {
        this._fhirClient.read(sessionStorage.getItem('iss'), {
          resourceType: 'Patient',
          id: idPatient
        }, options)
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

      this._fhirClient.read(sessionStorage.getItem('iss'), {
        resourceType: 'Practitioner',
        id: state.userId()
      }, options)
        .pipe(
          filter(practitioner => FhirTypeGuard.isPractitioner(practitioner)),
          map(practitioner => practitioner as Practitioner)
        )
        .subscribe({
          next: practitioner => {
            state.practitioner = practitioner;
            if (idPatient !== 'undefined' && state.patient) {
              this._stateService.emitState(state);
            }
            else if (idPatient === 'undefined') {
              this._stateService.emitState(state);
            }
          },
          error: err => console.error('error', err)
        });
    }
  }

  public isTokenExpired(): boolean {
    const expireDate = sessionStorage.getItem('expire_date');
    return new Date().getTime() > +expireDate;
  }

  public isTokenExist(): boolean {
    return sessionStorage.getItem('access_token') != null;
  }

  public getUser<T>(tokenId: string): T {
    return this.jwtDecode(tokenId) as any;
  }

  private set baseUrl(value: string) {
    sessionStorage.setItem('iss', value);
    this._baseUrl.next(value);
  }

  private doPostToken(url: string, body: string): void {
      this._http.post<SmartToken>(url, body, {
        headers: new HttpHeaders()
          .set('Content-Type', 'application/x-www-form-urlencoded;charset=utf-8')
          .set('Accept', 'application/json')
          .set('Accept-Charset', 'utf-8')
      }).subscribe({
        next: token => {
          console.log('token', token);
          this.saveToken(token);
        },
        error: err => console.error('error', err)
      });
  }

  /**
   * Decodes a JWT token and returns it's body.
   * @param tokenId The token to read
   * @category Utility
   */
  private jwtDecode(tokenId: string): object {
    const payload = tokenId.split('.')[1];
    return JSON.parse(atob(payload));
  }
}
