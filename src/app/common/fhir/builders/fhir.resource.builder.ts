import {
  code,
  CodeableConcept, Coding, dateTime, decimal,
  Dosage, DosageDoseAndRate, Duration, id, integer,
  Medication, MedicationIngredient,
  MedicationRequest, MedicationRequestDispenseRequest,
  MedicationRequestIntent,
  MedicationRequestStatus, Period, positiveInt, Quantity, Ratio,
  Reference,
  Resource, time, Timing, TimingRepeat, UnitsOfTime, unsignedInt, uri, ValueSetContains
} from 'phast-fhir-ts';
import {EventTiming} from 'phast-fhir-ts/lib/hl7/r4/fhir';

export class MedicationRequestBuilder {

  private readonly _resource: MedicationRequest;

  constructor(status: MedicationRequestStatus,
              intent: MedicationRequestIntent,
              subject: Reference) {
    this._resource = {
      resourceType: 'MedicationRequest',
      contained: new Array<Resource>(),
      status,
      intent,
      subject
    };
  }

  public intent(intent: MedicationRequestIntent): this {
    if (intent) {
      this._resource.intent = intent;
    }
    return this;
  }

  public subject(subject: Reference): this {
    if (subject) {
      this._resource.subject = subject;
    }
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
    if (medicationCode) {
      this._medication.code = medicationCode;
    }
    return this;
  }

  public form(medicationForm: CodeableConcept): this {
    if (medicationForm) {
      this._medication.form = medicationForm;
    }
    return this;
  }

  public ingredient(ingredient: Array<MedicationIngredient>): this {
    if (ingredient) {
      this._medication.ingredient = ingredient;
    }
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

  public validityPeriod(period: Period): this {
    if (period) {
      this._dispenseRequest.validityPeriod = period;
    }
    return this;
  }

  public expectedSupplyDuration(duration: Duration): this {
    if (duration) {
      this._dispenseRequest.expectedSupplyDuration = duration;
    }
    return this;
  }

  public build(): MedicationRequestDispenseRequest {
    return this._dispenseRequest;
  }
}

export class MedicationIngredientBuilder {

  private readonly _medicationIngredient: MedicationIngredient;

  constructor() {
    this._medicationIngredient = {} as MedicationIngredient;
  }

  public itemCodeableConcept(concept: CodeableConcept): this {
    this._medicationIngredient.itemCodeableConcept = concept;
    return this;
  }

  public itemReference(reference: Reference): this {
    if (reference) {
      this._medicationIngredient.itemReference = reference;
    }
    return this;
  }

  public strength(strength: Ratio): this {
    if (strength) {
      this._medicationIngredient.strength = strength;
    }
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
      sequence
    } as Dosage;
  }

  public route(route: CodeableConcept): this {
    if (route) {
      this._dosage.route = route;
    }
    return this;
  }

  public timing(timing: Timing): this {
    if (timing) {
      this._dosage.timing = timing;
    }
    return this;
  }

  public asNeededCodeableConcept(asNeedCodeableConcept: CodeableConcept): this {
    if (asNeedCodeableConcept) {
      this._dosage.asNeededCodeableConcept = asNeedCodeableConcept;
    }
    return this;
  }

  public doseAndRate(doseAndRate: DosageDoseAndRate[]): this {
    if (doseAndRate) {
      this._dosage.doseAndRate = doseAndRate;
    }
    return this;
  }

  public addDoseAndRate(doseAndRate: DosageDoseAndRate): this {
    if (this._dosage.doseAndRate) {
      this._dosage.doseAndRate = new Array<DosageDoseAndRate>(doseAndRate);
    }
    else {
      this._dosage.doseAndRate.push(doseAndRate);
    }
    return this;
  }

  public build(): Dosage {
    return this._dosage;
  }
}

export class DoseAndRateBuilder {

  private readonly _dosageDoseAndRate: DosageDoseAndRate;

  constructor() {
    this._dosageDoseAndRate = {
      type: new CodeableConceptBuilder()
        .addCoding(new CodingBuilder()
          .code('ordered')
          .system('http://terminology.hl7.org/CodeSystem/dose-rate-type')
          .display('Ordered')
          .build())
        .text('Ordered')
        .build()
    };
  }

  public doseQuantity(doseQuantity: Quantity): this {
    if (doseQuantity) {
      this._dosageDoseAndRate.doseQuantity = doseQuantity;
    }
    return this;
  }

  public rateRatio(rateRatio: Ratio): this {
    if (rateRatio) {
      this._dosageDoseAndRate.rateRatio = rateRatio;
    }
    return this;
  }

  public rateQuantity(rateQuantity: Quantity): this {
    if (rateQuantity) {
      this._dosageDoseAndRate.rateQuantity = rateQuantity;
    }
    return this;
  }

  public build(): DosageDoseAndRate {
    return this._dosageDoseAndRate;
  }
}

export class ReferenceBuilder {

  private readonly _id: id;

  private _resourceType: code;

  private _baseUrl: uri;

  private readonly _reference: Reference;

  constructor(referenceId: id) {
    this._id = referenceId;
    this._reference = {} as Reference;
  }

  public resourceType(resourceType: code): this {
    if (resourceType) {
      this._resourceType = resourceType;
    }
    return this;
  }

  public display(referenceDisplay: string): this {
    if (referenceDisplay) {
      this._reference.display = referenceDisplay;
    }
    return this;
  }

  public baseUrl(baseUrl: uri): this {
    if (baseUrl) {
      this._baseUrl = baseUrl;
    }
    return this;
  }

  public build(): Reference {
    if (this._resourceType == null) {
      this._reference.reference = '#' + this._id;
    }
    else if (this._baseUrl && this._resourceType) {
      this._reference.reference = this._baseUrl + '/' + this._resourceType + '/' + this._id;
    }
    else {
      this._reference.reference = this._resourceType + '/' + this._id;
    }
    return this._reference;
  }
}

export class TimingBuilder {

  private readonly _timing: Timing;

  constructor() {
    this._timing = {} as Timing;
  }

  public timingRepeat(timingRepeat: TimingRepeat): this {
    if (timingRepeat) {
      this._timing.repeat = timingRepeat;
    }
    return this;
  }

  public build(): Timing {
    return this._timing;
  }
}

export class TimingRepeatBuilder {

  private readonly _timingRepeat: TimingRepeat;

  constructor() {
    this._timingRepeat = {} as TimingRepeat;
  }

  public boundsDuration(boundsDuration: Duration): this {
    if (boundsDuration) {
      this._timingRepeat.boundsDuration = boundsDuration;
    }
    return this;
  }

  public boundsPeriod(boundsPeriod: Period): this {
    if (boundsPeriod) {
      this._timingRepeat.boundsPeriod = boundsPeriod;
    }
    return this;
  }

  public duration(duration: decimal): this {
    if (duration) {
      this._timingRepeat.duration = duration;
      this._timingRepeat.durationUnit = 'h';
    }
    return this;
  }

  public durationUnit(durationUnit: UnitsOfTime): this {
    if (durationUnit) {
      this._timingRepeat.durationUnit = durationUnit;
    }
    return this;
  }

  public frequency(frequency: positiveInt): this {
    if (frequency) {
      this._timingRepeat.frequency = frequency;
    }
    return this;
  }

  public period(period: decimal): this {
    if (period) {
      this._timingRepeat.period = period;
      this._timingRepeat.durationUnit = 'h';
    }
    return this;
  }

  public periodUnit(periodUnit: UnitsOfTime): this {
    if (periodUnit) {
      this._timingRepeat.periodUnit = periodUnit;
    }
    return this;
  }

  public timeOfDay(timeOfDay: time[]): this {
    if (timeOfDay) {
      this._timingRepeat.timeOfDay = timeOfDay;
    }
    return this;
  }

  public addTimeOfDay(timeOfDay: time): this {
    if (timeOfDay) {
      if (!this._timingRepeat.timeOfDay) {
        this._timingRepeat.timeOfDay = new Array<time>(timeOfDay);
      }
      else {
        this._timingRepeat.timeOfDay.push(timeOfDay);
      }
    }
    return this;
  }

  public dayOfWeek(dayOfWeek: code[]): this {
    if (dayOfWeek) {
      this._timingRepeat.dayOfWeek = dayOfWeek;
    }
    return this;
  }

  public when(when: EventTiming[]): this {
    if (when) {
      this._timingRepeat.when = when;
    }
    return this;
  }

  public addWhen(when: EventTiming): this {
    if (when) {
      if (!this._timingRepeat.when) {
        this._timingRepeat.when = new Array<EventTiming>(when);
      }
      else {
        this._timingRepeat.when.push(when);
      }
    }
    return this;
  }

  public offset(offset: unsignedInt): this {
    if (offset) {
      this._timingRepeat.offset = offset;
    }
    return this;
  }

  public build(): TimingRepeat {
    return this._timingRepeat;
  }
}

export class RatioBuilder {

  private readonly _ratio: Ratio;

  constructor() {
    this._ratio = {} as Ratio;
  }

  public numeratorQuantity(numeratorQuantity: Quantity): this {
    if (numeratorQuantity) {
      this._ratio.numerator = numeratorQuantity;
    }
    return this;
  }

  public denominatorQuality(denominatorQuantity: Quantity): this {
    if (denominatorQuantity) {
      this._ratio.denominator = denominatorQuantity;
    }
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

  public value(quantityValue: number): this {
    if (quantityValue) {
      this._quantity.value = quantityValue;
    }
    return this;
  }

  public unit(quantityUnit: string): this {
    if (quantityUnit) {
      this._quantity.unit = quantityUnit;
    }
    return this;
  }

  public code(quantityCode: code): this {
    if (quantityCode) {
      this._quantity.code = quantityCode;
    }
    return this;
  }

  public system(quantitySystem: uri): this {
    if (quantitySystem) {
      this._quantity.system = quantitySystem;
    }
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

  public value(durationValue: number): this {
    if (durationValue) {
      this._duration.value = durationValue;
    }
    return this;
  }

  public unit(durationUnit: string): this {
    if (durationUnit) {
      this._duration.unit = durationUnit;
    }
    return this;
  }

  public code(durationCode: code): this {
    if (durationCode) {
      this._duration.code = durationCode;
    }
    return this;
  }

  public system(durationSystem: uri): this {
    if (durationSystem) {
      this._duration.system = durationSystem;
    }
    return this;
  }

  public default(): this {
    this._duration.code = 'd';
    this._duration.unit = 'j';
    this._duration.system = 'http://unitsofmeasure.org';
    return this;
  }

  public build(): Duration {
    return this._duration;
  }
}

export class CodeableConceptBuilder {

  private readonly _concept: CodeableConcept;

  constructor() {
    this._concept = {} as CodeableConcept;
  }

  public addCoding(coding: Coding): this {
    if (coding) {
      if (this._concept.coding) {
        this._concept.coding.push(coding);
      }
      else {
        this._concept.coding = new Array<Coding>(coding);
      }
    }
    return this;
  }

  public text(text: string): this {
    if (text) {
      this._concept.text = text;
    }
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

  public code(codingCode: code): this {
    if (codingCode) {
      this._coding.code = codingCode;
    }
    return this;
  }

  public system(codingSystem: uri): this {
    if (codingSystem) {
      this._coding.system = codingSystem;
    }
    return this;
  }

  public display(codingDisplay: string): this {
    if (codingDisplay) {
      this._coding.display = codingDisplay;
    }
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

  public start(periodStart: dateTime): this {
    if (periodStart) {
      this._period.start = periodStart;
    }
    return this;
  }

  public end(periodEnd: dateTime): this {
    if (periodEnd) {
      this._period.end = periodEnd;
    }
    return this;
  }

  public build(): Period {
    return this._period;
  }
}

export class ValueSetContainsBuilder {

  private readonly _valueSetContains: ValueSetContains;

  constructor() {
    this._valueSetContains = {} as ValueSetContains;
  }

  public system(containsSystem: uri): this {
    if (containsSystem) {
      this._valueSetContains.system = containsSystem;
    }
    return this;
  }

  public abstract(containsAbstract: boolean): this {
    if (containsAbstract) {
      this._valueSetContains.abstract = containsAbstract;
    }
    return this;
  }

  public inactive(containsInactive: boolean): this {
    if (containsInactive) {
      this._valueSetContains.inactive = containsInactive;
    }
    return this;
  }

  public version(containsVersion: string): this {
    if (containsVersion) {
      this._valueSetContains.version = containsVersion;
    }
    return this;
  }

  public code(containsCode: code): this {
    if (containsCode) {
      this._valueSetContains.code = containsCode;
    }
    return this;
  }

  public display(containsDisplay: string): this {
    if (containsDisplay) {
      this._valueSetContains.display = containsDisplay;
    }
    return this;
  }

  public build(): ValueSetContains {
    return this._valueSetContains;
  }
}
