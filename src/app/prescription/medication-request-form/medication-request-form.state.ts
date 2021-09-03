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
  MedicationKnowledge,
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
              private _medicationKnowledge: MedicationKnowledge) {
  }

  public get medicationRequest(): MedicationRequest {
    return this._medicationRequest;
  }

  public get medicationKnowledge(): MedicationKnowledge {
    return this._medicationKnowledge;
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

  constructor(private _medicationRequest: MedicationRequest) {
  }

  public get medicationRequest(): MedicationRequest {
    return this._medicationRequest;
  }
}

export class MedicationFormStateAddDosageInstruction implements IPartialState {
  readonly type = 'AddDosageInstruction';

  constructor(private _medicationRequest: MedicationRequest) {
  }

  public get medicationRequest(): MedicationRequest {
    return this._medicationRequest;
  }
}

export class MedicationFormStateRemoveDosageInstruction implements IPartialState {
  readonly type = 'RemoveDosageInstruction';

  constructor(private _medicationRequest: MedicationRequest,
              private _nDosage: number) {
  }

  public get medicationRequest(): MedicationRequest {
    return this._medicationRequest;
  }

  public get nDosage(): number {
    return this._nDosage;
  }
}


export class MedicationFormStateValueChangesDosageInstruction implements IPartialState {
  readonly type = 'ValueChangesDosageInstruction';

  constructor(private _medicationRequest: MedicationRequest,
              private _nDosage: number) {
  }

  public get medicationRequest(): MedicationRequest {
    return this._medicationRequest;
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

export class MedicationFormStateAddWhen implements IPartialState {
  readonly type = 'AddWhen';

  constructor(private _nDosage: number) {
  }

  public get nDosage(): number {
    return this._nDosage;
  }
}

export class MedicationFormStateRemoveWhen implements IPartialState {
  readonly type = 'RemoveWhen';

  constructor(private _medicationRequest: MedicationRequest,
              private _nDosage: number,
              private _nWhen: number) {
  }

  public get medicationRequest(): MedicationRequest {
    return this._medicationRequest;
  }

  public get nDosage(): number {
    return this._nDosage;
  }

  public get nWhen(): number {
    return this._nWhen;
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

export class MedicationFormStateValueChangesTreatmentIntent implements IState {
  readonly type = 'ValueChangesTreatmentIntent';

  constructor(private _medicationRequest: MedicationRequest) {
  }

  public get medicationRequest(): MedicationRequest {
    return this._medicationRequest;
  }
}

export class MedicationRequestFormState implements IState {

  private _medicationRequest: MedicationRequest;

  private readonly _loadingCIOList$: BehaviorSubject<boolean>;

  private readonly _loadingTIOList$: BehaviorSubject<boolean>;

  private readonly _nMedicationArray: Array<number>;

  private _nDosage: number;

  private _index: number;

  private _autoIncrement: number;

  private readonly _medicationKnowledgeMap: Map<id, MedicationKnowledge>;

  private readonly _routeMap: Map<number, Array<CodeableConcept>>;

  private readonly _formMap: Map<id, Map<number, Array<CodeableConcept>>>;

  private readonly _strengthMap: Map<string, Map<number, Array<Ratio>>>;

  private readonly _doseAndRateUnitMap: Map<id, Map<number, Array<Coding>>>;

  private readonly _treatmentIntentArray: Array<ValueSetContains>;

  private readonly _durationUnitArray: Array<ValueSetContains>;

  private readonly _whenArray: Array<ValueSetContains>;

  constructor(private _type: string) {
    this._loadingCIOList$ = new BehaviorSubject<boolean>(false);
    this._loadingTIOList$ = new BehaviorSubject<boolean>(false);
    this._nMedicationArray = new Array<number>();
    this._autoIncrement = 1;
    this._medicationKnowledgeMap = new Map<id, MedicationKnowledge>();
    this._routeMap = new Map<number, Array<CodeableConcept>>();
    this._formMap = new Map<id, Map<number, Array<CodeableConcept>>>();
    this._strengthMap = new Map<string, Map<number, Array<Ratio>>>();
    this._doseAndRateUnitMap = new Map<id, Map<number, Array<Coding>>>();
    this._treatmentIntentArray = new Array<ValueSetContains>();
    this._durationUnitArray = new Array<ValueSetContains>();
    this._whenArray = new Array<ValueSetContains>();
  }

  public get medication(): Medication {
    return (this._medicationRequest.contained.length > 1) ?
      this._medicationRequest.contained[1] as Medication : this._medicationRequest.contained[0];
  }

  public get type(): string {
    return this._type;
  }

  public set type(type: string) {
    this._type = type;
  }

  public set loadingCIOList(loading: boolean) {
    this._loadingCIOList$.next(loading);
  }

  public get isLoadingCIOList$(): Observable<boolean> {
    return this._loadingCIOList$.asObservable();
  }

  public set loadingTIOList(loading: boolean) {
    this._loadingTIOList$.next(loading);
  }

  public get isLoadingTIOList$(): Observable<boolean> {
    return this._loadingTIOList$.asObservable();
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

  public get formMap(): Map<id, Map<number, Array<CodeableConcept>>> {
    return this._formMap;
  }

  public get strengthMap(): Map<string, Map<number, Array<Ratio>>> {
    return this._strengthMap;
  }

  public get doseAndRateUnitMap(): Map<id, Map<number, Array<Coding>>> {
    return this._doseAndRateUnitMap;
  }

  public get routeMap(): Map<number, Array<CodeableConcept>> {
    return this._routeMap;
  }

  public get treatmentIntent(): Array<ValueSetContains> {
    return this._treatmentIntentArray;
  }

  public get durationUnitArray(): Array<ValueSetContains> {
    return this._durationUnitArray;
  }

  public get whenArray(): Array<ValueSetContains> {
    return this._whenArray;
  }
}
