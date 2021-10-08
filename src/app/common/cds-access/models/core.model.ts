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
import {Component, OnDestroy, OnInit} from '@angular/core';
import {ActivatedRoute} from '@angular/router';
import {Subject} from 'rxjs';
import {filter, map, takeUntil} from 'rxjs/operators';
import {SmartUser} from '../../fhir/smart/models/fhir.smart.user.model';
import {FhirSmartService} from '../../fhir/smart/services/fhir.smart.service';
import {Element, Patient, Practitioner, Resource} from 'phast-fhir-ts';
import {SmartContext} from '../../fhir/smart/models/fhir.smart.context.model';

/**
 * @ngModule CdsAccessModule
 * @description
 *
 * A label provider maps an element of the ui's model to optional text string used to display the element in the
 * ui's control
 */
export interface ILabelProvider<T> {
  getText(source: T): string | undefined;
}

/**
 * @ngModule CdsAccessModule
 * @description
 *
 * Extends ILabelProvider with the method to provide the text form a code system
 */
export interface ITermLabelProvider<T> extends ILabelProvider<T> {
  getTerm(source: T, system: string): string | undefined;
}

/**
 * @ngModule CdsAccessModule
 * @description
 *
 * // TODO put here documentation
 */
export interface IAdapterFactory {
  getAdapter<T>(adaptableObject: object, adapterType: string): T;

  getAdapterList(): Array<string>;
}

/**
 * @ngModule CdsAccessModule
 * @description
 *
 * Generic element used by DataSource objects, allowing to put in a table of FHIR resources or elements
 */
export interface TableElement<T extends Resource | Element> {
  position: number;
  resource: T;
}

/**
 * @ngModule CdsAccessModule
 * @description
 *
 * // TODO
 */
export interface IStateModel {
  user?: SmartUser;
  patient?: Patient;
  practitioner?: Practitioner;
  needPatientBanner: boolean;
  intent?: string;
}

/**
 * @ngModule CdsAccessModule
 * @description
 *
 * // TODO
 */
export class StateModel implements IStateModel {

  private _context?: SmartContext;

  private _user?: SmartUser;

  patient?: Patient;

  practitioner?: Practitioner;

  needPatientBanner: boolean;

  intent?: string;

  constructor() {
    this.needPatientBanner = false;
  }

  public get context(): SmartContext | undefined {
    return this._context;
  }

  public set context(context: SmartContext | undefined) {
    this._context = context;
  }

  public get user(): SmartUser | undefined {
    return this._user;
  }

  public set user(user: SmartUser | undefined) {
    this._user = user;
  }

  public userType(): string | undefined {
    const profile = this._user?.profile;
    if (profile) {
      return profile.split('/')[0];
    }
    return undefined;
  }

  public userId(): string | undefined {
    const profile = this._user?.profile;
    if (profile) {
      return profile.split('/')[1];
    }
    return undefined;
  }
}

@Component({template: ''})
export abstract class SmartComponent implements OnInit, OnDestroy {

  private readonly _unsubscribeTrigger$: Subject<void>;

  protected constructor(private _route: ActivatedRoute,
                        private _smartService: FhirSmartService) {
    this._unsubscribeTrigger$ = new Subject<void>();
  }

  protected get unsubscribeTrigger$(): Subject<void> {
    return this._unsubscribeTrigger$;
  }

  public ngOnInit(): void {
    const routeWithoutToken$ = this._route.queryParams
      .pipe(
        filter(() => !this._smartService.isTokenExist())
      );
    const routeWithToken$ = this._route.queryParams
      .pipe(
        filter(() => this._smartService.isTokenExist())
      );
    routeWithoutToken$
      .pipe(
        takeUntil(this._unsubscribeTrigger$),
        filter(params => params.code && params.state),
        map(params  => {
          return {
            code: params.code,
            state: params.state
          };
        })
      )
      .subscribe({
        next: value => this._smartService.retrieveContext(value.code, value.state),
        error: err => console.error(err)
      });
    routeWithToken$
      .pipe(
        takeUntil(this._unsubscribeTrigger$)
      )
      .subscribe({
        next: () => this._smartService.loadContext(),
        error: err => console.error(err)
      });
  }

  public ngOnDestroy(): void {
    this._unsubscribeTrigger$.next();
    this._unsubscribeTrigger$.complete();
  }
}

