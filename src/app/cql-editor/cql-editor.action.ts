/**
 * @license
 * Copyright PHAST SARL All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://cds-access.phast.fr/license
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
