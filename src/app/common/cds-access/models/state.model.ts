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
  readonly type: string;
}
