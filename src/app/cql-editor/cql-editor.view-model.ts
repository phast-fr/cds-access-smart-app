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
import { Injectable } from '@angular/core';
import {BehaviorSubject, Observable, Subject, switchMap} from 'rxjs';
import {filter, map} from 'rxjs/operators';

import {Bundle, Library, OperationOutcome, Patient} from 'phast-fhir-ts';

import {IAction, IIntent, IViewModel} from '../common/cds-access/models/state.model';
import {CqlEditorState} from './cql-editor.state';
import {CqlEditorReducer} from './cql-editor.reducer';
import {PhastCioCdsService} from '../common/cds-access/services/phast.cio.cds.service';
import {
  CqlEditorActionOnChangeContentLibrary,
  CqlEditorActionOnChangeLibrary,
  CqlEditorActionOnRunLibrary,
  CqlEditorActionOnSaveLibrary, CqlEditorActionOnSearchLibrary
} from './cql-editor.action';
import {
  CqlEditorIntentOnChangeContentLibrary,
  CqlEditorIntentOnChangeLibrary,
  CqlEditorIntentOnRunLibrary,
  CqlEditorIntentOnSaveLibrary, CqlEditorIntentOnSearchLibrary
} from './cql-editor.intent';
import {PhastCQLService} from '../common/cds-access/services/phast.cql.service';

@Injectable()
export class CqlEditorViewModel implements IViewModel<IIntent, CqlEditorState>{

  private readonly _state$: BehaviorSubject<CqlEditorState>;

  private readonly _intents$: Subject<IIntent>;

  private readonly _reducer: CqlEditorReducer;

  constructor(private _cioCdsSource: PhastCioCdsService,
              private _cqlService: PhastCQLService) {
    this._intents$ = new Subject<IIntent>();
    this._state$ = new BehaviorSubject<CqlEditorState>(new CqlEditorState('init'));
    this._reducer = new CqlEditorReducer(this);
    this.handlerIntent();
  }

  public dispatchIntent(intent: IIntent): void {
    this._intents$.next(intent);
  }

  public state$(): Observable<CqlEditorState> {
    return this._state$.asObservable();
  }

  public get library(): Library | undefined {
    if (this._state$.value) {
      const state = this._state$.value;
      return state.library;
    }
    return undefined;
  }

  public searchLibraryCQL(filter?: string | undefined): Observable<OperationOutcome | Bundle & { type: 'searchset' }> {
    return this._cioCdsSource.searchLibraryCQL(filter);
  }

  public updateLibrary(library: Library): Observable<Library> {
    return this._cioCdsSource.updateLibraryCQL(library);
  }

  public $cql(iss: string, token: string, patient: Patient, contentData: string): Observable<OperationOutcome | Bundle & { type: 'collection' }> {
    return this._cqlService.$cql(iss, token, patient, contentData);
  }

  private handlerIntent(): void {
    this._intents$
      .pipe(
        map(intent => this.intentToAction(intent)),
        filter(action => !!action),
        map(action => action as IAction),
        map(action => action.execute()),
        switchMap(partialState => this._reducer.reduce(this._state$.value as CqlEditorState, partialState))
      )
      .subscribe({
        next: state => this.emitState(state as CqlEditorState),
        error: err => console.error('error', err)
      });
  }

  private intentToAction(intent: IIntent): IAction | undefined {
    let action: IAction | undefined;
    switch (intent.type) {
      case 'OnChangeLibrary':
        action = new CqlEditorActionOnChangeLibrary(
            (intent as CqlEditorIntentOnChangeLibrary).library
        );
        break;
      case 'OnChangeContentLibrary':
        action = new CqlEditorActionOnChangeContentLibrary(
            (intent as CqlEditorIntentOnChangeContentLibrary).library,
            (intent as CqlEditorIntentOnChangeContentLibrary).data
        );
        break;
      case 'OnSaveLibrary':
        action = new CqlEditorActionOnSaveLibrary(
            (intent as CqlEditorIntentOnSaveLibrary).library
        );
        break;
      case 'OnRunLibrary':
        action = new CqlEditorActionOnRunLibrary(
            (intent as CqlEditorIntentOnRunLibrary).context,
            (intent as CqlEditorIntentOnRunLibrary).patient,
            (intent as CqlEditorIntentOnRunLibrary).data
        );
        break;
      case 'OnSearchLibrary':
        action = new CqlEditorActionOnSearchLibrary(
            (intent as CqlEditorIntentOnSearchLibrary).value
        );
        break;
      default:
        console.log('cannot find an action for this intent: ', intent);
        break;
    }
    return action;
  }

  private emitState(newSate: CqlEditorState): void {
    this._state$.next(newSate);
  }
}
