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
import {Bundle, Library, Patient} from 'phast-fhir-ts';

import {IPartialState, IState} from '../common/cds-access/models/state.model';
import {SmartContext} from '../common/fhir/smart/models/fhir.smart.context.model';

export class CqlEditorStateOnChangeLibrary implements IPartialState {
  readonly type = 'OnChangeLibrary';

  constructor(private _library: Library) {
  }

  public get library(): Library {
    return this._library;
  }
}

export class CqlEditorStateOnChangeContentLibrary implements IPartialState {
  readonly type = 'OnChangeContentLibrary';

  constructor(private _library: Library) {
  }

  public get library(): Library {
    return this._library;
  }
}

export class CqlEditorStateOnSaveLibrary implements IPartialState {
  readonly type = 'OnSaveLibrary';

  constructor(private _library: Library) {
  }

  public get library(): Library {
    return this._library;
  }
}

export class CqlEditorStateOnRunLibrary implements IPartialState {
  readonly type = 'OnRunLibrary';

  constructor(private _bundle: Bundle) {
  }

  public get bundle(): Bundle {
    return this._bundle;
  }
}

export class CqlEditorStateOnSearchLibrary implements IPartialState {
  readonly type = 'OnSearchLibrary';

  constructor(private _value: Bundle) {
  }

  public get value(): Bundle {
    return this._value;
  }
}

export class CqlEditorStateOnError implements IPartialState {
  readonly type = 'OnError';

  constructor(private _err: any,
              private _value: string) {
  }

  public get err(): any {
    return this._err;
  }

  public get value(): string {
    return this._value;
  }
}

export class CqlEditorState implements IState {

  private _isDirty: boolean;

  private _isRunning: boolean;

  private _isSearching: boolean;

  private readonly _libraries: Array<Library>;

  private _library?: Library;

  private _count?: number;

  private _error?: string;

  private _oValue?: string;

  constructor(public type: string) {
    this._isDirty = false;
    this._isRunning = false;
    this._isSearching = false;
    this._libraries = new Array<Library>();
  }

  public set isDirty(isDirty: boolean) {
    this._isDirty = isDirty;
  }

  public get isDirty(): boolean {
    return this._isDirty;
  }

  public set count(count: number | undefined) {
    this._count = count;
  }

  public get count(): number | undefined {
    return this._count;
  }

  public set isRunning(isRunning: boolean) {
    this._isRunning = isRunning;
  }

  public get isRunning(): boolean {
    return this._isRunning;
  }

  public set isSearching(isSearching: boolean) {
    this._isSearching = isSearching;
  }

  public get isSearching(): boolean {
    return this._isSearching;
  }

  public get libraries(): Array<Library> {
    return this._libraries;
  }

  public set library(library: Library | undefined) {
    this._library = library;
  }

  public get library(): Library | undefined {
    return this._library;
  }

  public set error(error: string | undefined) {
    this._error = error;
  }

  public get error(): string | undefined {
    return this._error;
  }

  public set oValue(oValue: string | undefined) {
    this._oValue = oValue;
  }

  public get oValue(): string | undefined {
    return this._oValue;
  }
}
