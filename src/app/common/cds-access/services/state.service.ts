/**
 * @license
 * Copyright PHAST SARL All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://cds-access.phast.fr/license
 */
import { Injectable } from '@angular/core';
import {BehaviorSubject, Observable} from 'rxjs';

import {StateModel} from '../models/core.model';


/**
 * @ngModule CdsAccessModule
 * @description
 *
 * // TODO put here the description
 */
@Injectable()
export class StateService {

  private _stateSubject$: BehaviorSubject<StateModel | boolean>;

  constructor() {
    this._stateSubject$ = new BehaviorSubject<StateModel | boolean>(false);
  }

  public get state$(): Observable<StateModel | boolean> {
    return this._stateSubject$.asObservable();
  }

  public get state(): StateModel | boolean {
    return this._stateSubject$.value;
  }

  public emitState(state: StateModel): void {
    this._stateSubject$.next(state);
  }
}
