/**
 * @license
 * Copyright PHAST SARL All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://cds-access.phast.fr/license
 */
import {IIntent} from '../../common/cds-access/models/state.model';
import {
  CodeableConcept, Coding, dateTime, decimal,
  id,
  Medication,
  MedicationKnowledge,
  MedicationRequest, MedicationRequestDispenseRequest, Patient, Practitioner,
  Ratio,
  Reference, UnitsOfTime, ValueSetContains
} from 'phast-fhir-ts';

export class MedicationFormIntentAddMedicationRequest implements IIntent {
  readonly type = 'AddMedicationRequest';

  constructor(private _medicationRequest: MedicationRequest) { }

  public get medicationRequest(): MedicationRequest {
    return this._medicationRequest;
  }
}

export class MedicationFormIntentCdsHelp implements IIntent {
  readonly type = 'CdsHelp';

  constructor(private _medicationRequest: MedicationRequest) { }

  public get medicationRequest(): MedicationRequest {
    return this._medicationRequest;
  }
}

export class MedicationFormIntentAddMedication implements IIntent {
  readonly type = 'AddMedication';

  constructor(private _medicationRequest: MedicationRequest,
              private _medicationKnowledge: MedicationKnowledge,
              private _medicationId: id,
              private _patient: Patient,
              private _practitioner: Practitioner) { }

  public get medicationRequest(): MedicationRequest {
    return this._medicationRequest;
  }

  public get medicationKnowledge(): MedicationKnowledge {
    return this._medicationKnowledge;
  }

  public get medicationId(): id {
    return this._medicationId;
  }

  public get patient(): Patient {
    return this._patient;
  }

  public get practitioner(): Practitioner {
    return this._practitioner;
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

export class MedicationFormIntentValueChangesDosageInstructionRoute implements IIntent {
  readonly type = 'ValueChangesDosageInstructionRoute';

  constructor(private _medicationRequest: MedicationRequest,
              private _nDosage: number,
              private _routeValue: CodeableConcept,
              private _medication: Medication) {
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

  public get medication(): Medication {
    return this._medication;
  }
}

export class MedicationFormIntentValueChangesDosageInstructionBoundsDurationValue implements IIntent {
  readonly type = 'ValueChangesDosageInstructionBoundsDurationValue';

  constructor(private _medicationRequest: MedicationRequest,
              private _nDosage: number,
              private _boundsDurationValue: decimal) {
  }

  public get medicationRequest(): MedicationRequest {
    return this._medicationRequest;
  }

  public get nDosage(): number {
    return this._nDosage;
  }

  public get boundsDurationValue(): decimal {
    return this._boundsDurationValue;
  }
}

export class MedicationFormIntentValueChangesDosageInstructionBoundsDurationUnit implements IIntent {
  readonly type = 'ValueChangesDosageInstructionBoundsDurationUnit';

  constructor(private _medicationRequest: MedicationRequest,
              private _nDosage: number,
              private _boundsDurationUnit: ValueSetContains) {
  }

  public get medicationRequest(): MedicationRequest {
    return this._medicationRequest;
  }

  public get nDosage(): number {
    return this._nDosage;
  }

  public get boundsDurationUnit(): ValueSetContains {
    return this._boundsDurationUnit;
  }
}

export class MedicationFormIntentValueChangesDosageInstructionBoundsPeriodStart implements IIntent {
  readonly type = 'ValueChangesDosageInstructionBoundsPeriodStart';

  constructor(private _medicationRequest: MedicationRequest,
              private _nDosage: number,
              private _boundsPeriodStart: dateTime) {
  }

  public get medicationRequest(): MedicationRequest {
    return this._medicationRequest;
  }

  public get nDosage(): number {
    return this._nDosage;
  }

  public get boundsPeriodStart(): dateTime {
    return this._boundsPeriodStart;
  }
}

export class MedicationFormIntentValueChangesDosageInstructionBoundsPeriodEnd implements IIntent {
  readonly type = 'ValueChangesDosageInstructionBoundsPeriodEnd';

  constructor(private _medicationRequest: MedicationRequest,
              private _nDosage: number,
              private _boundsPeriodEnd: dateTime) {
  }

  public get medicationRequest(): MedicationRequest {
    return this._medicationRequest;
  }

  public get nDosage(): number {
    return this._nDosage;
  }

  public get boundsPeriodEnd(): dateTime {
    return this._boundsPeriodEnd;
  }
}

export class MedicationFormIntentValueChangesDosageInstructionDurationValue implements IIntent {
  readonly type = 'ValueChangesDosageInstructionDurationValue';

  constructor(private _medicationRequest: MedicationRequest,
              private _nDosage: number,
              private _durationValue: decimal) {
  }

  public get medicationRequest(): MedicationRequest {
    return this._medicationRequest;
  }

  public get nDosage(): number {
    return this._nDosage;
  }

  public get durationValue(): decimal {
    return this._durationValue;
  }
}

export class MedicationFormIntentValueChangesDosageInstructionDurationUnit implements IIntent {
  readonly type = 'ValueChangesDosageInstructionDurationUnit';

  constructor(private _medicationRequest: MedicationRequest,
              private _nDosage: number,
              private _durationUnit: ValueSetContains) {
  }

  public get medicationRequest(): MedicationRequest {
    return this._medicationRequest;
  }

  public get nDosage(): number {
    return this._nDosage;
  }

  public get durationUnit(): ValueSetContains {
    return this._durationUnit;
  }
}

export class MedicationFormIntentValueChangesDosageInstructionFrequencyValue implements IIntent {
  readonly type = 'ValueChangesDosageInstructionFrequencyValue';

  constructor(private _medicationRequest: MedicationRequest,
              private _nDosage: number,
              private _frequencyValue: decimal) {
  }

  public get medicationRequest(): MedicationRequest {
    return this._medicationRequest;
  }

  public get nDosage(): number {
    return this._nDosage;
  }

  public get frequencyValue(): decimal {
    return this._frequencyValue;
  }
}

export class MedicationFormIntentValueChangesDosageInstructionPeriodValue implements IIntent {
  readonly type = 'ValueChangesDosageInstructionPeriodValue';

  constructor(private _medicationRequest: MedicationRequest,
              private _nDosage: number,
              private _periodValue: decimal) {
  }

  public get medicationRequest(): MedicationRequest {
    return this._medicationRequest;
  }

  public get nDosage(): number {
    return this._nDosage;
  }

  public get periodValue(): decimal {
    return this._periodValue;
  }
}

export class MedicationFormIntentValueChangesDosageInstructionPeriodUnit implements IIntent {
  readonly type = 'ValueChangesDosageInstructionPeriodUnit';

  constructor(private _medicationRequest: MedicationRequest,
              private _nDosage: number,
              private _periodUnit: ValueSetContains) {
  }

  public get medicationRequest(): MedicationRequest {
    return this._medicationRequest;
  }

  public get nDosage(): number {
    return this._nDosage;
  }

  public get periodUnit(): ValueSetContains {
    return this._periodUnit;
  }
}

export class MedicationFormIntentAddWhen implements IIntent {
  readonly type = 'AddWhen';

  constructor(private _nDosage: number) {
  }

  public get nDosage(): number {
    return this._nDosage;
  }
}

export class MedicationFormIntentRemoveWhen implements IIntent {
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

export class MedicationFormIntentValueChangesDosageInstructionWhenValue implements IIntent {
  readonly type = 'ValueChangesDosageInstructionWhenValue';

  constructor(private _medicationRequest: MedicationRequest,
              private _nDosage: number,
              private _nWhen: number,
              private _whenValue: ValueSetContains) {
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

  public get whenValue(): ValueSetContains {
    return this._whenValue;
  }
}

export class MedicationFormIntentValueChangesDosageInstructionOffsetValue implements IIntent {
  readonly type = 'ValueChangesDosageInstructionOffsetValue';

  constructor(private _medicationRequest: MedicationRequest,
              private _nDosage: number,
              private _offsetValue: decimal) {
  }

  public get medicationRequest(): MedicationRequest {
    return this._medicationRequest;
  }

  public get nDosage(): number {
    return this._nDosage;
  }

  public get offsetValue(): decimal {
    return this._offsetValue;
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

  constructor(private _medicationRequest: MedicationRequest,
              private _nDosage: number,
              private _index: number) { }

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

export class MedicationFormIntentValueChangesDosageInstructionDayOfWeek implements IIntent {
  readonly type = 'ValueChangesDosageInstructionDayOfWeekValue';

  constructor(private _medicationRequest: MedicationRequest,
              private _nDosage: number,
              private _dayOfWeek: Array<{ name: string, checked: boolean }>) {
  }

  public get medicationRequest(): MedicationRequest {
    return this._medicationRequest;
  }

  public get nDosage(): number {
    return this._nDosage;
  }

  public get dayOfWeek(): Array<{ name: string, checked: boolean }> {
    return this._dayOfWeek;
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

  constructor(private _medicationRequest: MedicationRequest,
              private _nDosage: number,
              private _index: number) { }

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

export class MedicationFormIntentValueChangesDispenseRequest implements IIntent {
  readonly type = 'ValueChangesDispenseRequest';

  constructor(private _medicationRequest: MedicationRequest,
              private _medicationDispense: MedicationRequestDispenseRequest) {
  }

  public get medicationRequest(): MedicationRequest {
    return this._medicationRequest;
  }

  public get medicationDispense(): MedicationRequestDispenseRequest {
    return this._medicationDispense;
  }
}

export class MedicationFormIntentValueChangesTreatmentIntent implements IIntent {
  readonly type = 'ValueChangesTreatmentIntent';

  constructor(private _medicationRequest: MedicationRequest,
              private _treatmentIntent: ValueSetContains) {
  }

  public get medicationRequest(): MedicationRequest {
    return this._medicationRequest;
  }

  public get treatmentIntent(): ValueSetContains {
    return this._treatmentIntent;
  }
}
