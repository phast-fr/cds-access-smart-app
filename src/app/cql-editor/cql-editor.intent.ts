/**
 * @license
 * Copyright PHAST SARL All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://cds-access.phast.fr/license
 */
import {IIntent} from '../common/cds-access/models/state.model';
import {Library, Patient} from 'phast-fhir-ts';
import {SmartUser} from '../common/fhir/smart/models/fhir.smart.user.model';
import {SmartContext} from '../common/fhir/smart/models/fhir.smart.context.model';

export class CqlEditorIntentOnChangeLibrary implements IIntent {
  readonly type = 'OnChangeLibrary';

  constructor(private _library: Library) {
  }

  public get library(): Library {
    return this._library;
  }
}

export class CqlEditorIntentOnChangeContentLibrary implements IIntent {
  readonly type = 'OnChangeContentLibrary';

  constructor(private _library: Library,
              private _data: string) {
  }

  public get library(): Library {
    return this._library;
  }

  public get data(): string {
    return this._data;
  }
}

export class CqlEditorIntentOnSaveLibrary implements IIntent {
  readonly type = 'OnSaveLibrary';

  constructor(private _library: Library) {
  }

  public get library(): Library {
    return this._library;
  }
}

export class CqlEditorIntentOnRunLibrary implements IIntent {
  readonly type = 'OnRunLibrary';

  constructor(private _context: SmartContext,
              private _patient: Patient,
              private _data: string) {
  }

  public get context(): SmartContext {
    return this._context;
  }

  public get patient(): Patient {
    return this._patient;
  }

  public get data(): string {
    return this._data;
  }
}

export class CqlEditorIntentOnSearchLibrary implements IIntent {
  readonly type = 'OnSearchLibrary';

  constructor(private _value: string) {
  }

  public get value(): string {
    return this._value;
  }
}
