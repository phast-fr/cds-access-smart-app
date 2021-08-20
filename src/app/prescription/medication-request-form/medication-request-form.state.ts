/**
 * @license
 * Copyright PHAST SARL All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://cds-access.phast.fr/license
 */
import {BehaviorSubject, Observable} from 'rxjs';

import {IPartialState, IState} from '../../common/cds-access/models/state.model';
import {
  CodeableConcept, Coding,
  id,
  Medication,
  MedicationKnowledge, MedicationKnowledgeIngredient,
  MedicationRequest,
  Ratio,
  ValueSetContains
} from 'phast-fhir-ts';

export class MedicationFormStateAddMedicationRequest implements IPartialState {
  readonly type = 'AddMedicationRequest';

  constructor() {
  }
}

export class MedicationFormStateCdsHelp implements IPartialState {
  readonly type = 'CdsHelp';

  constructor() {
  }
}

export class MedicationFormStateAddMedication implements IPartialState {
  readonly type = 'AddMedication';

  constructor(private _medicationRequest: MedicationRequest,
              private _medicationKnowledge: MedicationKnowledge,
              private _medication: Medication) {
  }

  public get medicationRequest(): MedicationRequest {
    return this._medicationRequest;
  }

  public get medicationKnowledge(): MedicationKnowledge {
    return this._medicationKnowledge;
  }

  public get medication(): Medication {
    return this._medication;
  }
}

export class MedicationFormStateRemoveMedication implements IPartialState {
  readonly type = 'RemoveMedication';

  constructor(private _medicationRequest: MedicationRequest,
              private _nMedication: number) { }

  public get medicationRequest(): MedicationRequest {
    return this._medicationRequest;
  }

  public get nMedication(): number {
    return this._nMedication;
  }
}

export class MedicationFormStateValueChangesMedication implements IPartialState {
  readonly type = 'ValueChangesMedication';

  constructor(private _medicationRequest: MedicationRequest,
              private _medicationKnowledge?: MedicationKnowledge,
              private _medication?: Medication,
              private _ingredient?: MedicationKnowledgeIngredient[],
              private _routeValue?: CodeableConcept) {
  }

  public get medicationRequest(): MedicationRequest {
    return this._medicationRequest;
  }

  public get medicationKnowledge(): MedicationKnowledge {
    return this._medicationKnowledge;
  }

  public get medication(): Medication {
    return this._medication;
  }

  public get ingredient(): MedicationKnowledgeIngredient[] {
    return this._ingredient;
  }

  public get route(): CodeableConcept {
    return this._routeValue;
  }
}

export class MedicationFormStateAddDosageInstruction implements IPartialState {
  readonly type = 'AddDosageInstruction';

  constructor(private _medicationRequest: MedicationRequest) { }

  public get medicationRequest(): MedicationRequest {
    return this._medicationRequest;
  }
}

export class MedicationFormStateRemoveDosageInstruction implements IPartialState {
  readonly type = 'RemoveDosageInstruction';

  constructor(private _medicationRequest: MedicationRequest,
              private _nDosage: number,
              private _medicationKnowledge?: MedicationKnowledge,
              private _medication?: Medication,
              private _ingredient?: MedicationKnowledgeIngredient[]) { }

  public get medicationRequest(): MedicationRequest {
    return this._medicationRequest;
  }

  public get medicationKnowledge(): MedicationKnowledge {
    return this._medicationKnowledge;
  }

  public get medication(): Medication {
    return this._medication;
  }

  public get ingredient(): MedicationKnowledgeIngredient[] {
    return this._ingredient;
  }

  public get nDosage(): number {
    return this._nDosage;
  }
}


export class MedicationFormStateValueChangesDosageInstruction implements IPartialState {
  readonly type = 'ValueChangesDosageInstruction';

  constructor(private _medicationRequest: MedicationRequest,
              private _nDosage: number,
              private _medicationKnowledge?: MedicationKnowledge,
              private _medication?: Medication,
              private _ingredient?: MedicationKnowledgeIngredient[],
              private _routeValue?: CodeableConcept) {
  }

  public get medicationRequest(): MedicationRequest {
    return this._medicationRequest;
  }

  public get medicationKnowledge(): MedicationKnowledge {
    return this._medicationKnowledge;
  }

  public get medication(): Medication {
    return this._medication;
  }

  public get route(): CodeableConcept {
    return this._routeValue;
  }

  public get ingredient(): MedicationKnowledgeIngredient[] {
    return this._ingredient;
  }

  public get nDosage(): number {
    return this._nDosage;
  }
}


export class MedicationFormStateValueChangesDispenseRequest implements IPartialState {
  readonly type = 'ValueChangesDispenseRequest';

  constructor(private _medicationRequest: MedicationRequest) { }

  public get medicationRequest(): MedicationRequest {
    return this._medicationRequest;
  }
}

export class MedicationFormStateAddTimeOfDay implements IPartialState {
  readonly type = 'AddTimeOfDay';

  constructor(private _nDosage: number) { }

  public get nDosage(): number {
    return this._nDosage;
  }
}

export class MedicationFormStateRemoveTimeOfDay implements IPartialState {
  readonly type = 'RemoveTimeOfDay';

  constructor(private _medicationRequest: MedicationRequest,
              private _nDosage: number,
              private _index: number) {
  }

  public get medicationRequest(): MedicationRequest {
    return this._medicationRequest;
  }

  public get nDosage(): number {
    return this._nDosage;
  }

  public get index(): number {
    return this._index;
  }
}

export class MedicationFormStateAddDoseAndRate implements IPartialState {
  readonly type = 'AddDoseAndRate';

  constructor(private _nDosage: number) { }

  public get nDosage(): number {
    return this._nDosage;
  }
}

export class MedicationFormStateRemoveDoseAndRate implements IPartialState {
  readonly type = 'RemoveDoseAndRate';

  constructor(private _medicationRequest: MedicationRequest,
              private _nDosage: number,
              private _index: number) {
  }

  public get medicationRequest(): MedicationRequest {
    return this._medicationRequest;
  }

  public get nDosage(): number {
    return this._nDosage;
  }

  public get index(): number {
    return this._index;
  }
}

export class MedicationRequestFormState implements IState {

  private _medicationRequest: MedicationRequest;

  private readonly _loading$: BehaviorSubject<boolean>;

  private readonly _nMedicationArray: Array<number>;

  private _nDosage: number;

  private _index: number;

  private _autoIncrement: number;

  private readonly _medicationKnowledgeMap: Map<id, MedicationKnowledge>;

  private readonly _routeArray: Array<CodeableConcept>;

  private readonly _formMap: Map<id, Array<CodeableConcept>>;

  private readonly _strengthMap: Map<string, Array<Ratio>>;

  private readonly _doseAndRateUnitMap: Map<id, Array<Coding>>;

  private readonly _durationUnitArray: Array<ValueSetContains>;

  constructor(private _type: string) {
    this._loading$ = new BehaviorSubject<boolean>(false);
    this._nMedicationArray = new Array<number>();
    this._autoIncrement = 1;
    this._medicationKnowledgeMap = new Map<id, MedicationKnowledge>();
    this._routeArray = new Array<CodeableConcept>();
    this._formMap = new Map<id, Array<CodeableConcept>>();
    this._strengthMap = new Map<string, Array<Ratio>>();
    this._doseAndRateUnitMap = new Map<id, Array<Coding>>();
    this._durationUnitArray = new Array<ValueSetContains>();
  }

  public get type(): string {
    return this._type;
  }

  public set type(type: string) {
    this._type = type;
  }

  public set loading(loading: boolean) {
    this._loading$.next(loading);
  }

  public get isLoading$(): Observable<boolean> {
    return this._loading$.asObservable();
  }

  public set medicationRequest(medicationRequest: MedicationRequest) {
    this._medicationRequest = medicationRequest;
  }

  public get medicationRequest(): MedicationRequest {
    return this._medicationRequest;
  }

  public get nMedicationArray(): Array<number> {
    return this._nMedicationArray;
  }

  public get nDosage(): number {
    return this._nDosage;
  }

  public set nDosage(nDosage: number) {
    this._nDosage = nDosage;
  }

  public get index(): number {
    return this._index;
  }

  public set index(index: number) {
    this._index = index;
  }

  public get autoIncrement(): number {
    return ++this._autoIncrement;
  }

  public get medicationKnowledgeMap(): Map<id, MedicationKnowledge> {
    return this._medicationKnowledgeMap;
  }

  public get formMap(): Map<id, Array<CodeableConcept>> {
    return this._formMap;
  }

  public get routeArray(): Array<CodeableConcept> {
    return this._routeArray;
  }

  public get strengthMap(): Map<string, Array<Ratio>> {
    return this._strengthMap;
  }

  public get doseAndRateUnitMap(): Map<id, Array<Coding>> {
    return this._doseAndRateUnitMap;
  }

  public get durationUnitArray(): Array<ValueSetContains> {
    return this._durationUnitArray;
  }
}
