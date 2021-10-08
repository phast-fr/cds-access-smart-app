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

  constructor(private _stateService: StateService,
              private _fhirClient: FhirClientService,
              private _http: HttpClient) {
    this._baseUrl$ = new BehaviorSubject<string | boolean>(false);
    this._accessToken$ = new BehaviorSubject<string | boolean>(false);
  }

  public get baseUrl$(): Observable<string | boolean> {
    return this._baseUrl$.asObservable();
  }

  public get accessToken$(): Observable<string | boolean> {
    return this._accessToken$.asObservable();
  }

  public launch(context: string, iss: string, launch: string, redirectUri?: string): void {
    sessionStorage.clear();
    sessionStorage.setItem('context', context);
    if (redirectUri) {
      sessionStorage.setItem('redirect_uri', redirectUri);
    }
    this.setBaseUrl(iss);

    const state = nanoid(16);

    const options = {
      headers: new HttpHeaders()
        .set('Accept', 'application/fhir+json,application/json')
        .set('Content-type', 'application/fhir+json')
    } as Options;

    this._fhirClient.smartAuthMetadata(iss, options)
      .subscribe({
        next: metadata => {
          let params = new HttpParams()
            .set('response_type', 'code')
            .set('client_id', environment.client_id.get(context) as string)
            .set('launch', launch)
            .set('scope', environment.scope.get(context) as string)
            .set('state', state)
            .set('aud', iss);

          if (redirectUri) {
            params = params.set('redirect_uri', redirectUri);
          }

          window.location.href = metadata.authorizeUrl.href + '?' + params.toString();
        },
        error: err => console.error('error', err)
      });
  }

  public retrieveContext(code: string, state: string): void {
    const options = {
      headers: new HttpHeaders()
        .set('Accept', 'application/fhir+json,application/json')
        .set('Content-type', 'application/fhir+json')
    } as Options;

    const baseUrl = this.getBaseUrl();
    if (baseUrl) {
      this._fhirClient.smartAuthMetadata(baseUrl, options)
        .subscribe({
          next: metadata => {
            const context = sessionStorage.getItem('context');
            if (context) {
              let body = new HttpParams()
                .set('grant_type', 'authorization_code')
                .set('client_id', environment.client_id.get(context) as string)
                .set('code', code)
                .set('state', state);

              const redirectUri = sessionStorage.getItem('redirect_uri');
              if (redirectUri) {
                body = body.set('redirect_uri', redirectUri);
              }

              this.doPostToken(metadata.tokenUrl.href, body.toString());
            }
          },
          error: err => console.error('error', err)
        });
    }
  }

  public refreshContext(): void {
    const refreshToken = sessionStorage.getItem('refresh_token');
    if (refreshToken == null || refreshToken === '') { return; }
    const options = {
      headers: new HttpHeaders()
        .set('Accept', 'application/fhir+json,application/json')
        .set('Content-type', 'application/fhir+json')
    } as Options;

    const baseUrl = this.getBaseUrl();
    if (baseUrl) {
      this._fhirClient.smartAuthMetadata(baseUrl, options)
        .subscribe({
          next: metadata => {
            const context = sessionStorage.getItem('context');
            if (context) {
              const body = new HttpParams()
                .set('grant_type', 'refresh_token')
                .set('refresh_token', refreshToken)
                .set('scope', environment.scope.get(context) as string);

              this.doPostToken(metadata.tokenUrl.href, body.toString());
            }
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

    const user = this.getUser<SmartUser>(context.id_token);
    const state = new StateModel();
    state.context = context;
    state.user = user;
    state.needPatientBanner = context.need_patient_banner;
    state.intent = context.intent;

    const options = {
      headers: new HttpHeaders()
        .set('Accept', 'application/fhir+json,application/json')
        .set('Content-type', 'application/fhir+json')
        .set('Authorization', `Bearer ${this.getAccessToken()}`)
    } as Options;

    if (context.iss) {
      if (context.iss && context.patient) {
        this._fhirClient.read<Patient>(context.iss, {
          resourceType: 'Patient',
          id: context.patient
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

      this._fhirClient.read(context.iss, {
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
      this.refreshContext();
    }
    else {
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

      const state = new StateModel();
      state.context = context;
      if (context.id_token) {
        state.user = this.getUser<SmartUser>(context.id_token);
      }
      state.needPatientBanner = context.need_patient_banner;
      if (context.intent) {
        state.intent = context.intent;
      }

      const options = {
        headers: new HttpHeaders()
          .set('Accept', 'application/fhir+json,application/json')
          .set('Content-type', 'application/fhir+json')
          .set('Authorization', `Bearer ${this.getAccessToken()}`)
      } as Options;

      if (context.iss) {
        if (context.patient && context.patient !== 'undefined') {
          this._fhirClient.read(context.iss, {
            resourceType: 'Patient',
            id: context.patient
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

        this._fhirClient.read(context.iss, {
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
      this._http.post<SmartContext>(url, body, {
        headers: new HttpHeaders()
          .set('Content-Type', 'application/x-www-form-urlencoded;charset=utf-8')
          .set('Accept', 'application/json')
      }).subscribe({
        next: context => {
          console.log('smart context', context);
          this.saveContext(context);
        },
        error: err => console.error('error', err)
      });
  }
}
