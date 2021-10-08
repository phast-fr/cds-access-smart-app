/**
 * @license
 * Copyright PHAST SARL All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://cds-access.phast.fr/license
 */
import {Library, Patient} from 'phast-fhir-ts';

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

export class CqlEditorStateOnSearchLibrary implements IPartialState {
  readonly type = 'OnSearchLibrary';

  constructor(private _value: string) {
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