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
  CqlEditorStateOnChangeLibrary,
  CqlEditorStateOnRunLibrary,
  CqlEditorStateOnSaveLibrary, CqlEditorStateOnSearchLibrary
} from './cql-editor.state';
import {Base64} from 'js-base64';
import {SmartContext} from '../common/fhir/smart/models/fhir.smart.context.model';

export class CqlEditorActionOnChangeLibrary implements IAction {
  readonly type = 'OnChangeLibrary';

  constructor(private _library: Library) {
  }

  public execute(): IPartialState {
    return new CqlEditorStateOnChangeLibrary(this._library);
  }
}

export class CqlEditorActionOnChangeContentLibrary implements IAction {
  readonly type = 'OnChangeContentLibrary';

  constructor(private _library: Library,
              private _data: string) {
  }

  public execute(): IPartialState {
    if (!this._library.content) {
      this._library.content = new Array<Attachment>();
    }

    const contentCql = this._library.content.find((data: Attachment) => data.contentType === 'text/cql');
    if (contentCql) {
      contentCql.data = Base64.encode(this._data);
    }
    else {
      console.log('not implemented (create library');
    }

    return new CqlEditorStateOnChangeContentLibrary(this._library);
  }
}

export class CqlEditorActionOnSaveLibrary implements IAction {
  readonly type = 'OnSaveLibrary';

  constructor(private _library: Library) {
  }

  public execute(): IPartialState {
    return new CqlEditorStateOnSaveLibrary(this._library);
  }
}

export class CqlEditorActionOnRunLibrary implements IAction {
  readonly type = 'OnRunLibrary';

  constructor(private _context: SmartContext,
              private _patient: Patient,
              private _data: string) {
  }

  public execute(): IPartialState {
    return new CqlEditorStateOnRunLibrary(this._context, this._patient, this._data);
  }
}

export class CqlEditorActionOnSearchLibrary implements IAction {
  readonly type = 'OnSearchLibrary';

  constructor(private _value: string) {
  }

  public execute(): IPartialState {
    return new CqlEditorStateOnSearchLibrary(this._value);
  }
}
