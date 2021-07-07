import { fhir } from '../../common/fhir/fhir.types';
import MedicationRequest = fhir.MedicationRequest;
import Medication = fhir.Medication;
import id = fhir.id;
import CodeableConcept = fhir.CodeableConcept;
import Dosage = fhir.Dosage;
import MedicationRequestDispenseRequest = fhir.MedicationRequestDispenseRequest;
import Coding = fhir.Coding;
import UnitsOfTime = fhir.UnitsOfTime;
import MedicationKnowledge = fhir.MedicationKnowledge;
import Ratio = fhir.Ratio;

export interface IPartialState {
  readonly type: string;
}

export class MedicationFormStateAddMedicationRequest implements IPartialState {
  readonly type = 'AddMedicationRequest';

  constructor() { }
}

export class MedicationFormStateCdsHelp implements IPartialState {
  readonly type = 'CdsHelp';

  constructor() { }
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

  constructor(private _nMedication: number,
              private _medication: Medication) {
  }

  public get nMedication(): number {
    return this._nMedication;
  }

  public get medication(): Medication {
    return this._medication;
  }
}

export class MedicationFormStateAddDosageInstruction implements IPartialState {
  readonly type = 'AddDosageInstruction';

  constructor(private _dosageInstruction: Dosage) { }

  public get dosageInstruction(): Dosage {
    return this._dosageInstruction;
  }
}

export class MedicationFormStateRemoveDosageInstruction implements IPartialState {
  readonly type = 'RemoveDosageInstruction';

  constructor(private _nDosage: number) { }

  public get nDosage(): number {
    return this._nDosage;
  }
}

export class MedicationFormStateValueChangesDispenseRequest implements IPartialState {
  readonly type = 'ValueChangesDispenseRequest';

  constructor(private _value: MedicationRequestDispenseRequest) { }

  public get value(): MedicationRequestDispenseRequest {
    return this._value;
  }
}

export class MedicationFormStateValueChangesDosageInstruction implements IPartialState {
  readonly type = 'ValueChangesDosageInstruction';

  constructor(private _nDosage: number,
              private _value: Dosage) { }

  public get nDosage(): number {
    return this._nDosage;
  }

  public get value(): Dosage {
    return this._value;
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

  constructor(private _nDosage: number,
              private _index: number) {
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

  constructor(private _nDosage: number,
              private _index: number) {
  }

  public get nDosage(): number {
    return this._nDosage;
  }

  public get index(): number {
    return this._index;
  }
}

export class MedicationRequestFormState {

  private _medicationRequest: MedicationRequest;

  private _loading: boolean;

  private _nMedicationArray = new Array<number>();

  private _nDosage: number;

  private _index: number;

  private _autoIncrement = 0;

  private _medicationKnowledgeMap = new Map<id, MedicationKnowledge>();

  private _routeArray = new Array<CodeableConcept>();

  private _formMap = new Map<id, Array<CodeableConcept>>();

  private _strengthMap = new Map<string, Array<Ratio>>();

  private _doseAndRateUnitMap = new Map<id, Array<Coding>>();

  private _durationUnitArray = new Array<UnitsOfTime>();

  constructor(private _type: string) { }

  public set loading(loading: boolean) {
    this._loading = loading;
  }

  public get isLoading(): boolean {
    return this._loading;
  }

  public set type(type: string) {
    this._type = type;
  }

  /**
   * return the workflow state
   */
  public get type(): string {
    return this._type;
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

  public get durationUnitArray(): Array<UnitsOfTime> {
    return this._durationUnitArray;
  }
}
