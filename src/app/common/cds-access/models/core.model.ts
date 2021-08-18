/**
 * @license
 * Copyright PHAST SARL All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://cds-access.phast.fr/license
 */
import {Component, OnDestroy, OnInit} from '@angular/core';
import {ActivatedRoute} from '@angular/router';
import {Subject} from 'rxjs';
import {filter, map, takeUntil} from 'rxjs/operators';
import {FhirSmartUserModel} from '../../fhir/smart/models/fhir.smart.user.model';
import {FhirSmartService} from '../../fhir/smart/services/fhir.smart.service';
import {Element, Patient, Practitioner, Resource} from 'phast-fhir-ts';

/**
 * @ngModule CdsAccessModule
 * @description
 *
 * A label provider maps an element of the ui's model to optional text string used to display the element in the
 * ui's control
 */
export interface ILabelProvider<T> {
  getText(T): string | null;
}

/**
 * @ngModule CdsAccessModule
 * @description
 *
 * Extends ILabelProvider with the method to provide the text form a code system
 */
export interface ITermLabelProvider<T> extends ILabelProvider<T> {
  getTerm(T, system: string): string | null;
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
  user: FhirSmartUserModel;
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

  user: FhirSmartUserModel;

  patient?: Patient;

  practitioner?: Practitioner;

  needPatientBanner: boolean;

  intent?: string;

  public userType(): string | null {
    const profile = this.user.profile;
    if (profile) {
      return profile.split('/')[0];
    }
    return null;
  }

  public userId(): string | null {
    const profile = this.user.profile;
    if (profile) {
      return profile.split('/')[1];
    }
    return null;
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
        next: value => this._smartService.retrieveToken(value.code, value.state),
        error: err => console.error(err)
      });
    routeWithToken$
      .pipe(
        takeUntil(this._unsubscribeTrigger$)
      )
      .subscribe({
        next: () => this._smartService.loadToken(),
        error: err => console.error(err)
      });
  }

  public ngOnDestroy(): void {
    this._unsubscribeTrigger$.next();
    this._unsubscribeTrigger$.complete();
  }
}

