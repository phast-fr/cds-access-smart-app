import { MedicationRequestBuilder } from '../../common/fhir/fhir.resource.builder';
import { fhir } from '../../common/fhir/fhir.types';
import MedicationRequest = fhir.MedicationRequest;
import Medication = fhir.Medication;
import Practitioner = fhir.Practitioner;
import Patient = fhir.Patient;
import id = fhir.id;
import MedicationRequestIntent = fhir.MedicationRequestIntent;
import Reference = fhir.Reference;
import MedicationIngredient = fhir.MedicationIngredient;
import CodeableConcept = fhir.CodeableConcept;
import Dosage = fhir.Dosage;
import MedicationRequestDispenseRequest = fhir.MedicationRequestDispenseRequest;
import Coding = fhir.Coding;
import UnitsOfTime = fhir.UnitsOfTime;

export interface IPartialState {
  readonly type: string;
}

export class MedicationFormStateAddMedicationRequest implements IPartialState {
  readonly type = 'AddMedicationRequest';

  constructor() { }
}

export class MedicationFormStateDetailsMedication implements IPartialState{
  readonly type = 'DetailsMedication';

  constructor(private _medicationId: id,
              private _formCode: CodeableConcept,
              private _ingredient: MedicationIngredient[],
              private _routeCode: CodeableConcept) { }

  public get id(): id {
    return this._medicationId;
  }

  public get formCode(): CodeableConcept {
    return this._formCode;
  }

  public get ingredient(): MedicationIngredient[] {
    return this._ingredient;
  }

  public get routeCode(): CodeableConcept {
    return this._routeCode;
  }
}

export class MedicationFormStateAddMedication implements IPartialState {
  readonly type = 'AddMedication';

  constructor(private _medication: Medication) {
  }

  public medication(): Medication {
    return this._medication;
  }
}

export class MedicationFormStateRemoveMedication implements IPartialState {
  readonly type = 'RemoveMedication';

  constructor(private _nMedication: number) { }

  public get nMedication(): number {
    return this._nMedication;
  }
}

export class MedicationFormStateAddDosageInstruction implements IPartialState {
  readonly type = 'AddDosageInstruction';

  constructor() { }
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

  private _medicationArray = new Array<number>();

  private _nDosage: number;

  private _index: number;

  private _routeArray = new Array<CodeableConcept>();

  private _formMap = {};

  private _strengthMap = {};

  private _doseAndRateUnitArray = new Array<Coding>();

  private _durationUnitArray = new Array<UnitsOfTime>('s', 'min', 'h', 'd', 'wk', 'mo', 'a');

  constructor(private _user: Patient | Practitioner,
              private _patient: Patient,
              private _type: string) { }

  public newMedicationRequest(intent: MedicationRequestIntent, subject: Reference): MedicationRequest {
    this._medicationRequest = new MedicationRequestBuilder(intent, subject)
      .build();
    return this._medicationRequest;
  }

  public set loading(loading: boolean) {
    this._loading = loading;
  }

  public get isLoading(): boolean {
    return this._loading;
  }

  public get user(): Patient | Practitioner {
    return this._user;
  }

  public get patient(): Patient {
    return this._patient;
  }

  public set type(type: string) {
    this._type = type;
  }

  public get type(): string {
    return this._type;
  }

  public get medicationRequest(): MedicationRequest {
    return this._medicationRequest;
  }

  public get medicationArray(): Array<number> {
    return this._medicationArray;
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

  public get formMap(): object {
    return this._formMap;
  }

  public get routeArray(): Array<CodeableConcept> {
    return this._routeArray;
  }

  public get strengthMap(): object {
    return this._strengthMap;
  }

  public get doseAndRateUnitArray(): Array<Coding> {
    return this._doseAndRateUnitArray;
  }

  public get durationUnitArray(): Array<UnitsOfTime> {
    return this._durationUnitArray;
  }

  public medicationRequestAdded(): void {
    this._medicationRequest = null;
  }
}
