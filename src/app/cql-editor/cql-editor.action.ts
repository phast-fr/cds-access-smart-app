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

import {Attachment, Library, Patient} from 'phast-fhir-ts';

import {IAction, IPartialState} from '../common/cds-access/models/state.model';

import {
  CqlEditorStateOnChangeContentLibrary,
  CqlEditorStateOnChangeLibrary, CqlEditorStateOnError,
  CqlEditorStateOnRunLibrary,
  CqlEditorStateOnSaveLibrary, CqlEditorStateOnSearchLibrary
} from './cql-editor.state';
import {Base64} from 'js-base64';
import {SmartContext} from '../common/fhir/smart/models/fhir.smart.context.model';
import {firstValueFrom, of} from 'rxjs';
import {catchError} from 'rxjs/operators';
import {FhirTypeGuard} from '../common/fhir/utils/fhir.type.guard';
import {CqlEditorViewModel} from './cql-editor.view-model';

export class CqlEditorActionOnChangeLibrary implements IAction {
  readonly type = 'OnChangeLibrary';

  constructor(private _library: Library) {
  }

  public async execute(): Promise<IPartialState> {
    return new CqlEditorStateOnChangeLibrary(this._library);
  }
}

export class CqlEditorActionOnChangeContentLibrary implements IAction {
  readonly type = 'OnChangeContentLibrary';

  constructor(private _library: Library,
              private _data: string) {
  }

  public async execute(): Promise<IPartialState> {
    if (!this._library.content) {
      this._library.content = new Array<Attachment>();
    }

    const contentCql = this._library.content.find((data: Attachment) => data.contentType === 'text/cql');
    if (contentCql) {
      contentCql.data = Base64.encode(this._data);
    }
    else {
      console.log('not implemented (create library)');
    }

    return new CqlEditorStateOnChangeContentLibrary(this._library);
  }
}

export class CqlEditorActionOnSaveLibrary implements IAction {
  readonly type = 'OnSaveLibrary';

  constructor(private _viewModel: CqlEditorViewModel,
              private _library: Library) {
  }

  public async execute(): Promise<IPartialState> {
    const library = await firstValueFrom(this._viewModel.updateLibrary(this._library)
        .pipe(
            catchError((err: any) => {
              console.error('error', err);
              const errorState = new CqlEditorStateOnError(err, `>> Library Service update failed: ${err}\n`);
              return of(errorState);
            })
        )
    );
    if (FhirTypeGuard.isLibrary(library)) {
      return new CqlEditorStateOnSaveLibrary(library);
    }
    return library;
  }
}

export class CqlEditorActionOnRunLibrary implements IAction {
  readonly type = 'OnRunLibrary';

  constructor(private _viewModel: CqlEditorViewModel,
              private _context: SmartContext,
              private _patient: Patient | null | undefined,
              private _data: string) {
  }

  public async execute(): Promise<IPartialState> {
    const bundle = await firstValueFrom(
        this._viewModel.$cql(this._context.iss, this._context.access_token, this._patient, this._data)
            .pipe(
                catchError((err: any) => {
                  console.error('error', err);
                  const errorState = new CqlEditorStateOnError(err, `>> Engine Service call failed: ${err}\n`);
                  return of(errorState);
                })
            )
    );

    if (FhirTypeGuard.isBundle(bundle)) {
      return new CqlEditorStateOnRunLibrary(bundle);
    }
    return bundle as IPartialState;
  }
}

export class CqlEditorActionOnSearchLibrary implements IAction {
  readonly type = 'OnSearchLibrary';

  constructor(private _viewModel: CqlEditorViewModel,
    private _value: string) {
}

  public async execute(): Promise<IPartialState> {
    const bundle = await firstValueFrom(
        this._viewModel.searchLibraryCQL(this._value, this._pageCount, this._LinkPageNumber)
            .pipe(
                catchError((err: any) => {
                  console.error('error', err);
                  const errorState = new CqlEditorStateOnError(err, `>> Search Service call failed: ${err}\n`);
                  return of(errorState);
                })
            )
    );
    if (FhirTypeGuard.isBundle(bundle)) {
      return new CqlEditorStateOnSearchLibrary(bundle);
    }
    return bundle as IPartialState;
  }
}
