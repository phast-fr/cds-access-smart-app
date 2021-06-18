import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';

import FhirClient from 'fhir-kit-client';

import { environment } from '../../../environments/environment';

import { Utils } from '../../common/utils';
import { StateService } from '../../common/services/state.service';
import { StateModel } from '../../common/models/state.model';
import { SmartToken } from '../models/smart.token.model';
import { SmartUserModel } from '../models/smart.user.model';

@Injectable()
export class SmartService {

  private _fhirClient: FhirClient;

  constructor(private _stateService: StateService,
              private _httpClient: HttpClient) {
  }

  public launch(context: string, iss: string, launch: string, redirectUri?: string): void {
    sessionStorage.clear();
    sessionStorage.setItem('context', context);
    sessionStorage.setItem('iss', iss);
    if (redirectUri) {
      sessionStorage.setItem('redirect_uri', redirectUri);
    }

    const state = Utils.randomString(16);

    const fhirClient = this.getFhirClient();
    fhirClient.smartAuthMetadata().then(
      (capabilityStatement) => {
        const params = new HttpParams()
          .set('response_type', 'code')
          .set('client_id', environment.client_id[context])
          .set('redirect_uri', redirectUri)
          .set('launch', launch)
          .set('scope', environment.scope[context])
          .set('state', state)
          .set('aud', iss);

        window.location.href = capabilityStatement.authorizeUrl.href + '?' + params.toString();
      })
      .catch(
        (reason) => {
            console.log('reason:', reason);
          }
      );
  }

  public retrieveToken(code: string, state: string): void {
    const fhirClient = this.getFhirClient();
    fhirClient.smartAuthMetadata().then(
      (capabilityStatement) => {
        const context = sessionStorage.getItem('context');
        const redirectUri = sessionStorage.getItem('redirect_uri');
        const body = new HttpParams()
          .set('grant_type', 'authorization_code')
          .set('redirect_uri', redirectUri)
          .set('client_id', environment.client_id[context])
          .set('code', code)
          .set('state', state);

        this.doPostToken(capabilityStatement.tokenUrl.href, body.toString());
      },
      (error) => {
        console.log(error);
      });
  }

  public refreshToken(): void {
    const fhirClient = this.getFhirClient();
    const context = sessionStorage.getItem('context');
    const refreshToken = sessionStorage.getItem('refresh_token');
    if (refreshToken == null || refreshToken === '') { return; }
    fhirClient.smartAuthMetadata().then(
      (capabilityStatement) => {
        const body = new HttpParams()
          .set('grant_type', 'refresh_token')
          .set('refresh_token', refreshToken)
          .set('scope', environment.scope[context]);

        this.doPostToken(capabilityStatement.tokenUrl.href, body.toString());
      });
  }

  public saveToken(token: SmartToken): void {
    const expireDate = new Date().getTime() + (1000 * token.expires_in);
    sessionStorage.setItem('access_token', token.access_token);
    sessionStorage.setItem('expire_date', String(expireDate));
    sessionStorage.setItem('id_token', token.id_token);
    sessionStorage.setItem('patient', token.patient);
    sessionStorage.setItem('need_patient_banner', String(token.need_patient_banner));
    this.getFhirClient().bearerToken = token.access_token;

    const user = this._stateService.getUser<SmartUserModel>(token.id_token);
    console.log('smartUser', user);

    const state = new StateModel();
    state.patient = token.patient;
    state.user = user;
    state.needPatientBanner = token.need_patient_banner;
    this._stateService.emitState(state);
  }

  public loadToken(): void {
    if (this.isTokenExpired()) {
      this.refreshToken();
    }
    else {
      this.getFhirClient().bearerToken = sessionStorage.getItem('access_token');
      const patient = sessionStorage.getItem('patient');
      const idToken = sessionStorage.getItem('id_token');
      const needPatientBanner = sessionStorage.getItem('need_patient_banner');
      const user = this._stateService.getUser<SmartUserModel>(idToken);

      const state = new StateModel();
      state.patient = patient;
      state.user = user;
      state.needPatientBanner = Boolean(needPatientBanner);
      this._stateService.emitState(state);
    }
  }

  public isTokenExpired(): boolean {
    const expireDate = sessionStorage.getItem('expire_date');
    return new Date().getTime() > +expireDate;
  }

  public getFhirClient(): FhirClient {
    const iss = sessionStorage.getItem('iss');

    if (this._fhirClient == null) {
      this._fhirClient = new FhirClient({baseUrl: iss});
    }
    else {
      this._fhirClient.baseUrl = iss;
    }
    return this._fhirClient;
  }

  public isTokenExist(): boolean {
    return sessionStorage.getItem('access_token') != null;
  }

  private doPostToken(url: string, body: string): void {
      this._httpClient.post(url, body, {
        headers: new HttpHeaders()
          .set('Content-Type', 'application/x-www-form-urlencoded')
      }).subscribe({
        next: value => {
          const token = value as SmartToken;
          console.log('token:', token);
          this.saveToken(token);
        },
        error: error => console.log('Error: ', error)
      });
  }
}
