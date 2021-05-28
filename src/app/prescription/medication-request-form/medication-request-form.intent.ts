import { fhir } from '../../common/fhir/fhir.types';
import MedicationKnowledge = fhir.MedicationKnowledge;
import id = fhir.id;
import MedicationRequestDispenseRequest = fhir.MedicationRequestDispenseRequest;
import MedicationRequest = fhir.MedicationRequest;
import Medication = fhir.Medication;
import Coding = fhir.Coding;
import CodeableConcept = fhir.CodeableConcept;
import Ratio = fhir.Ratio;
import Reference = fhir.Reference;
import UnitsOfTime = fhir.UnitsOfTime;

export interface IIntent {
  readonly type: string;
}

export class MedicationFormIntentAddMedicationRequest implements IIntent {
  readonly type = 'AddMedicationRequest';

  constructor(private _medicationRequest: MedicationRequest) { }

  public get medicationRequest(): MedicationRequest {
    return this._medicationRequest;
  }
}

export class MedicationFormIntentAddMedication implements IIntent {
  readonly type = 'AddMedication';

  constructor(private _medicationRequest: MedicationRequest,
              private _medicationKnowledge: MedicationKnowledge,
              private _medicationId: id) { }

  public get medicationRequest(): MedicationRequest {
    return this._medicationRequest;
  }

  public get medicationKnowledge(): MedicationKnowledge {
    return this._medicationKnowledge;
  }

  public get medicationId(): id {
    return this._medicationId;
  }
}

export class MedicationFormIntentRemoveMedication implements IIntent {
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

export class MedicationFormIntentRemoveIngredient implements IIntent {
  readonly type = 'RemoveMedication';

  constructor(private _medicationRequest: MedicationRequest,
              private _nMedication: number) { }

  public get medicationRequest(): MedicationRequest {
    return this._medicationRequest;
  }

  public get nMedication(): number {
    return this._nMedication + 1;
  }
}

export class MedicationFormIntentValueChangesMedicationForm implements IIntent {
  readonly type = 'ValueChangesMedicationForm';

  constructor(private _medicationRequest: MedicationRequest,
              private _medication: Medication,
              private _formValue: CodeableConcept) {
  }

  public get medicationRequest(): MedicationRequest {
    return this._medicationRequest;
  }

  public get medication(): Medication {
    return this._medication;
  }

  public get formValue(): CodeableConcept {
    return this._formValue;
  }
}

export class MedicationFormIntentValueChangesMedicationIngredientStrength implements IIntent {
  readonly type = 'ValueChangesMedicationIngredientStrength';

  constructor(private _medicationRequest: MedicationRequest,
              private _medication: Medication,
              private _itemCodeableConcept: CodeableConcept,
              private _strengthValue: Ratio) {
  }

  public get medicationRequest(): MedicationRequest {
    return this._medicationRequest;
  }

  public get medication(): Medication {
    return this._medication;
  }

  public get itemCodeableConcept(): CodeableConcept {
    return this._itemCodeableConcept;
  }

  public get strengthValue(): Ratio {
    return this._strengthValue;
  }
}

export class MedicationFormIntentValueChangesMedicationIngredientStrengthValue implements IIntent {
  readonly type = 'ValueChangesMedicationIngredientStrengthValue';

  constructor(private _medicationRequest: MedicationRequest,
              private _medication: Medication,
              private _itemReference: Reference,
              private _strengthValue: number) {
  }

  public get medicationRequest(): MedicationRequest {
    return this._medicationRequest;
  }

  public get medication(): Medication {
    return this._medication;
  }

  public get itemReference(): Reference {
    return this._itemReference;
  }

  public get strengthValue(): number {
    return this._strengthValue;
  }
}

export class MedicationFormIntentValueChangesMedicationIngredientStrengthUnit implements IIntent {
  readonly type = 'ValueChangesMedicationIngredientStrengthUnit';

  constructor(private _medicationRequest: MedicationRequest,
              private _medication: Medication,
              private _itemReference: Reference,
              private _strengthUnit: Coding) {
  }

  public get medicationRequest(): MedicationRequest {
    return this._medicationRequest;
  }

  public get medication(): Medication {
    return this._medication;
  }

  public get itemReference(): Reference {
    return this._itemReference;
  }

  public get strengthUnit(): Coding {
    return this._strengthUnit;
  }
}

export class MedicationFormIntentAddDosageInstruction implements IIntent {
  readonly type = 'AddDosageInstruction';

  constructor(private _medicationRequest: MedicationRequest) { }

  public get medicationRequest(): MedicationRequest {
    return this._medicationRequest;
  }
}

export class MedicationFormIntentRemoveDosageInstruction implements IIntent {
  readonly type = 'RemoveDosageInstruction';

  constructor(private _nDosage: number) { }

  public get nDosage(): number {
    return this._nDosage;
  }
}

export class MedicationFormIntentValueChangesDosageInstructionRoute implements IIntent {
  readonly type = 'ValueChangesDosageInstructionRoute';

  constructor(private _medicationRequest: MedicationRequest,
              private _nDosage: number,
              private _routeValue: CodeableConcept) {
  }

  public get medicationRequest(): MedicationRequest {
    return this._medicationRequest;
  }

  public get nDosage(): number {
    return this._nDosage;
  }

  public get routeValue(): CodeableConcept {
    return this._routeValue;
  }
}

export class MedicationFormIntentValueChangesDosageInstructionDurationValue implements IIntent {
  readonly type = 'ValueChangesDosageInstructionDurationValue';

  constructor(private _medicationRequest: MedicationRequest,
              private _nDosage: number,
              private _durationValue: number) {
  }

  public get medicationRequest(): MedicationRequest {
    return this._medicationRequest;
  }

  public get nDosage(): number {
    return this._nDosage;
  }

  public get durationValue(): number {
    return this._durationValue;
  }
}

export class MedicationFormIntentValueChangesDosageInstructionDurationUnit implements IIntent {
  readonly type = 'ValueChangesDosageInstructionDurationUnit';

  constructor(private _medicationRequest: MedicationRequest,
              private _nDosage: number,
              private _durationUnit: UnitsOfTime) {
  }

  public get medicationRequest(): MedicationRequest {
    return this._medicationRequest;
  }

  public get nDosage(): number {
    return this._nDosage;
  }

  public get durationUnit(): UnitsOfTime {
    return this._durationUnit;
  }
}

export class MedicationFormIntentValueChangesDosageInstructionDoseQuantityValue implements IIntent {
  readonly type = 'ValueChangesDosageInstructionDoseQuantityValue';

  constructor(private _medicationRequest: MedicationRequest,
              private _nDosage: number,
              private _nDoseAndRate: number,
              private _doseQuantityValue: number) {
  }

  public get medicationRequest(): MedicationRequest {
    return this._medicationRequest;
  }

  public get nDosage(): number {
    return this._nDosage;
  }

  public get nDoseAndRate(): number {
    return this._nDoseAndRate;
  }

  public get doseQuantityValue(): number {
    return this._doseQuantityValue;
  }
}

export class MedicationFormIntentValueChangesDosageInstructionDoseQuantityUnit implements IIntent {
  readonly type = 'ValueChangesDosageInstructionDoseQuantityUnit';

  constructor(private _medicationRequest: MedicationRequest,
              private _nDosage: number,
              private _nDoseAndRate: number,
              private _doseQuantityUnit: Coding) {
  }

  public get medicationRequest(): MedicationRequest {
    return this._medicationRequest;
  }

  public get nDosage(): number {
    return this._nDosage;
  }

  public get nDoseAndRate(): number {
    return this._nDoseAndRate;
  }

  public get doseQuantityUnit(): Coding {
    return this._doseQuantityUnit;
  }
}

export class MedicationFormIntentValueChangesDosageInstructionTimeOfDayValue implements IIntent {
  readonly type = 'ValueChangesDosageInstructionTimeOfDayValue';

  constructor(private _medicationRequest: MedicationRequest,
              private _nDosage: number,
              private _nTimeOfDay: number,
              private _timeOfDay: UnitsOfTime) {
  }

  public get medicationRequest(): MedicationRequest {
    return this._medicationRequest;
  }

  public get nDosage(): number {
    return this._nDosage;
  }

  public get nTimeOfDay(): number {
    return this._nTimeOfDay;
  }

  public get timeOfDay(): UnitsOfTime {
    return this._timeOfDay;
  }
}

export class MedicationFormIntentAddTimeOfDay implements IIntent {
  readonly type = 'AddTimeOfDay';

  constructor(
    private _nDosage: number) { }

  public get nDosage(): number {
    return this._nDosage;
  }
}

export class MedicationFormIntentRemoveTimeOfDay implements IIntent {
  readonly type = 'RemoveTimeOfDay';

  constructor(private _nDosage: number,
              private _index: number) { }

  public get nDosage(): number {
    return this._nDosage;
  }

  public get index(): number {
    return this._index;
  }
}

export class MedicationFormIntentAddDoseAndRate implements IIntent {
  readonly type = 'AddDoseAndRate';

  constructor(
    private _nDosage: number) { }

  public get nDosage(): number {
    return this._nDosage;
  }
}

export class MedicationFormIntentRemoveDoseAndRate implements IIntent {
  readonly type = 'RemoveDoseAndRate';

  constructor(private _nDosage: number,
              private _index: number) { }

  public get nDosage(): number {
    return this._nDosage;
  }

  public get index(): number {
    return this._index;
  }
}

export class MedicationFormIntentValueChangesDispenseRequest implements IIntent {
  readonly type = 'ValueChangesDispenseRequest';

  constructor(private _value: MedicationRequestDispenseRequest) { }

  public get value(): MedicationRequestDispenseRequest {
    return this._value;
  }
}
