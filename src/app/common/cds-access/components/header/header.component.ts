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
import {ChangeDetectionStrategy, Component, OnDestroy} from '@angular/core';
import {DomSanitizer} from '@angular/platform-browser';
import {MatIconRegistry} from '@angular/material/icon';
import {BehaviorSubject, Observable, Subject} from 'rxjs';
import {filter, map, takeUntil} from 'rxjs/operators';

import {StateService} from '../../services/state.service';
import {StateModel} from '../../models/core.model';
import {Patient, Practitioner} from 'phast-fhir-ts';

const HEALTH_WORKER_FORM_ICON =
  '<svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">' +
  '<path fill-rule="evenodd" clip-rule="evenodd" d="M17 7C17 5.34315 18.3431 4 20 4H28C29.6569 4 31 5.34315 31 7V9C31 10.6569 29.6569 12 28 12H20C18.3431 12 17 10.6569 17 9V7ZM20 6C19.4477 6 19 6.44772 19 7V9C19 9.55228 19.4477 10 20 10H28C28.5523 10 29 9.55228 29 9V7C29 6.44772 28.5523 6 28 6H20Z" fill="#333333"/>' +
  '<path fill-rule="evenodd" clip-rule="evenodd" d="M18 7H13C11.3431 7 10 8.34315 10 10V41C10 42.6569 11.3431 44 13 44H35C36.6569 44 38 42.6569 38 41V10C38 8.34315 36.6569 7 35 7H30V9C30 10.1046 29.1046 11 28 11H20C18.8954 11 18 10.1046 18 9V7ZM15 21C15 20.4477 15.4477 20 16 20H23C23.5523 20 24 20.4477 24 21C24 21.5523 23.5523 22 23 22H16C15.4477 22 15 21.5523 15 21ZM16 15C15.4477 15 15 15.4477 15 16C15 16.5523 15.4477 17 16 17H31.5C32.0523 17 32.5 16.5523 32.5 16C32.5 15.4477 32.0523 15 31.5 15H16ZM17 29V31H19V29H17ZM16 27C15.4477 27 15 27.4477 15 28V32C15 32.5523 15.4477 33 16 33H20C20.5523 33 21 32.5523 21 32V28C21 27.4477 20.5523 27 20 27H16ZM31 29C31 30.6575 29.6575 32 28 32C26.3425 32 25 30.6575 25 29C25 27.3425 26.3425 26 28 26C29.6575 26 31 27.3425 31 29ZM28 33.3182C25.9975 33.3182 22 34.3842 22 36.5001V38.9999H34V36.5001C34 34.3842 30.0025 33.3182 28 33.3182Z" fill="#333333"/>' +
  '</svg>';
const DOCTOR_ICON =
  '<svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">' +
  '<path d="M30.9667 29.0316C31.211 29.0897 31.4557 29.1528 31.7004 29.2207C31.7017 29.2529 31.7029 29.2865 31.7039 29.3216C31.7166 29.7731 31.6914 30.3428 31.6343 30.9323C31.5978 31.3091 31.5503 31.674 31.497 32H31C30.2425 32 29.5499 32.428 29.2111 33.1055L28.2111 35.1055C28.0723 35.3833 28 35.6895 28 36V38C28 39.1045 28.8954 40 30 40H32H33H34H36C37.1046 40 38 39.1045 38 38V36C38 35.6895 37.9277 35.3833 37.7889 35.1055L36.7889 33.1055C36.5312 32.5903 36.0691 32.2194 35.5294 32.0712C35.5624 31.8227 35.5913 31.5697 35.6157 31.3176C35.6335 31.1336 35.6492 30.9468 35.6623 30.7594C37.0266 31.4565 38.2337 32.2756 39.1556 33.156C40.3862 34.3312 41 35.5058 41 36.5699V41H7V36.5699C7 35.4577 7.67155 34.2255 9.00752 33.0036C10.0428 32.0566 11.4026 31.1879 12.9214 30.473C12.9428 30.6908 12.9672 30.9083 12.9939 31.1226C13.0768 31.7866 13.1865 32.4542 13.3106 33.0392C12.5066 33.77 12 34.8255 12 36C12 38.2091 13.7909 40 16 40C18.2091 40 20 38.2091 20 36C20 34.2157 18.8324 32.7053 17.2193 32.1895C17.1245 31.7392 17.0337 31.1928 16.9632 30.6273C16.8941 30.0737 16.8487 29.5356 16.8341 29.0801C16.855 29.0749 16.8759 29.0697 16.8968 29.0646C16.9349 29.1336 16.9735 29.2101 17.0202 29.3033L17.0223 29.3074C17.0503 29.3633 17.0826 29.4277 17.1151 29.4896L17.3963 30.0237H18H22.0639H22.0642C22.9772 30.0235 23.4296 30.0236 23.8862 30.0237H23.8901H23.8928C24.3393 30.0238 24.7924 30.0239 25.6851 30.0237C25.6852 30.0237 25.6852 30.0237 25.6853 30.0237H29.7493H30.3529L30.6341 29.4896C30.7147 29.3365 30.8425 29.1512 30.965 29.0333C30.9656 29.0327 30.9662 29.0322 30.9667 29.0316ZM32 17C32 21.4202 28.4202 25 24 25C19.5798 25 16 21.4202 16 17C16 12.5798 19.5798 9 24 9C28.4202 9 32 12.5798 32 17Z" fill="#333333" stroke="#333333" stroke-width="2"/>' +
  '</svg>';

/**
 * @ngModule CdsAccessModule
 * @description
 *
 * // TODO put here documentation
 */
@Component ({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class HeaderComponent implements OnDestroy {

  private readonly _unsubscribeTrigger$;

  private readonly _patient$: BehaviorSubject<Patient | undefined>;

  private readonly _practitioner$: BehaviorSubject<Practitioner | undefined>;

  private readonly _intent$: BehaviorSubject<string | undefined>;

  private readonly _intentMap: { [key: string]: string; };

  constructor(private _iconRegistry: MatIconRegistry,
              private _sanitizer: DomSanitizer,
              private _stateService: StateService) {
    this._iconRegistry.addSvgIconLiteral('health-worker-form', this._sanitizer.bypassSecurityTrustHtml(HEALTH_WORKER_FORM_ICON));
    this._iconRegistry.addSvgIconLiteral('doctor', this._sanitizer.bypassSecurityTrustHtml(DOCTOR_ICON));
    this._unsubscribeTrigger$ = new Subject<void>();
    this._patient$ = new BehaviorSubject<Patient | undefined>(undefined);
    this._practitioner$ = new BehaviorSubject<Practitioner | undefined>(undefined);
    this._intent$ = new BehaviorSubject<string | undefined>(undefined);
    this._intentMap = {nephrology: 'Néphrologie'};

    this.update(this._stateService.state);
    this._stateService.state$
      .pipe(
        takeUntil(this._unsubscribeTrigger$),
        filter(state => state !== false),
        map(state => state as StateModel),
      )
      .subscribe({
        next: state => this.update(state),
        error: err => console.error('error', err)
      });
  }

  public get patient$(): Observable<Patient | undefined> {
    return this._patient$.asObservable();
  }

  public get practitioner$(): Observable<Practitioner | undefined> {
    return this._practitioner$.asObservable();
  }

  public get intent$(): Observable<string | undefined> {
    return this._intent$.asObservable();
  }

  public get intentMap(): { [key: string]: string; } {
    return this._intentMap;
  }

  public ngOnDestroy(): void {
    this._unsubscribeTrigger$.next();
    this._unsubscribeTrigger$.complete();

    this._patient$.complete();
    this._practitioner$.complete();
    this._intent$.complete();
  }

  private update(state: StateModel | boolean): void {
    if (state) {
      const stateModel = state as StateModel;
      this._patient$.next(stateModel.patient);
      this._practitioner$.next(stateModel.practitioner);
      this._intent$.next(stateModel.intent);
    }
  }
}
