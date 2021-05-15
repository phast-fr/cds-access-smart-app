import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';

import FhirClient from 'fhir-kit-client';

import { environment } from '../../../environments/environment';
import { SmartToken } from '../models/smart.token.model';
import { StateService } from '../../common/services/state.service';
import { SmartUserModel } from '../models/smart.user.model';

@Injectable()
export class SmartService {

  private fhirClient: FhirClient;

  constructor(
    private stateService: StateService,
    private httpClient: HttpClient) {}

  launch(iss: string, launch: string): void {
    sessionStorage.clear();
    sessionStorage.setItem('iss', iss);

    const state = this.randomString(16);

    const fhirClient = this.getFhirClient();
    fhirClient.smartAuthMetadata().then(
      (capabilityStatement) => {
        const params = new HttpParams()
          .set('response_type', 'code')
          .set('client_id', environment.client_id)
          .set('redirect_uri', environment.redirect_uri)
          .set('launch', launch)
          .set('scope', environment.scope)
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

  retrieveToken(code: string, state: string): void {
    const fhirClient = this.getFhirClient();
    fhirClient.smartAuthMetadata().then(
      (capabilityStatement) => {
        const body = new HttpParams()
          .set('grant_type', 'authorization_code')
          .set('redirect_uri', environment.redirect_uri)
          .set('client_id', environment.client_id)
          .set('code', code)
          .set('state', state);

        this.doPostToken(capabilityStatement.tokenUrl.href, body.toString());
      },
      (error) => {
        console.log(error);
      });
  }

  refreshToken(): void {
    const fhirClient = this.getFhirClient();
    const refreshToken = sessionStorage.getItem('refresh_token');
    if (refreshToken == null || refreshToken === '') { return; }
    fhirClient.smartAuthMetadata().then(
      (capabilityStatement) => {
        const body = new HttpParams()
          .set('grant_type', 'refresh_token')
          .set('refresh_token', refreshToken)
          .set('scope', environment.scope);

        this.doPostToken(capabilityStatement.tokenUrl.href, body.toString());
      });
  }

  saveToken(token: SmartToken): void {
    const expireDate = new Date().getTime() + (1000 * token.expires_in);
    sessionStorage.setItem('access_token', token.access_token);
    sessionStorage.setItem('expire_date', String(expireDate));
    sessionStorage.setItem('id_token', token.id_token);
    sessionStorage.setItem('patient', token.patient);
    this.getFhirClient().bearerToken = token.access_token;

    const user = this.stateService.getUser<SmartUserModel>(token.id_token);
    console.log('smartUser', user);

    this.stateService.emitState({
      token,
      user
    });
  }

  isTokenExpired(): boolean {
    const expireDate = sessionStorage.getItem('expire_date');
    return new Date().getTime() > +expireDate;
  }

  getHttpClient(): HttpClient {
    return this.httpClient;
  }

  getFhirClient(): FhirClient {
    const iss = sessionStorage.getItem('iss');

    if (this.fhirClient == null) {
      this.fhirClient = new FhirClient({baseUrl: iss});
    }
    else {
      this.fhirClient.baseUrl = iss;
    }
    return this.fhirClient;
  }

  isTokenExist(): boolean {
    return sessionStorage.getItem('access_token') != null;
  }

  private doPostToken(url: string, body: string): void {
      this.httpClient.post(url, body, {
        headers: new HttpHeaders()
          .set('Content-Type', 'application/x-www-form-urlencoded')
      }).subscribe(
        (value => {
          const token = value as SmartToken;
          console.log('token:', token);
          this.saveToken(token);
        }),
        (error => {
          console.log(error);
        })
      );
  }

  /**
   * Generates random strings. By default this returns random 8 characters long
   * alphanumeric strings.
   * @param strLength The length of the output string. Defaults to 8.
   * @param charSet A string containing all the possible characters.
   *     Defaults to all the upper and lower-case letters plus digits.
   * @category Utility
   */
  private randomString(
    strLength = 8,
    charSet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  ): string
  {
    const result = [];
    const len = charSet.length;
    while (strLength--) {
      result.push(charSet.charAt(Math.floor(Math.random() * len)));
    }
    return result.join('');
  }
}
