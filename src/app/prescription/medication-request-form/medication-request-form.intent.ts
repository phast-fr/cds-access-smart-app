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

import {IIntent} from '../../common/cds-access/models/state.model';
import {
  Bundle,
  CodeableConcept, Coding, dateTime, decimal,
  id,
  Medication,
  MedicationKnowledge,
  MedicationRequestDispenseRequest, Patient, Practitioner,
  Ratio,
  Reference, UnitsOfTime, ValueSetContains
} from 'phast-fhir-ts';

export class MedicationFormIntentAddMedicationRequest implements IIntent {
  readonly type = 'AddMedicationRequest';

  constructor(
      private _bundle: Bundle
  ) {
  }

  public get bundle(): Bundle {
    return this._bundle;
  }
}

export class MedicationFormIntentCdsHelp implements IIntent {
  readonly type = 'CdsHelp';

  constructor(private _bundle: Bundle) {
  }

  public get bundle(): Bundle {
    return this._bundle;
  }
}

export class MedicationFormIntentAddMedication implements IIntent {
  readonly type = 'AddMedication';

  constructor(
      private _bundle: Bundle | undefined,
      private _medicationKnowledge: MedicationKnowledge,
      private _medicationId: id,
      private _patient: Patient,
      private _practitioner: Practitioner
  ) { }

  public get bundle(): Bundle | undefined {
    return this._bundle;
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

  constructor(private _bundle: Bundle,
              private _nMedication: number) { }

  public get bundle(): Bundle {
    return this._bundle;
  }

  public get nMedication(): number {
    return this._nMedication;
  }
}

export class MedicationFormIntentRemoveIngredient implements IIntent {
  readonly type = 'RemoveMedication';

  constructor(private _bundle: Bundle,
              private _nMedication: number) { }

  public get bundle(): Bundle {
    return this._bundle;
  }

  public get nMedication(): number {
    return this._nMedication + 1;
  }
}

export class MedicationFormIntentValueChangesMedicationAmount implements IIntent {
  readonly type = 'ValueChangesMedicationAmount';

  constructor(private _bundle: Bundle,
              private _medication: Medication,
              private _amountValue: Ratio | null) {
  }

  public get bundle(): Bundle {
    return this._bundle;
  }

  public get medication(): Medication {
    return this._medication;
  }

  public get amountValue(): Ratio | null {
    return this._amountValue;
  }
}

export class MedicationFormIntentValueChangesMedicationForm implements IIntent {
  readonly type = 'ValueChangesMedicationForm';

  constructor(private _bundle: Bundle,
              private _medication: Medication,
              private _formValue: CodeableConcept | null) {
  }

  public get bundle(): Bundle {
    return this._bundle;
  }

  public get medication(): Medication {
    return this._medication;
  }

  public get formValue(): CodeableConcept | null {
    return this._formValue;
  }
}

export class MedicationFormIntentValueChangesMedicationIngredientStrength implements IIntent {
  readonly type = 'ValueChangesMedicationIngredientStrength';

  constructor(private _bundle: Bundle,
              private _medication: Medication,
              private _itemCodeableConcept: CodeableConcept,
              private _strengthValue: Ratio | null) {
  }

  public get bundle(): Bundle {
    return this._bundle;
  }

  public get medication(): Medication {
    return this._medication;
  }

  public get itemCodeableConcept(): CodeableConcept {
    return this._itemCodeableConcept;
  }

  public get strengthValue(): Ratio | null {
    return this._strengthValue;
  }
}

export class MedicationFormIntentValueChangesMedicationIngredientStrengthValue implements IIntent {
  readonly type = 'ValueChangesMedicationIngredientStrengthValue';

  constructor(private _bundle: Bundle,
              private _medication: Medication,
              private _itemReference: Reference,
              private _strengthValue: number) {
  }

  public get bundle(): Bundle {
    return this._bundle;
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

  constructor(private _bundle: Bundle,
              private _medication: Medication,
              private _itemReference: Reference,
              private _strengthUnit: Coding | null) {
  }

  public get bundle(): Bundle {
    return this._bundle;
  }

  public get medication(): Medication {
    return this._medication;
  }

  public get itemReference(): Reference {
    return this._itemReference;
  }

  public get strengthUnit(): Coding | null {
    return this._strengthUnit;
  }
}

export class MedicationFormIntentAddDosageInstruction implements IIntent {
  readonly type = 'AddDosageInstruction';

  constructor(
      private _bundle: Bundle | undefined
  ) {
  }

  public get bundle(): Bundle | undefined {
    return this._bundle;
  }
}

export class MedicationFormIntentRemoveDosageInstruction implements IIntent {
  readonly type = 'RemoveDosageInstruction';

  constructor(
      private _bundle: Bundle | undefined,
      private _nDosage: number
  ) {
  }

  public get bundle(): Bundle | undefined {
    return this._bundle;
  }

  public get nDosage(): number {
    return this._nDosage;
  }
}

export class MedicationFormIntentValueChangesDosageInstructionRoute implements IIntent {
  readonly type = 'ValueChangesDosageInstructionRoute';

  constructor(
      private _bundle: Bundle | undefined,
      private _nDosage: number,
      private _routeValue: CodeableConcept | null
  ) {
  }

  public get bundle(): Bundle | undefined {
    return this._bundle;
  }

  public get nDosage(): number {
    return this._nDosage;
  }

  public get routeValue(): CodeableConcept | null {
    return this._routeValue;
  }
}

export class MedicationFormIntentValueChangesDosageInstructionBoundsDurationValue implements IIntent {
  readonly type = 'ValueChangesDosageInstructionBoundsDurationValue';

  constructor(
      private _bundle: Bundle | undefined,
      private _nDosage: number,
      private _boundsDurationValue: decimal
  ) {
  }

  public get bundle(): Bundle | undefined {
    return this._bundle;
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

  constructor(
      private _bundle: Bundle | undefined,
      private _nDosage: number,
      private _boundsDurationUnit: ValueSetContains | null
  ) {
  }

  public get bundle(): Bundle | undefined {
    return this._bundle;
  }

  public get nDosage(): number {
    return this._nDosage;
  }

  public get boundsDurationUnit(): ValueSetContains | null {
    return this._boundsDurationUnit;
  }
}

export class MedicationFormIntentValueChangesDosageInstructionBoundsPeriodStart implements IIntent {
  readonly type = 'ValueChangesDosageInstructionBoundsPeriodStart';

  constructor(
      private _bundle: Bundle | undefined,
      private _nDosage: number,
      private _boundsPeriodStart: dateTime
  ) {
  }

  public get bundle(): Bundle | undefined {
    return this._bundle;
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

  constructor(
      private _bundle: Bundle | undefined,
      private _nDosage: number,
      private _boundsPeriodEnd: dateTime
  ) {
  }

  public get bundle(): Bundle | undefined {
    return this._bundle;
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

  constructor(
      private _bundle: Bundle | undefined,
      private _nDosage: number,
      private _durationValue: decimal
  ) {
  }

  public get bundle(): Bundle | undefined {
    return this._bundle;
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

  constructor(
      private _bundle: Bundle | undefined,
      private _nDosage: number,
      private _durationUnit: ValueSetContains | null
  ) {
  }

  public get bundle(): Bundle | undefined {
    return this._bundle;
  }

  public get nDosage(): number {
    return this._nDosage;
  }

  public get durationUnit(): ValueSetContains | null {
    return this._durationUnit;
  }
}

export class MedicationFormIntentValueChangesDosageInstructionFrequencyValue implements IIntent {
  readonly type = 'ValueChangesDosageInstructionFrequencyValue';

  constructor(
      private _bundle: Bundle | undefined,
      private _nDosage: number,
      private _frequencyValue: decimal
  ) {
  }

  public get bundle(): Bundle | undefined {
    return this._bundle;
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

  constructor(
      private _bundle: Bundle | undefined,
      private _nDosage: number,
      private _periodValue: decimal
  ) {
  }

  public get bundle(): Bundle | undefined {
    return this._bundle;
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

  constructor(
      private _bundle: Bundle | undefined,
      private _nDosage: number,
      private _periodUnit: ValueSetContains | null
  ) {
  }

  public get bundle(): Bundle | undefined {
    return this._bundle;
  }

  public get nDosage(): number {
    return this._nDosage;
  }

  public get periodUnit(): ValueSetContains | null {
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

  constructor(
      private _bundle: Bundle | undefined,
      private _nDosage: number,
      private _nWhen: number
  ) {
  }

  public get bundle(): Bundle | undefined {
    return this._bundle;
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

  constructor(
      private _bundle: Bundle | undefined,
      private _nDosage: number,
      private _nWhen: number,
      private _whenValue: ValueSetContains | null
  ) {
  }

  public get bundle(): Bundle | undefined {
    return this._bundle;
  }

  public get nDosage(): number {
    return this._nDosage;
  }

  public get nWhen(): number {
    return this._nWhen;
  }

  public get whenValue(): ValueSetContains | null {
    return this._whenValue;
  }
}

export class MedicationFormIntentValueChangesDosageInstructionOffsetValue implements IIntent {
  readonly type = 'ValueChangesDosageInstructionOffsetValue';

  constructor(
      private _bundle: Bundle | undefined,
      private _nDosage: number,
      private _offsetValue: decimal
  ) {
  }

  public get bundle(): Bundle | undefined {
    return this._bundle;
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

  constructor(private _bundle: Bundle | undefined,
              private _nDosage: number,
              private _doseQuantityValue: number) {
  }

  public get bundle(): Bundle | undefined {
    return this._bundle;
  }

  public get nDosage(): number {
    return this._nDosage;
  }

  public get doseQuantityValue(): number {
    return this._doseQuantityValue;
  }
}

export class MedicationFormIntentValueChangesDosageInstructionDoseQuantityUnit implements IIntent {
  readonly type = 'ValueChangesDosageInstructionDoseQuantityUnit';

  constructor(
      private _bundle: Bundle | undefined,
      private _nDosage: number,
      private _doseQuantityUnit: Coding | null
  ) {
  }

  public get bundle(): Bundle | undefined {
    return this._bundle;
  }

  public get nDosage(): number {
    return this._nDosage;
  }

  public get doseQuantityUnit(): Coding | null {
    return this._doseQuantityUnit;
  }
}

export class MedicationFormIntentValueChangesDosageInstructionRateRatioNumeratorValue implements IIntent {
  readonly type = 'ValueChangesDosageInstructionRateRatioNumeratorValue';

  constructor(
      private _bundle: Bundle | undefined,
      private _nDosage: number,
      private _rateRatioNumeratorValue: number
  ) {
  }

  public get bundle(): Bundle | undefined {
    return this._bundle;
  }

  public get nDosage(): number {
    return this._nDosage;
  }

  public get rateRatioNumeratorValue(): number {
    return this._rateRatioNumeratorValue;
  }
}

export class MedicationFormIntentValueChangesDosageInstructionRateRatioNumeratorUnit implements IIntent {
  readonly type = 'ValueChangesDosageInstructionRateRatioNumeratorUnit';

  constructor(
      private _bundle: Bundle | undefined,
      private _nDosage: number,
      private _rateRatioNumeratorUnit: Coding | null
  ) {
  }

  public get bundle(): Bundle | undefined {
    return this._bundle;
  }

  public get nDosage(): number {
    return this._nDosage;
  }

  public get rateRatioNumeratorUnit(): Coding | null {
    return this._rateRatioNumeratorUnit;
  }
}

export class MedicationFormIntentValueChangesDosageInstructionRateRatioDenominatorValue implements IIntent {
  readonly type = 'ValueChangesDosageInstructionRateRatioDenominatorValue';

  constructor(
      private _bundle: Bundle | undefined,
      private _nDosage: number,
      private _rateRatioDenominatorValue: number
  ) {
  }

  public get bundle(): Bundle | undefined {
    return this._bundle;
  }

  public get nDosage(): number {
    return this._nDosage;
  }

  public get rateRatioDenominatorValue(): number {
    return this._rateRatioDenominatorValue;
  }
}

export class MedicationFormIntentValueChangesDosageInstructionRateRatioDenominatorUnit implements IIntent {
  readonly type = 'ValueChangesDosageInstructionRateRatioDenominatorUnit';

  constructor(
      private _bundle: Bundle | undefined,
      private _nDosage: number,
      private _rateRatioDenominatorUnit: Coding | null
  ) {
  }

  public get bundle(): Bundle | undefined {
    return this._bundle;
  }

  public get nDosage(): number {
    return this._nDosage;
  }

  public get rateRatioDenominatorUnit(): Coding | null {
    return this._rateRatioDenominatorUnit;
  }
}

export class MedicationFormIntentValueChangesDosageInstructionRateQuantityValue implements IIntent {
  readonly type = 'ValueChangesDosageInstructionRateQuantityValue';

  constructor(private _bundle: Bundle,
              private _nDosage: number,
              private _nDoseAndRate: number,
              private _rateQuantityValue: number) {
  }

  public get bundle(): Bundle {
    return this._bundle;
  }

  public get nDosage(): number {
    return this._nDosage;
  }

  public get nDoseAndRate(): number {
    return this._nDoseAndRate;
  }

  public get rateQuantityValue(): number {
    return this._rateQuantityValue;
  }
}

export class MedicationFormIntentValueChangesDosageInstructionRateQuantityUnit implements IIntent {
  readonly type = 'ValueChangesDosageInstructionRateQuantityUnit';

  constructor(private _bundle: Bundle,
              private _nDosage: number,
              private _nDoseAndRate: number,
              private _rateQuantityUnit: Coding) {
  }

  public get bundle(): Bundle {
    return this._bundle;
  }

  public get nDosage(): number {
    return this._nDosage;
  }

  public get nDoseAndRate(): number {
    return this._nDoseAndRate;
  }

  public get rateQuantityUnit(): Coding {
    return this._rateQuantityUnit;
  }
}

export class MedicationFormIntentValueChangesDosageInstructionTimeOfDayValue implements IIntent {
  readonly type = 'ValueChangesDosageInstructionTimeOfDayValue';

  constructor(
      private _bundle: Bundle | undefined,
      private _nDosage: number,
      private _nTimeOfDay: number,
      private _timeOfDay: UnitsOfTime
  ) {
  }

  public get bundle(): Bundle | undefined {
    return this._bundle;
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

  constructor(
      private _bundle: Bundle | undefined,
      private _nDosage: number,
      private _index: number
  ) {
  }

  public get bundle(): Bundle | undefined {
    return this._bundle;
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

  constructor(
      private _bundle: Bundle | undefined,
      private _nDosage: number,
      private _dayOfWeek: Array<{ name: string, checked: boolean }>
  ) {
  }

  public get bundle(): Bundle | undefined {
    return this._bundle;
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

  constructor(
      private _bundle: Bundle | undefined,
      private _nDosage: number,
      private _index: number
  ) {
  }

  public get bundle(): Bundle | undefined {
    return this._bundle;
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

  constructor(private _bundle: Bundle,
              private _medicationDispense: MedicationRequestDispenseRequest) {
  }

  public get bundle(): Bundle {
    return this._bundle;
  }

  public get medicationDispense(): MedicationRequestDispenseRequest {
    return this._medicationDispense;
  }
}

export class MedicationFormIntentValueChangesTreatmentIntent implements IIntent {
  readonly type = 'ValueChangesTreatmentIntent';

  constructor(private _bundle: Bundle,
              private _treatmentIntent: ValueSetContains | null) {
  }

  public get bundle(): Bundle {
    return this._bundle;
  }

  public get treatmentIntent(): ValueSetContains | null {
    return this._treatmentIntent;
  }
}
