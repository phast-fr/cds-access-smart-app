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
              private _patient: Patient | null | undefined,
              private _data: string) {
  }

  public get context(): SmartContext {
    return this._context;
  }

  public get patient(): Patient | null | undefined {
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
