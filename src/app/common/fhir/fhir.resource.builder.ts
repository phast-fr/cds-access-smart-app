import { Utils } from '../utils';
import { fhir } from './fhir.types';
import MedicationRequest = fhir.MedicationRequest;
import Resource = fhir.Resource;
import Reference = fhir.Reference;
import MedicationRequestIntent = fhir.MedicationRequestIntent;
import Dosage = fhir.Dosage;
import time = fhir.time;
import DoseAndRate = fhir.DoseAndRate;
import CodeableConcept = fhir.CodeableConcept;
import integer = fhir.integer;
import id = fhir.id;
import Medication = fhir.Medication;
import MedicationIngredient = fhir.MedicationIngredient;
import code = fhir.code;
import MedicationRequestStatus = fhir.MedicationRequestStatus;
import Ratio = fhir.Ratio;
import Duration = fhir.Duration;
import uri = fhir.uri;
import Quantity = fhir.Quantity;
import Coding = fhir.Coding;
import MedicationRequestDispenseRequest = fhir.MedicationRequestDispenseRequest;
import Period = fhir.Period;
import dateTime = fhir.dateTime;

export class MedicationRequestBuilder {

  private readonly _resource: MedicationRequest;

  constructor(status: MedicationRequestStatus, intent: MedicationRequestIntent, subject: Reference) {
    this._resource = {
      resourceType: 'MedicationRequest',
      contained: new Array<Resource>(),
      status,
      intent,
      subject,
      dosageInstruction: new Array<Dosage>(),
      dispenseRequest: new MedicationRequestDispenseRequestBuilder()
        .setValidityPeriod(new PeriodBuilder()
          .setStart(Utils.now())
          .build())
        .setExpectedSupplyDuration(new DurationBuilder().build())
        .build()
    };
  }

  public intent(intent: MedicationRequestIntent): this {
    this._resource.intent = intent;
    return this;
  }

  public subject(subject: Reference): this {
    this._resource.subject = subject;
    return this;
  }

  public build(): MedicationRequest {
    return this._resource;
  }
}

export class MedicationBuilder {
  private readonly _medication: Medication;

  constructor(medicationId: id) {
    this._medication = {
      resourceType: 'Medication',
      id: medicationId
    } as Medication;
  }

  public code(medicationCode: CodeableConcept): this {
    this._medication.code = medicationCode;
    return this;
  }

  public form(medicationForm: CodeableConcept): this {
    this._medication.form = medicationForm;
    return this;
  }

  public ingredient(ingredient: Array<MedicationIngredient>): this {
    this._medication.ingredient = ingredient;
    return this;
  }

  public build(): Medication {
    return this._medication;
  }
}

export class MedicationRequestDispenseRequestBuilder {
  private readonly _dispenseRequest: MedicationRequestDispenseRequest;

  constructor() {
    this._dispenseRequest = {} as MedicationRequestDispenseRequest;
  }

  public setValidityPeriod(period: Period): this {
    this._dispenseRequest.validityPeriod = period;
    return this;
  }

  public setExpectedSupplyDuration(duration: Duration): this {
    this._dispenseRequest.expectedSupplyDuration = duration;
    return this;
  }

  public build(): MedicationRequestDispenseRequest {
    return this._dispenseRequest;
  }
}

export class MedicationIngredientBuilder {
  private readonly _medicationIngredient: MedicationIngredient;

  constructor() {
    this._medicationIngredient = {

    } as MedicationIngredient;
  }

  public setItemCodeableConcept(concept: CodeableConcept): this {
    this._medicationIngredient.itemCodeableConcept = concept;
    return this;
  }

  public setItemReference(reference: Reference): this {
    this._medicationIngredient.itemReference = reference;
    return this;
  }

  public setStrength(strength: Ratio): this {
    this._medicationIngredient.strength = strength;
    return this;
  }

  public build(): MedicationIngredient {
    return this._medicationIngredient;
  }
}

export class DosageBuilder {
  private readonly _dosage: Dosage;

  constructor(sequence: integer) {
    this._dosage = {
      sequence,
      timing: {
        repeat: {
          duration: undefined,
          durationUnit: 'h',
          timeOfDay: new Array<time>()
        }
      },
      asNeededCodeableConcept: undefined,
      route: undefined,
      doseAndRate: new Array<DoseAndRate>()
    } as Dosage;
  }

  public route(route: CodeableConcept): this {
    this._dosage.route = route;
    return this;
  }

  public build(): Dosage {
    return this._dosage;
  }
}

export class DoseAndRateBuilder {
  private readonly _doseAndRate: DoseAndRate;

  constructor() {
    this._doseAndRate = {
      type: new CodeableConceptBuilder()
        .addCoding(new CodingBuilder()
          .setCode('ordered')
          .setSystem('http://terminology.hl7.org/CodeSystem/dose-rate-type')
          .setDisplay('Ordered')
          .build())
        .setText('Ordered')
        .build(),
      doseQuantity: new QuantityBuilder().build()
    };
  }

  public build(): DoseAndRate {
    return this._doseAndRate;
  }
}

export class ReferenceBuilder {

  private readonly _id: id;

  private _resourceType: code;

  private readonly _reference: Reference;

  constructor(referenceId: id) {
    this._id = referenceId;
    this._reference = {

    } as Reference;
  }

  public resourceType(resourceType: code): this {
    this._resourceType = resourceType;
    return this;
  }

  public display(display: string): this {
    this._reference.display = display;
    return this;
  }

  public build(): Reference {
    if (this._resourceType == null) {
      this._reference.reference = '#' + this._id;
    }
    else {
      this._reference.reference = this._resourceType + '/' + this._id;
    }
    return this._reference;
  }
}

export class TimeBuilder {
  private readonly _time: time;

  constructor() {
    this._time = '' as time;
  }

  public build(): time {
    return this._time;
  }
}

export class RatioBuilder {
  private readonly _ratio: Ratio;

  constructor() {
    this._ratio = {
      numerator: new QuantityBuilder().build()
    } as Ratio;
  }

  public setNumeratorValue(value: number): this {
    this._ratio.numerator.value = value;
    return this;
  }

  public setNumeratorUnit(unit: string): this {
    this._ratio.numerator.unit = unit;
    return this;
  }

  public setNumeratorCode(numeratorCode: code): this {
    this._ratio.numerator.code = numeratorCode;
    return this;
  }

  public setNumeratorSystem(system: uri): this {
    this._ratio.numerator.system = system;
    return this;
  }

  public build(): Ratio {
    return this._ratio;
  }
}

export class QuantityBuilder {
  private readonly _quantity: Quantity;

  constructor() {
    this._quantity = {} as Quantity;
  }

  public setValue(value: number): this {
    this._quantity.value = value;
    return this;
  }

  public setUnit(unit: string): this {
    this._quantity.unit = unit;
    return this;
  }

  public setCode(quantityCode: code): this {
    this._quantity.code = quantityCode;
    return this;
  }

  public setSystem(system: uri): this {
    this._quantity.system = system;
    return this;
  }

  public build(): Quantity {
    return this._quantity;
  }
}

export class DurationBuilder {
  private readonly _duration: Duration;

  constructor() {
    this._duration = {} as Duration;
  }

  public setValue(value: number): this {
    this._duration.value = value;
    return this;
  }

  public setUnit(unit: string): this {
    this._duration.unit = unit;
    return this;
  }

  public setCode(durationCode: code): this {
    this._duration.code = durationCode;
    return this;
  }

  public setSystem(system: uri): this {
    this._duration.system = system;
    return this;
  }

  public build(): Duration {
    return this._duration;
  }
}

export class CodeableConceptBuilder {
  private readonly _concept: CodeableConcept;

  constructor() {
    this._concept = {
      coding: new Array<Coding>()
    } as CodeableConcept;
  }

  public addCoding(coding: Coding): this {
    this._concept.coding.push(coding);
    return this;
  }

  public setText(text: string): this {
    this._concept.text = text;
    return this;
  }

  public build(): CodeableConcept {
    return this._concept;
  }
}

export class CodingBuilder {
  private readonly _coding: Coding;

  constructor() {
    this._coding = {} as Coding;
  }

  public setCode(codingCode: code): this {
    this._coding.code = codingCode;
    return this;
  }

  public setSystem(system: uri): this {
    this._coding.system = system;
    return this;
  }

  public setDisplay(display: string): this {
    this._coding.display = display;
    return this;
  }

  public build(): Coding {
    return this._coding;
  }
}

export class PeriodBuilder {
  private readonly _period: Period;

  constructor() {
    this._period = {} as Period;
  }

  public setStart(periodStart: dateTime): this {
    this._period.start = periodStart;
    return this;
  }

  public setEnd(periodEnd: dateTime): this {
    this._period.end = periodEnd;
    return this;
  }

  public build(): Period {
    return this._period;
  }
}
