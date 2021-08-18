/**
 * @license
 * Copyright PHAST SARL All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://cds-access.phast.fr/license
 */
import {Observable} from 'rxjs';

/**
 * @ngModule CdsAccessModule
 * @description
 *
 * Implemented by the classes that must display a new state at each change of state
 */
export interface IRender<T> {
  render(state: T): void;
}

/**
 * @ngModule CdsAccessModule
 * @description
 *
 * Implemented by the classes having to start from the (old) state and from a partial state, to create a new state
 */
export interface IReducer<T extends IState> {
  reduce(state: T, partialState: IPartialState): T;
}

/**
 * @ngModule CdsAccessModule
 * @description
 *
 * Implemented by the classes being the central object of the MVI architecture. These are the classes that execute the tasks and update the
 * states
 */
export interface IViewModel<I extends IIntent, S extends IState> {
  dispatchIntent(intent: I): void;
  state$(): Observable<S>;
}

/**
 * @ngModule CdsAccessModule
 * @description
 *
 * Implemented by classes expressing the user's intention
 */
export interface IIntent {
  readonly type: string;
}

/**
 * @ngModule CdsAccessModule
 * @description
 *
 * Implemented by the classes performing an action on the models modifying the state. These state changes are characterized by the
 * construction of a partial state
 */
export interface IAction {
  readonly type: string;

  execute(): IPartialState;
}

/**
 * @ngModule CdsAccessModule
 * @description
 *
 * Implemented by the classes representing a partial state following an action
 */
export interface IPartialState {
  readonly type: string;
}

/**
 * @ngModule CdsAccessModule
 * @description
 *
 * Implemented by classes representing a state
 */
export interface IState {
  type: string;
}
