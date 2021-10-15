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

import {firstValueFrom, of} from 'rxjs';
import {catchError} from 'rxjs/operators';

import * as lodash from 'lodash';

import {IPartialState, IReducer} from '../common/cds-access/models/state.model';

import {
  CqlEditorState,
  CqlEditorStateOnChangeContentLibrary,
  CqlEditorStateOnChangeLibrary, CqlEditorStateOnRunLibrary,
  CqlEditorStateOnSaveLibrary, CqlEditorStateOnSearchLibrary
} from './cql-editor.state';
import {CqlEditorViewModel} from './cql-editor.view-model';
import {FhirTypeGuard} from '../common/fhir/utils/fhir.type.guard';
import {Bundle, Library, Parameters} from 'phast-fhir-ts';


export class CqlEditorReducer implements IReducer<CqlEditorState> {

  constructor(private _viewModel: CqlEditorViewModel) {
  }

  public async reduce(state: CqlEditorState, partialState: IPartialState): Promise<CqlEditorState> {
    let newState: CqlEditorState;
    if (!state) {
      newState = new CqlEditorState(partialState.type);
    }
    else {
      newState = lodash.cloneDeep(state);
      newState.error = '';
      newState.oValue = '';
      newState.type = partialState.type;
    }

    switch (partialState.type) {
      case 'OnChangeLibrary':
        newState = this.onChangeLibrary(newState, partialState as CqlEditorStateOnChangeLibrary);
        break;
      case 'OnChangeContentLibrary':
        newState = this.onChangeContentLibrary(newState, partialState as CqlEditorStateOnChangeContentLibrary);
        break;
      case 'OnSaveLibrary':
        newState = await this.onSaveLibrary(newState, partialState as CqlEditorStateOnSaveLibrary);
        break;
      case 'OnRunLibrary':
        newState = await this.onRunLibrary(newState, partialState as CqlEditorStateOnRunLibrary);
        break;
      case 'OnSearchLibrary':
        newState = await this.onSearchLibrary(newState, partialState as CqlEditorStateOnSearchLibrary);
        break;
      default:
        break;
    }
    return newState;
  }

  private onChangeLibrary(newState: CqlEditorState,
                          partialState: CqlEditorStateOnChangeLibrary): CqlEditorState {
    newState.library = partialState.library;
    newState.isDirty = false;

    return newState;
  }

  private onChangeContentLibrary(newState: CqlEditorState,
                                 partialState: CqlEditorStateOnChangeContentLibrary): CqlEditorState {
    newState.library = partialState.library;
    newState.isDirty = true;

    return newState;
  }

  private async onSaveLibrary(newState: CqlEditorState,
                              partialState: CqlEditorStateOnSaveLibrary): Promise<CqlEditorState> {
    const library = await firstValueFrom(this._viewModel.updateLibrary(partialState.library)
        .pipe(
            catchError((err: any) => {
              console.error('error', err);
              newState.error = err;
              newState.oValue += '>> Library Service update failed: ' + err + '\n';
              return of('Error: ' + err);
            })
        )
    );

    if (FhirTypeGuard.isLibrary(library)) {
      newState.library = library as Library;
    }
    newState.isDirty = false;

    return newState;
  }

  private async onRunLibrary(newState: CqlEditorState,
                             partialState: CqlEditorStateOnRunLibrary): Promise<CqlEditorState> {
    const bundle = await firstValueFrom(
        this._viewModel.$cql(partialState.context.iss, partialState.context.access_token, partialState.patient, partialState.data)
        .pipe(
            catchError((err: any) => {
              console.error('error', err);
              newState.error = err;
              newState.oValue += '>> Engine Service call failed: ' + err + '\n';
              return of('Error: ' + err);
            })
        )
    );

    if (FhirTypeGuard.isBundle(bundle)) {
      this.processBundle(newState, bundle as Bundle);
    }
    newState.isRunning = false;

    return newState;
  }

  private async onSearchLibrary(newState: CqlEditorState,
                                partialState: CqlEditorStateOnSearchLibrary): Promise<CqlEditorState> {
    const bundle = await firstValueFrom(
        this._viewModel.searchLibraryCQL(partialState.value)
        .pipe(
            catchError((err: any) => {
              console.error('error', err);
              newState.error = err;
              newState.oValue += '>> Search Service call failed: ' + err + '\n';
              return of('Error: ' + err);
            })
        )
    );

    newState.libraries.length = 0;
    if (FhirTypeGuard.isBundle(bundle)) {
      bundle.entry?.forEach(entry => {
        if (FhirTypeGuard.isLibrary(entry.resource)) {
          newState.libraries.push(entry.resource);
        }
      });
    }
    newState.isSearching = false;

    return newState;
  }

  private processBundle(state: CqlEditorState, bundle: Bundle): void {
    state.oValue += '\n';

    if (bundle.entry) {
      bundle.entry.forEach(entry => {
        const name = entry.fullUrl;
        if (FhirTypeGuard.isParameters(entry.resource)) {
          const parameters = entry.resource as Parameters;
          const p = parameters.parameter;
          let value = 'undefined';
          let location = 'unknown';
          if (p) {
            if (p[0].valueString) {
              location = p[0].valueString;
            }
            value = p[1].valueString ? p[1].valueString :
                (p[1].resource ? JSON.stringify(p[1].resource) : 'undefined');
          }
          state.oValue += '>> ' + location + ': ' + name + ' -> ' + value + '\n';
        }
      });
    }
  }
}
