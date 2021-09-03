/**
 * @license
 * Copyright PHAST SARL All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://cds-access.phast.fr/license
 */
import * as lodash from 'lodash';
import {DateTime} from 'luxon';
import {Utils} from '../../common/cds-access/utils/utils';
import {IAction, IPartialState} from '../../common/cds-access/models/state.model';
import {
  MedicationFormStateAddMedication,
  MedicationFormStateAddMedicationRequest,
  MedicationFormStateAddTimeOfDay,
  MedicationFormStateValueChangesDosageInstruction,
  MedicationFormStateValueChangesDispenseRequest,
  MedicationFormStateAddDosageInstruction,
  MedicationFormStateRemoveDosageInstruction,
  MedicationFormStateRemoveTimeOfDay,
  MedicationFormStateAddDoseAndRate,
  MedicationFormStateRemoveDoseAndRate,
  MedicationFormStateRemoveMedication,
  MedicationFormStateValueChangesMedication,
  MedicationFormStateCdsHelp,
  MedicationFormStateValueChangesTreatmentIntent, MedicationFormStateRemoveWhen, MedicationFormStateAddWhen
} from './medication-request-form.state';
import {
  CodeableConceptBuilder, CodingBuilder,
  DosageBuilder,
  DoseAndRateBuilder, DurationBuilder,
  MedicationBuilder, MedicationIngredientBuilder,
  MedicationRequestBuilder, MedicationRequestDispenseRequestBuilder, PeriodBuilder, QuantityBuilder, RatioBuilder,
  ReferenceBuilder, TimingBuilder, TimingRepeatBuilder
} from '../../common/fhir/builders/fhir.resource.builder';
import {
  code,
  CodeableConcept, Coding, decimal, Dosage, DosageDoseAndRate, Extension,
  id,
  Medication,
  MedicationKnowledge,
  MedicationRequest, MedicationRequestDispenseRequest, Patient, Practitioner,
  Ratio,
  Reference, time, UnitsOfTime, ValueSetContains
} from 'phast-fhir-ts';
import {EventTiming} from 'phast-fhir-ts/lib/hl7/r4/fhir';

export class MedicationFormActionAddMedicationRequest implements IAction {
  readonly type = 'AddMedicationRequest';

  constructor(private _medicationRequest: MedicationRequest) {
  }

  public execute(): IPartialState {
    return new MedicationFormStateAddMedicationRequest();
  }
}

export class MedicationFormActionCdsHelp implements IAction {
  readonly type = 'CdsHelp';

  constructor(private _medicationRequest: MedicationRequest) {
  }

  public execute(): IPartialState {
    return new MedicationFormStateCdsHelp();
  }
}

export class MedicationFormActionAddMedication implements IAction {
  type = 'AddMedication';

  constructor(private _medicationRequest: MedicationRequest,
              private _medicationKnowledge: MedicationKnowledge,
              private _medicationId: id,
              private _patient: Patient,
              private _practitioner: Practitioner) {
  }

  public execute(): IPartialState {
    let medicationRequest = lodash.cloneDeep(this._medicationRequest);
    const medication = new MedicationBuilder(this._medicationId)
      .code(this._medicationKnowledge.code)
      .form(this._medicationKnowledge.doseForm)
      .ingredient(lodash.cloneDeep(this._medicationKnowledge.ingredient))
      .build();
    if (!medicationRequest && this._patient) {
      medicationRequest = new MedicationRequestBuilder(
          'active',
          'order',
          new ReferenceBuilder(this._patient.id)
            .resourceType('Patient')
            .build()
        )
          .build();

      medicationRequest.dosageInstruction = new Array<Dosage>(
        new DosageBuilder(1)
          .timing(new TimingBuilder()
            .timingRepeat(new TimingRepeatBuilder()
              .boundsPeriod(new PeriodBuilder()
                .start(DateTime.now().toFormat('yyyy-MM-dd'))
                .build()
              )
              .boundsDuration(new DurationBuilder()
                .default()
                .build()
              )
              .build()
            )
            .build()
          )
          .build()
      );
      medicationRequest.dispenseRequest = new MedicationRequestDispenseRequestBuilder()
        .validityPeriod(new PeriodBuilder()
          .start(DateTime.now().toFormat('yyyy-MM-dd'))
          .build())
        .build();

      medicationRequest.medicationReference = new ReferenceBuilder(medication.id)
        .build();

      if (this._practitioner) {
        medicationRequest.requester = new ReferenceBuilder(this._practitioner.id)
          .resourceType(this._practitioner.resourceType)
          .build();
      }
    }
    else if (medicationRequest.contained.length === 0) {
      medicationRequest.medicationReference = new ReferenceBuilder(medication.id)
        .build();
    }
    else if (medicationRequest.contained.length === 1) {
      const medicationOld = medicationRequest.contained.shift() as Medication;

      const medicationRoot = new MedicationBuilder('med-root')
        .code({
          text: medicationOld.code.text + '&' + medication.code.text
        })
        .ingredient([new MedicationIngredientBuilder()
          .itemReference(new ReferenceBuilder(medicationOld.id)
            .display(medicationOld.code.text)
            .build()
          )
          .strength(medicationOld.ingredient[0]?.strength)
          .build(),
          new MedicationIngredientBuilder()
            .itemReference(new ReferenceBuilder(medication.id)
              .display(medication.code.text)
              .build())
            .build()
        ])
        .build();
      medicationRequest.contained.push(medicationRoot);
      medicationRequest.contained.push(medicationOld);
      medicationRequest.medicationReference = new ReferenceBuilder(medicationRoot.id)
        .build();
    }
    else if (medicationRequest.contained.length !== 0) {
      const medicationRoot = medicationRequest.contained[0] as Medication;
      medicationRoot.code.text += '&' + medication.code.text;
      medicationRoot.ingredient.push(new MedicationIngredientBuilder()
        .itemReference(new ReferenceBuilder(medication.id)
          .display(medication.code.text)
          .build())
        .build());
    }

    medicationRequest.contained.push(medication);

    return new MedicationFormStateAddMedication(medicationRequest, this._medicationKnowledge);
  }
}

export class MedicationFormActionRemoveMedication implements IAction {
  readonly type = 'RemoveMedication';

  constructor(private _medicationRequest: MedicationRequest,
              private _nMedication: number) {
  }

  public execute(): IPartialState {
    if (this._nMedication === 0) {
      return new MedicationFormStateRemoveMedication(null, this._nMedication);
    }

    const medicationRequest = lodash.cloneDeep(this._medicationRequest);
    const contained = medicationRequest.contained;
    if (this._nMedication !== 0 && contained.length === 3) {
      contained.splice(this._nMedication, 1);
      contained.splice(0, 1);
      const medication = contained[0];
      medicationRequest.medicationReference = new ReferenceBuilder(medication.id)
        .build();
    }
    else {
      const medicationRoot = contained[0] as Medication;
      medicationRoot.ingredient.splice(this._nMedication, 1);
      contained.splice(this._nMedication, 1);
    }
    return new MedicationFormStateRemoveMedication(medicationRequest, this._nMedication);
  }
}

export class MedicationFormActionValueChangesMedicationForm implements IAction {
  readonly type = 'ValueChangesMedicationForm';

  constructor(private _medicationRequest: MedicationRequest,
              private _medication: Medication,
              private _formValue: CodeableConcept) {
  }

  public execute(): IPartialState {
    const medicationRequest = lodash.cloneDeep(this._medicationRequest);
    const nMedication = medicationRequest.contained.findIndex(
      (value) => {
        return value.id === this._medication.id;
      }
    );

    const medication = medicationRequest.contained[nMedication];
    if (this._formValue) {
      medication.form = this._formValue;
    }
    else {
      delete medication.form;

      if (medication.ingredient) {
        medication.ingredient.forEach(ingredient => {
          if (ingredient?.itemCodeableConcept) {
            delete ingredient?.strength;
          }
        });
      }
    }

    return new MedicationFormStateValueChangesMedication(medicationRequest);
  }
}

export class MedicationFormActionValueChangesMedicationIngredientStrength implements IAction {
  readonly type = 'ValueChangesMedicationIngredientStrength';

  constructor(private _medicationRequest: MedicationRequest,
              private _medication: Medication,
              private _itemCodeableConcept: CodeableConcept,
              private _strengthValue: Ratio) {
  }

  public execute(): IPartialState {
    const medicationRequest = lodash.cloneDeep(this._medicationRequest);
    const nMedication = medicationRequest.contained.findIndex(
      (value) => {
        return value.id === this._medication.id;
      }
    );
    const medication = medicationRequest.contained[nMedication];

    const nIngredient = medication.ingredient.findIndex(
      value => value.itemCodeableConcept.text === this._itemCodeableConcept.text
    );
    const ingredient = medication.ingredient[nIngredient];

    if (this._strengthValue) {
      ingredient.strength = this._strengthValue;
    }
    else {
      delete ingredient.strength;
      delete medication.form;
    }

    return new MedicationFormStateValueChangesMedication(medicationRequest);
  }
}

export class MedicationFormActionValueChangesMedicationIngredientStrengthValue implements IAction {
  readonly type = 'ValueChangesMedicationIngredientStrengthValue';

  constructor(private _medicationRequest: MedicationRequest,
              private _medication: Medication,
              private _itemReference: Reference,
              private _strengthValue: number) {
  }

  public execute(): IPartialState {
    const medicationRequest = lodash.cloneDeep(this._medicationRequest);
    const nMedication = this._medicationRequest.contained.findIndex(
      (value) => {
        return value.id === this._medication.id;
      }
    );
    const nIngredient = this._medication.ingredient.findIndex(
      value => value.itemReference === this._itemReference
    );

    if (this._strengthValue) {
      if (!this._medication.ingredient[nIngredient].strength) {
        this._medication.ingredient[nIngredient].strength = new RatioBuilder()
          .numeratorValue(this._strengthValue)
          .build();
      }
      else {
        this._medication.ingredient[nIngredient].strength.numerator.value = this._strengthValue;
      }
    }
    else {
      if (!this._medication.ingredient[nIngredient].strength.numerator.code) {
        delete this._medication.ingredient[nIngredient].strength;
      }
      else {
        this._medication.ingredient[nIngredient].strength.numerator.value = null;
      }
    }

    medicationRequest.contained[nMedication] = this._medication;
    return new MedicationFormStateValueChangesMedication(medicationRequest);
  }
}

export class MedicationFormActionValueChangesMedicationIngredientStrengthUnit implements IAction {
  readonly type = 'ValueChangesMedicationIngredientStrengthUnit';

  constructor(private _medicationRequest: MedicationRequest,
              private _medication: Medication,
              private _itemReference: Reference,
              private _strengthUnit: Coding) {
  }

  public execute(): IPartialState {
    const medicationRequest = lodash.cloneDeep(this._medicationRequest);
    const nMedication = medicationRequest.contained.findIndex(
      (value) => {
        return value.id === this._medication.id;
      }
    );
    const nIngredient = this._medication.ingredient.findIndex(
      value => value.itemReference === this._itemReference
    );

    if (this._strengthUnit) {
      if (!this._medication.ingredient[nIngredient].strength) {
        this._medication.ingredient[nIngredient].strength = new RatioBuilder()
          .numeratorUnit(this._strengthUnit.display)
          .numeratorSystem(this._strengthUnit.system)
          .numeratorCode(this._strengthUnit.code)
          .build();
      }
      else {
        this._medication.ingredient[nIngredient].strength.numerator.unit = this._strengthUnit.display;
        this._medication.ingredient[nIngredient].strength.numerator.code = this._strengthUnit.code;
        this._medication.ingredient[nIngredient].strength.numerator.system = this._strengthUnit.system;
      }
    }
    else {
      if (!this._medication.ingredient[nIngredient].strength.numerator.value) {
        delete this._medication.ingredient[nIngredient].strength;
      }
      else {
        this._medication.ingredient[nIngredient].strength.numerator.unit = null;
        this._medication.ingredient[nIngredient].strength.numerator.code = null;
        this._medication.ingredient[nIngredient].strength.numerator.system = null;
      }
    }
    medicationRequest.contained[nMedication] = this._medication;
    return new MedicationFormStateValueChangesMedication(medicationRequest);
  }
}

export class MedicationFormActionAddDosageInstruction implements IAction {
  readonly type = 'AddDosageInstruction';

  constructor(private _medicationRequest: MedicationRequest) {
  }

  public execute(): IPartialState {
    const medicationRequest = lodash.cloneDeep(this._medicationRequest);
    if (!medicationRequest.dosageInstruction) {
      medicationRequest.dosageInstruction = new Array<Dosage>();
    }
    const dosageInstruction =
      new DosageBuilder(medicationRequest.dosageInstruction.length + 1)
        .timing(new TimingBuilder()
          .timingRepeat(new TimingRepeatBuilder()
              .boundsPeriod(new PeriodBuilder()
                  .start(DateTime.now().toFormat('yyyy-MM-dd'))
                  .build()
                )
                .boundsDuration(new DurationBuilder()
                  .default()
                  .build()
                )
                .build()
            )
            .build()
        )
        .build();
    medicationRequest.dosageInstruction.push(dosageInstruction);
    return new MedicationFormStateAddDosageInstruction(medicationRequest);
  }
}

export class MedicationFormActionRemoveDosageInstruction implements IAction {
  readonly type = 'RemoveDosageInstruction';

  constructor(private _medicationRequest: MedicationRequest,
              private _nDosage: number) {
  }

  execute(): IPartialState {
    const medicationRequest = lodash.cloneDeep(this._medicationRequest);
    if (medicationRequest.dosageInstruction[this._nDosage]) {
      medicationRequest.dosageInstruction.splice(this._nDosage, 1);
    }
    if (medicationRequest.dosageInstruction.length === 0) {
      delete medicationRequest.dosageInstruction;
    }

    return new MedicationFormStateRemoveDosageInstruction(medicationRequest, this._nDosage);
  }
}

export class MedicationFormActionValueChangesDosageInstructionRoute implements IAction {
  readonly type = 'ValueChangesDosageInstructionRoute';

  constructor(private _medicationRequest: MedicationRequest,
              private _nDosage: number,
              private _routeValue: CodeableConcept,
              private _medication: Medication) {
  }

  public execute(): IPartialState {
    const medicationRequest = lodash.cloneDeep(this._medicationRequest);
    const dosage = medicationRequest.dosageInstruction[this._nDosage];

    if (this._routeValue) {
      dosage.route = this._routeValue;
    }
    else {
      delete dosage.route;
    }

    const nMedication = medicationRequest.contained.findIndex(
      (value) => {
        return value.id === this._medication.id;
      }
    );
    const medication = medicationRequest.contained[nMedication];
    if (!this._routeValue) {
      delete medication.form;
      if (medication.ingredient) {
        medication.ingredient.forEach(ingredient => {
          if (ingredient?.itemCodeableConcept) {
            delete ingredient?.strength;
          }
        });
      }
    }

    return new MedicationFormStateValueChangesDosageInstruction(medicationRequest, this._nDosage);
  }
}

export class MedicationFormActionValueChangesDosageInstructionBoundsDurationValue implements IAction {
  readonly type = 'ValueChangesDosageInstructionBoundsDurationValue';

  constructor(private _medicationRequest: MedicationRequest,
              private _nDosage: number,
              private _boundsDurationValue: decimal) { }

  public execute(): IPartialState {
    const medicationRequest = lodash.cloneDeep(this._medicationRequest);
    const dosage = medicationRequest.dosageInstruction[this._nDosage];

    if (this._boundsDurationValue) {
      if (!dosage.timing) {
        dosage.timing = new TimingBuilder()
          .timingRepeat(new TimingRepeatBuilder()
              .boundsDuration(new DurationBuilder()
                .value(this._boundsDurationValue)
                .build()
              )
            .build()
          )
          .build();
      }
      else if (!dosage.timing.repeat) {
        dosage.timing.repeat = new TimingRepeatBuilder()
          .boundsDuration(new DurationBuilder()
            .value(this._boundsDurationValue)
            .build()
          )
          .build();
      }
      else if (!dosage.timing.repeat.boundsDuration) {
        dosage.timing.repeat.boundsDuration = new DurationBuilder()
          .value(this._boundsDurationValue)
          .build();
      }
      else {
        dosage.timing.repeat.boundsDuration.value = this._boundsDurationValue;
      }
      this.synchronizeBounds(dosage);
    }
    else {
      if (dosage?.timing?.repeat?.boundsDuration) {
        if (dosage.timing.repeat.boundsDuration.code) {
          delete dosage.timing.repeat.boundsDuration;
        }
        else {
          dosage.timing.repeat.boundsDuration.value = undefined;
        }
      }
      if (dosage?.timing?.repeat?.boundsPeriod?.end) {
        delete dosage?.timing?.repeat?.boundsPeriod?.end;
        if (!dosage?.timing?.repeat?.boundsPeriod?.start) {
          delete dosage?.timing?.repeat?.boundsPeriod;
        }
      }
    }

    return new MedicationFormStateValueChangesDosageInstruction(medicationRequest, this._nDosage);
  }

  private synchronizeBounds(dosage): void {
    if (dosage.timing.repeat?.boundsPeriod?.start) {
      const start: DateTime = DateTime.fromISO(dosage.timing.repeat.boundsPeriod.start);

      let unit: string;
      if (dosage.timing.repeat.boundsDuration.code) {
        unit = dosage.timing.repeat.boundsDuration.code;
      }
      else {
        unit = 'd';
        dosage.timing.repeat.boundsDuration.code = 'd';
        dosage.timing.repeat.boundsDuration.unit = 'j';
        dosage.timing.repeat.boundsDuration.system = 'http://unitsofmeasure.org';
      }

      const duration = Utils.duration(dosage.timing.repeat.boundsDuration.value, unit);
      const end = start.plus(duration);

      dosage.timing.repeat.boundsPeriod.end = end.toFormat('yyyy-MM-dd');
    }
  }
}

export class MedicationFormActionValueChangesDosageInstructionBoundsDurationUnit implements IAction {
  readonly type = 'ValueChangesDosageInstructionBoundsDurationUnit';

  constructor(private _medicationRequest: MedicationRequest,
              private _nDosage: number,
              private _boundsDurationUnit: ValueSetContains) {
  }

  public execute(): IPartialState {
    const medicationRequest = lodash.cloneDeep(this._medicationRequest);
    const dosage = medicationRequest.dosageInstruction[this._nDosage];

    if (!dosage?.timing) {
      dosage.timing = new TimingBuilder()
        .timingRepeat(new TimingRepeatBuilder()
          .boundsDuration(new DurationBuilder()
              .unit(this._boundsDurationUnit.display)
              .code(this._boundsDurationUnit.code)
              .system(this._boundsDurationUnit.system)
              .build()
          )
          .build()
        )
        .build();
    }
    else if (!dosage?.timing?.repeat) {
      dosage.timing.repeat = new TimingRepeatBuilder()
        .boundsDuration(new DurationBuilder()
          .unit(this._boundsDurationUnit.display)
          .code(this._boundsDurationUnit.code)
          .system(this._boundsDurationUnit.system)
          .build()
        )
        .build();
    }
    else if (!dosage?.timing?.repeat?.boundsDuration) {
      dosage.timing.repeat.boundsDuration = new DurationBuilder()
        .unit(this._boundsDurationUnit.display)
        .code(this._boundsDurationUnit.code)
        .system(this._boundsDurationUnit.system)
        .build();
    }
    else {
      dosage.timing.repeat.boundsDuration.unit = this._boundsDurationUnit.display;
      dosage.timing.repeat.boundsDuration.code = this._boundsDurationUnit.code;
      dosage.timing.repeat.boundsDuration.system = this._boundsDurationUnit.system;
    }
    this.synchronizeBounds(dosage);

    return new MedicationFormStateValueChangesDosageInstruction(medicationRequest, this._nDosage);
  }

  private synchronizeBounds(dosage: Dosage): void {
    if (dosage.timing.repeat?.boundsPeriod?.start
      && dosage.timing.repeat?.boundsDuration?.value
      && dosage.timing.repeat?.boundsDuration?.code) {
      const start: DateTime = DateTime.fromISO(dosage.timing.repeat.boundsPeriod.start);
      const duration = Utils.duration(
        dosage.timing.repeat.boundsDuration.value,
        dosage.timing.repeat.boundsDuration.code
      );
      const end = start.plus(duration);

      dosage.timing.repeat.boundsPeriod.end = end.toFormat('yyyy-MM-dd');
    }
  }
}

export class MedicationFormActionValueChangesDosageInstructionBoundsPeriodStart implements IAction {
  readonly type = 'ValueChangesDosageInstructionBoundsPeriodStart';

  constructor(private _medicationRequest: MedicationRequest,
              private _nDosage: number,
              private _boundsPeriodStart: string) {
  }

  public execute(): IPartialState {
    const medicationRequest = lodash.cloneDeep(this._medicationRequest);
    const dosage = medicationRequest.dosageInstruction[this._nDosage];

    if (this._boundsPeriodStart) {
      const boundsPeriodStart = DateTime.fromFormat(this._boundsPeriodStart, 'dd/MM/yyyy').toFormat('yyyy-MM-dd');
      if (!dosage.timing) {
        dosage.timing = new TimingBuilder()
          .timingRepeat(new TimingRepeatBuilder()
            .boundsPeriod(new PeriodBuilder()
              .start(boundsPeriodStart)
              .build()
            )
            .build()
          )
          .build();
      }
      else if (!dosage.timing.repeat) {
        dosage.timing.repeat = new TimingRepeatBuilder()
          .boundsPeriod(new PeriodBuilder()
            .start(boundsPeriodStart)
            .build())
          .build();
      }
      else if (!dosage.timing.repeat.boundsPeriod) {
        dosage.timing.repeat.boundsPeriod = new PeriodBuilder()
          .start(boundsPeriodStart)
          .build();
      }
      else {
        dosage.timing.repeat.boundsPeriod.start = boundsPeriodStart;
      }
      this.synchronizeBounds(dosage);
    }
    else {
      if (dosage?.timing?.repeat?.boundsPeriod) {
        if (!dosage.timing.repeat.boundsPeriod.end) {
          delete dosage.timing.repeat.boundsPeriod;
        }
        else {
          delete dosage.timing.repeat.boundsPeriod.start;
        }
      }
    }

    return new MedicationFormStateValueChangesDosageInstruction(medicationRequest, this._nDosage);
  }

  private synchronizeBounds(dosage: Dosage): void {
    if (dosage.timing.repeat?.boundsPeriod?.start
      && dosage.timing.repeat?.boundsDuration?.value) {
      const start = DateTime.fromISO(dosage.timing.repeat.boundsPeriod.start);

      let unit;
      if (dosage.timing.repeat.boundsDuration.code) {
        unit = dosage.timing.repeat.boundsDuration.code;
      }
      else {
        unit = 'd';
        dosage.timing.repeat.boundsDuration.code = 'd';
        dosage.timing.repeat.boundsDuration.unit = 'j';
        dosage.timing.repeat.boundsDuration.system = 'http://unitsofmeasure.org';
      }
      const duration = Utils.duration(dosage.timing.repeat.boundsDuration.value, unit);
      const end = start.plus(duration);

      dosage.timing.repeat.boundsPeriod.end = end.toFormat('yyyy-MM-dd');
    }
    else if (dosage.timing.repeat?.boundsPeriod?.start
      && dosage.timing.repeat?.boundsPeriod?.end) {
      const start = DateTime.fromISO(dosage.timing.repeat.boundsPeriod.start);
      const end = DateTime.fromISO(dosage.timing.repeat.boundsPeriod.end);
      const duration = end.diff(start, 'days').as('days');
      if (dosage.timing.repeat.boundsDuration === undefined) {
        dosage.timing.repeat.boundsDuration = new DurationBuilder()
          .value(duration)
          .default()
          .build();
      }
      else {
        dosage.timing.repeat.boundsDuration.value = duration;
        dosage.timing.repeat.boundsDuration.code = 'd';
        dosage.timing.repeat.boundsDuration.unit = 'j';
        dosage.timing.repeat.boundsDuration.system = 'http://unitsofmeasure.org';
      }
    }
  }
}

export class MedicationFormActionValueChangesDosageInstructionBoundsPeriodEnd implements IAction {
  readonly type = 'ValueChangesDosageInstructionBoundsPeriodEnd';

  constructor(private _medicationRequest: MedicationRequest,
              private _nDosage: number,
              private _boundsPeriodEnd: string) {
  }

  public execute(): IPartialState {
    const medicationRequest = lodash.cloneDeep(this._medicationRequest);
    const dosage = medicationRequest.dosageInstruction[this._nDosage];

    if (this._boundsPeriodEnd) {
      const boundsPeriodEnd = DateTime.fromFormat(this._boundsPeriodEnd, 'dd/MM/yyyy').toFormat('yyyy-MM-dd');
      if (!dosage.timing) {
        dosage.timing = new TimingBuilder()
          .timingRepeat(new TimingRepeatBuilder()
            .boundsPeriod(new PeriodBuilder()
              .end(boundsPeriodEnd)
              .build()
            )
            .build())
          .build();
      }
      else if (!dosage.timing.repeat) {
        dosage.timing.repeat = new TimingRepeatBuilder()
          .boundsPeriod(new PeriodBuilder()
            .end(boundsPeriodEnd)
            .build()
          )
          .build();
      }
      else if (!dosage.timing.repeat.boundsPeriod) {
        dosage.timing.repeat.boundsPeriod = new PeriodBuilder()
          .end(boundsPeriodEnd)
          .build();
      }
      else {
        dosage.timing.repeat.boundsPeriod.end = boundsPeriodEnd;
      }
      this.synchronizedBounds(dosage);
    }
    else {
      if (dosage?.timing?.repeat?.boundsPeriod) {
        if (!dosage.timing.repeat.boundsPeriod.start) {
          delete dosage.timing.repeat.boundsPeriod;
        }
        else {
          delete dosage.timing.repeat.boundsPeriod.end;
        }
      }
      if (dosage?.timing?.repeat?.boundsDuration) {
        if (!dosage.timing.repeat.boundsDuration.value) {
          delete dosage.timing.repeat.boundsDuration;
        }
        else {
          delete dosage.timing.repeat.boundsDuration.value;
        }
      }
    }

    return new MedicationFormStateValueChangesDosageInstruction(medicationRequest, this._nDosage);
  }

  private synchronizedBounds(dosage): void {
    if (dosage.timing.repeat?.boundsPeriod?.start
      && dosage.timing.repeat?.boundsPeriod?.end) {
      const start = DateTime.fromISO(dosage.timing.repeat.boundsPeriod.start);
      const end = DateTime.fromISO(dosage.timing.repeat.boundsPeriod.end);
      const duration = end.diff(start, 'days').as('days');
      if (!dosage.timing.repeat.boundsDuration) {
        dosage.timing.repeat.boundsDuration = new DurationBuilder()
          .value(duration)
          .default()
          .build();
      }
      else {
        dosage.timing.repeat.boundsDuration.value = duration;
        dosage.timing.repeat.boundsDuration.code = 'd';
        dosage.timing.repeat.boundsDuration.unit = 'j';
        dosage.timing.repeat.boundsDuration.system = 'http://unitsofmeasure.org';
      }
    }
  }
}

export class MedicationFormActionValueChangesDosageInstructionDurationValue implements IAction {
  readonly type = 'ValueChangesDosageInstructionDurationValue';

  constructor(private _medicationRequest: MedicationRequest,
              private _nDosage: number,
              private _durationValue: decimal) {
  }

  public execute(): IPartialState {
    const medicationRequest = lodash.cloneDeep(this._medicationRequest);
    const dosage = medicationRequest.dosageInstruction[this._nDosage];

    if (this._durationValue) {
      if (!dosage.timing) {
        dosage.timing = new TimingBuilder()
          .timingRepeat(new TimingRepeatBuilder()
            .duration(this._durationValue)
            .build()
          )
          .build();
      }
      else if (!dosage.timing.repeat) {
        dosage.timing.repeat = new TimingRepeatBuilder()
          .duration(this._durationValue)
          .build();
      }
      else {
        dosage.timing.repeat.duration = this._durationValue;
      }
    }
    else {
      if (dosage.timing && dosage.timing.repeat) {
        delete dosage.timing.repeat.duration;
      }
    }

    return new MedicationFormStateValueChangesDosageInstruction(medicationRequest, this._nDosage);
  }
}

export class MedicationFormActionValueChangesDosageInstructionDurationUnit implements IAction {
  readonly type = 'ValueChangesDosageInstructionDurationUnit';

  constructor(private _medicationRequest: MedicationRequest,
              private _nDosage: number,
              private _durationUnit: ValueSetContains) {
  }

  public execute(): IPartialState {
    const medicationRequest = lodash.cloneDeep(this._medicationRequest);
    const dosage = medicationRequest.dosageInstruction[this._nDosage];

    if (this._durationUnit) {
      if (!dosage.timing) {
        dosage.timing = new TimingBuilder()
          .timingRepeat(
            new TimingRepeatBuilder()
              .durationUnit(this._durationUnit.code as UnitsOfTime)
              .build()
          )
          .build();
      }
      else if (!dosage.timing.repeat) {
        dosage.timing.repeat = new TimingRepeatBuilder()
          .durationUnit(this._durationUnit.code as UnitsOfTime)
          .build();
      }
      else {
        dosage.timing.repeat.durationUnit = this._durationUnit.code as UnitsOfTime;
      }
    }
    else {
      if (dosage.timing && dosage.timing.repeat) {
        delete dosage.timing.repeat.durationUnit;
      }
    }

    return new MedicationFormStateValueChangesDosageInstruction(medicationRequest, this._nDosage);
  }
}

export class MedicationFormActionValueChangesDosageInstructionFrequencyValue implements IAction {
  readonly type = 'ValueChangesDosageInstructionFrequencyValue';

  constructor(private _medicationRequest: MedicationRequest,
              private _nDosage: number,
              private _frequencyValue: decimal) {
  }

  public execute(): IPartialState {
    const medicationRequest = lodash.cloneDeep(this._medicationRequest);
    const dosage = medicationRequest.dosageInstruction[this._nDosage];

    if (this._frequencyValue) {
      if (!dosage.timing) {
        dosage.timing = new TimingBuilder()
          .timingRepeat(new TimingRepeatBuilder()
            .frequency(this._frequencyValue)
            .build()
          )
          .build();
      }
      else if (!dosage.timing.repeat) {
        dosage.timing.repeat = new TimingRepeatBuilder()
          .frequency(this._frequencyValue)
          .build();
      }
      else {
        dosage.timing.repeat.frequency = this._frequencyValue;
      }
    }
    else {
      if (dosage.timing && dosage.timing.repeat) {
        delete dosage.timing.repeat.frequency;
      }
    }

    return new MedicationFormStateValueChangesDosageInstruction(medicationRequest, this._nDosage);
  }
}

export class MedicationFormActionValueChangesDosageInstructionPeriodValue implements IAction {
  readonly type = 'ValueChangesDosageInstructionPeriodValue';

  constructor(private _medicationRequest: MedicationRequest,
              private _nDosage: number,
              private _periodValue: decimal) {
  }

  public execute(): IPartialState {
    const medicationRequest = lodash.cloneDeep(this._medicationRequest);
    const dosage = medicationRequest.dosageInstruction[this._nDosage];

    if (this._periodValue) {
      if (!dosage.timing) {
        dosage.timing = new TimingBuilder()
          .timingRepeat(new TimingRepeatBuilder()
            .period(this._periodValue)
            .build()
          )
          .build();
      }
      else if (!dosage.timing.repeat) {
        dosage.timing.repeat = new TimingRepeatBuilder()
          .period(this._periodValue)
          .build();
      }
      else {
        dosage.timing.repeat.period = this._periodValue;
      }
    }
    else {
      if (dosage.timing && dosage.timing.repeat) {
        delete dosage.timing.repeat.period;
      }
    }

    return new MedicationFormStateValueChangesDosageInstruction(medicationRequest, this._nDosage);
  }
}

export class MedicationFormActionValueChangesDosageInstructionPeriodUnit implements IAction {
  readonly type = 'ValueChangesDosageInstructionPeriodUnit';

  constructor(private _medicationRequest: MedicationRequest,
              private _nDosage: number,
              private _periodUnit: ValueSetContains) {
  }

  public execute(): IPartialState {
    const medicationRequest = lodash.cloneDeep(this._medicationRequest);
    const dosage = medicationRequest.dosageInstruction[this._nDosage];

    if (this._periodUnit) {
      if (!dosage.timing) {
        dosage.timing = new TimingBuilder()
          .timingRepeat(
            new TimingRepeatBuilder()
              .periodUnit(this._periodUnit.code as UnitsOfTime)
              .build()
          )
          .build();
      }
      else if (!dosage.timing.repeat) {
        dosage.timing.repeat = new TimingRepeatBuilder()
          .periodUnit(this._periodUnit.code as UnitsOfTime)
          .build();
      }
      else {
        dosage.timing.repeat.periodUnit = this._periodUnit.code as UnitsOfTime;
      }
    }
    else {
      if (dosage.timing && dosage.timing.repeat) {
        delete dosage.timing.repeat.periodUnit;
      }
    }

    return new MedicationFormStateValueChangesDosageInstruction(medicationRequest, this._nDosage);
  }
}

export class MedicationFormActionAddTimeOfDay implements IAction {
  readonly type = 'AddTimeOfDay';

  constructor(private _nDosage: number) {
  }

  public execute(): IPartialState {
    return new MedicationFormStateAddTimeOfDay(this._nDosage);
  }
}

export class MedicationFormActionRemoveTimeOfDay implements IAction {
  readonly type = 'RemoveTimeOfDay';

  constructor(private _medicationRequest: MedicationRequest,
              private _nDosage: number,
              private _nTimeOfDay: number) {
  }

  public execute(): IPartialState {
    const medicationRequest = lodash.cloneDeep(this._medicationRequest);
    const dosage = medicationRequest.dosageInstruction[this._nDosage];

    if (dosage.timing) {
      if (dosage.repeat) {
        if (dosage.timing.repeat.timeOfDay) {
          if (dosage.timing.repeat.timeOfDay[this._nTimeOfDay]) {
            dosage.timing.repeat.timeOfDay.splice(this._nTimeOfDay, 1);
          }
          if (dosage.timing.repeat.timeOfDay.length === 0) {
            delete dosage.timing.repeat.timeOfDay;
          }
        }
      }
    }

    return new MedicationFormStateRemoveTimeOfDay(medicationRequest, this._nDosage, this._nTimeOfDay);
  }
}

export class MedicationFormActionValueChangesDosageInstructionTimeOfDayValue implements IAction {
  readonly type = 'ValueChangesDosageInstructionTimeOfDay';

  constructor(private _medicationRequest: MedicationRequest,
              private _nDosage: number,
              private _nTimeOfDay: number,
              private _timeOfDayValue: time) {
  }

  public execute(): IPartialState {
    const medicationRequest = lodash.cloneDeep(this._medicationRequest);
    const dosage = medicationRequest.dosageInstruction[this._nDosage];

    if (this._timeOfDayValue) {
      const timeOfDayValue = DateTime.fromFormat(this._timeOfDayValue, 'hh:mm').toFormat('hh:mm:ss');
      if (!dosage.timing) {
        dosage.timing = new TimingBuilder()
          .timingRepeat(new TimingRepeatBuilder()
            .addTimeOfDay(timeOfDayValue)
            .build()
          )
          .build();
      }
      else if (!dosage.timing.repeat) {
        dosage.timing.repeat = new TimingRepeatBuilder()
          .addTimeOfDay(timeOfDayValue)
          .build();
      }
      else if (!dosage.timing.repeat.timeOfDay) {
        dosage.timing.repeat.timeOfDay = new Array<time>(timeOfDayValue);
      }
      else {
        dosage.timing.repeat.timeOfDay[this._nTimeOfDay] = timeOfDayValue;
      }
    }
    else {
      if (dosage?.timing?.repeat?.timeOfDay) {
        if (dosage?.timing?.repeat?.timeOfDay[this._nTimeOfDay]) {
          dosage.timing.repeat.timeOfDay.splice(this._nTimeOfDay, 1);
        }
        if (dosage?.timing?.repeat?.timeOfDay.length === 0) {
          delete dosage.timing.repeat.timeOfDay;
        }
      }
    }

    return new MedicationFormStateValueChangesDosageInstruction(medicationRequest, this._nDosage);
  }
}

export class MedicationFormActionValueChangesDosageInstructionDayOfWeek implements IAction {
  readonly type = 'ValueChangesDosageInstructionDayOfWeekValue';

  constructor(private _medicationRequest: MedicationRequest,
              private _nDosage: number,
              private _dayOfWeek: Array<{ name: string, checked: boolean }>) {
  }

  public execute(): IPartialState {
    const medicationRequest = lodash.cloneDeep(this._medicationRequest);
    const dosage = medicationRequest.dosageInstruction[this._nDosage];

    const dayOfWeekValues = (dosage.timing.repeat.dayOfWeek) ? dosage.timing.repeat.dayOfWeek : Array<code>();
    this._dayOfWeek.forEach(dayOfWeek => {
      if (dayOfWeek.checked && dayOfWeekValues.indexOf(dayOfWeek.name) === -1) {
        dayOfWeekValues.push(dayOfWeek.name);
      }
      else if (!dayOfWeek.checked && dayOfWeekValues.indexOf(dayOfWeek.name) > -1) {
        dayOfWeekValues.splice(dayOfWeekValues.indexOf(dayOfWeek.name), 1);
      }
    });
    if (dayOfWeekValues.length > 0) {
      if (!dosage.timing) {
        dosage.timing = new TimingBuilder()
          .timingRepeat(new TimingRepeatBuilder()
            .dayOfWeek(dayOfWeekValues)
            .build()
          )
          .build();
      }
      else if (!dosage.timing.repeat) {
        dosage.timing.repeat = new TimingRepeatBuilder()
          .dayOfWeek(dayOfWeekValues)
          .build();
      }
      else if (!dosage.timing.repeat.dayOfWeek) {
        dosage.timing.repeat.dayOfWeek = dayOfWeekValues;
      }
    }
    else {
      if (dosage?.timing?.repeat?.dayOfWeek) {
        delete dosage.timing.repeat.dayOfWeek;
      }
    }

    return new MedicationFormStateValueChangesDosageInstruction(medicationRequest, this._nDosage);
  }
}

export class MedicationFormActionAddWhen implements IAction {
  readonly type = 'AddWhen';

  constructor(private _nDosage: number) {
  }

  public execute(): IPartialState {
    return new MedicationFormStateAddWhen(this._nDosage);
  }
}

export class MedicationFormActionRemoveWhen implements IAction {
  readonly type = 'RemoveWhen';

  constructor(private _medicationRequest: MedicationRequest,
              private _nDosage: number,
              private _nWhen: number) {
  }

  public execute(): IPartialState {
    const medicationRequest = lodash.cloneDeep(this._medicationRequest);
    const dosage = medicationRequest.dosageInstruction[this._nDosage];

    if (dosage.timing) {
      if (dosage.repeat) {
        if (dosage.timing.repeat.when) {
          if (dosage.timing.repeat.when[this._nWhen]) {
            dosage.timing.repeat.when.splice(this._nWhen, 1);
          }
          if (dosage.timing.repeat.when.length === 0) {
            delete dosage.timing.repeat.when;
          }
        }
      }
    }

    return new MedicationFormStateRemoveWhen(medicationRequest, this._nDosage, this._nWhen);
  }
}

export class MedicationFormActionValueChangesDosageInstructionWhenValue implements IAction {
  readonly type = 'ValueChangesDosageInstructionWhen';

  constructor(private _medicationRequest: MedicationRequest,
              private _nDosage: number,
              private _nWhen: number,
              private _whenValue: ValueSetContains) {
  }

  public execute(): IPartialState {
    const medicationRequest = lodash.cloneDeep(this._medicationRequest);
    const dosage = medicationRequest.dosageInstruction[this._nDosage];

    if (this._whenValue) {
      if (!dosage.timing) {
        dosage.timing = new TimingBuilder()
          .timingRepeat(new TimingRepeatBuilder()
            .addWhen(this._whenValue.code as EventTiming)
            .build()
          )
          .build();
      }
      else if (!dosage.timing.repeat) {
        dosage.timing.repeat = new TimingRepeatBuilder()
          .addWhen(this._whenValue.code as EventTiming)
          .build();
      }
      else if (!dosage.timing.repeat.when) {
        dosage.timing.repeat.when = new Array<EventTiming>(this._whenValue.code as EventTiming);
      }
      else {
        dosage.timing.repeat.when[this._nWhen] = this._whenValue.code as EventTiming;
      }
    }
    else {
      if (dosage?.timing?.repeat?.when) {
        if (dosage?.timing?.repeat?.when[this._nWhen]) {
          dosage.timing.repeat.when.splice(this._nWhen, 1);
        }
        if (dosage?.timing?.repeat?.when.length === 0) {
          delete dosage.timing.repeat.when;
        }
      }
    }

    return new MedicationFormStateValueChangesDosageInstruction(medicationRequest, this._nDosage);
  }
}

export class MedicationFormActionValueChangesDosageInstructionOffsetValue implements IAction {
  readonly type = 'ValueChangesDosageInstructionOffsetValue';

  constructor(private _medicationRequest: MedicationRequest,
              private _nDosage: number,
              private _offsetValue: decimal) {
  }

  public execute(): IPartialState {
    const medicationRequest = lodash.cloneDeep(this._medicationRequest);
    const dosage = medicationRequest.dosageInstruction[this._nDosage];

    if (this._offsetValue) {
      if (!dosage.timing) {
        dosage.timing = new TimingBuilder()
          .timingRepeat(new TimingRepeatBuilder()
            .offset(this._offsetValue)
            .build()
          )
          .build();
      }
      else if (!dosage.timing.repeat) {
        dosage.timing.repeat = new TimingRepeatBuilder()
          .offset(this._offsetValue)
          .build();
      }
      else {
        dosage.timing.repeat.offset = this._offsetValue;
      }
    }
    else {
      if (dosage.timing && dosage.timing.repeat) {
        delete dosage.timing.repeat.offset;
      }
    }

    return new MedicationFormStateValueChangesDosageInstruction(medicationRequest, this._nDosage);
  }
}

export class MedicationFormActionAddDoseAndRate implements IAction {
  readonly type = 'AddDoseAndRate';

  constructor(private _nDosage: number) {
  }

  public execute(): IPartialState {
    return new MedicationFormStateAddDoseAndRate(this._nDosage);
  }
}

export class MedicationFormActionRemoveDoseAndRate implements IAction {
  readonly type = 'RemoveDoseAndRate';

  constructor(private _medicationRequest: MedicationRequest,
              private _nDosage: number,
              private _nDoseAndRate: number) {
  }

  public execute(): IPartialState {
    const medicationRequest = lodash.cloneDeep(this._medicationRequest);
    const dosage = medicationRequest.dosageInstruction[this._nDosage];
    if (dosage.doseAndRate) {
      if (dosage.doseAndRate[this._nDoseAndRate]) {
        dosage.doseAndRate.splice(this._nDoseAndRate, 1);
      }
      if (dosage.doseAndRate.length === 0) {
        delete dosage.doseAndRate;
      }
    }
    return new MedicationFormStateRemoveDoseAndRate(medicationRequest, this._nDosage, this._nDoseAndRate);
  }
}

export class MedicationFormActionValueChangesDosageInstructionDoseQuantityValue implements IAction {
  readonly type = 'ValueChangesDosageInstructionDoseQuantityValue';

  constructor(private _medicationRequest: MedicationRequest,
              private _nDosage: number,
              private _nDoseAndRate: number,
              private _doseQuantityValue: number) {
  }

  public execute(): IPartialState {
    const medicationRequest = lodash.cloneDeep(this._medicationRequest);
    const dosage = medicationRequest.dosageInstruction[this._nDosage];

    if (this._doseQuantityValue) {
      if (!dosage.doseAndRate) {
        dosage.doseAndRate = new Array<DosageDoseAndRate>(new DoseAndRateBuilder()
          .doseQuantity(new QuantityBuilder()
            .value(this._doseQuantityValue)
            .build()
          )
          .build()
        );
      }
      else if (!dosage.doseAndRate[this._nDoseAndRate]) {
        dosage.doseAndRate[this._nDoseAndRate] = new DoseAndRateBuilder()
          .doseQuantity(new QuantityBuilder()
            .value(this._doseQuantityValue)
            .build()
          )
          .build();
      }
      else {
        dosage.doseAndRate[this._nDoseAndRate].doseQuantity.value = this._doseQuantityValue;
      }
    }
    else {
      if (dosage.doseAndRate[this._nDoseAndRate]) {
        dosage.doseAndRate.splice(this._nDoseAndRate, 1);
      }

      if (dosage.doseAndRate.length === 0) {
        delete dosage.doseAndRate;
      }
    }

    return new MedicationFormStateValueChangesDosageInstruction(medicationRequest, this._nDosage);
  }
}

export class MedicationFormActionValueChangesDosageInstructionDoseQuantityUnit implements IAction {
  readonly type = 'ValueChangesDosageInstructionDoseQuantityUnit';

  constructor(private _medicationRequest: MedicationRequest,
              private _nDosage: number,
              private _nDoseAndRate: number,
              private _doseQuantityUnit: Coding) {
  }

  public execute(): IPartialState {
    const medicationRequest = lodash.cloneDeep(this._medicationRequest);
    const dosage = medicationRequest.dosageInstruction[this._nDosage];

    if (this._doseQuantityUnit) {
      if (!dosage.doseAndRate) {
        dosage.doseAndRate = new Array<DosageDoseAndRate>(new DoseAndRateBuilder()
          .doseQuantity(new QuantityBuilder()
            .code(this._doseQuantityUnit.code)
            .unit(this._doseQuantityUnit.display)
            .system(this._doseQuantityUnit.system)
            .build()
          )
          .build()
        );
      }
      else if (!dosage.doseAndRate[this._nDoseAndRate]) {
        dosage.doseAndRate[this._nDoseAndRate] = new DoseAndRateBuilder()
          .doseQuantity(new QuantityBuilder()
            .code(this._doseQuantityUnit.code)
            .unit(this._doseQuantityUnit.display)
            .system(this._doseQuantityUnit.system)
            .build()
          )
          .build();
      }
      else {
        dosage.doseAndRate[this._nDoseAndRate].doseQuantity.unit = this._doseQuantityUnit.display;
        dosage.doseAndRate[this._nDoseAndRate].doseQuantity.code = this._doseQuantityUnit.code;
        dosage.doseAndRate[this._nDoseAndRate].doseQuantity.system = this._doseQuantityUnit.system;
      }
    }
    else {
      if (dosage.doseAndRate && dosage.doseAndRate[this._nDoseAndRate]) {
        if (!dosage.doseAndRate[this._nDoseAndRate].doseQuantity.value) {
          delete dosage.doseAndRate[this._nDoseAndRate].doseQuantity;
        }
        else {
          dosage.doseAndRate[this._nDoseAndRate].doseQuantity.unit = null;
          dosage.doseAndRate[this._nDoseAndRate].doseQuantity.code = null;
          dosage.doseAndRate[this._nDoseAndRate].doseQuantity.system = null;
        }
      }
    }

    return new MedicationFormStateValueChangesDosageInstruction(medicationRequest, this._nDosage);
  }
}

export class MedicationFormActionValueChangesDispenseRequest implements IAction {
  readonly type = 'ValueChangesDispenseRequest';

  constructor(private _medicationRequest: MedicationRequest,
              private _medicationDispense: MedicationRequestDispenseRequest) {
  }

  public execute(): IPartialState {
    const medicationRequest = lodash.cloneDeep(this._medicationRequest);
    const medicationDispense = lodash.cloneDeep(this._medicationDispense);

    if (medicationDispense.expectedSupplyDuration.value) {
      const value = medicationDispense.expectedSupplyDuration.value;
      medicationDispense.expectedSupplyDuration = new DurationBuilder()
        .value(value)
        .default()
        .build();
    }
    else {
      delete medicationDispense.expectedSupplyDuration;
    }

    if (!medicationDispense.validityPeriod?.start
      && !medicationDispense.validityPeriod?.end) {
      delete medicationDispense.validityPeriod;
    }
    else if (!medicationDispense.validityPeriod?.start) {
      delete medicationDispense.validityPeriod.start;
    }
    else if (!medicationDispense.validityPeriod?.end) {
      delete medicationDispense.validityPeriod?.end;
    }

    medicationRequest.dispenseRequest = medicationDispense;

    return new MedicationFormStateValueChangesDispenseRequest(medicationRequest);
  }
}

export class MedicationFormActionValueChangesTreatmentIntent implements IAction {
  readonly type = 'ValueChangesTreatmentIntent';

  constructor(private _medicationRequest: MedicationRequest,
              private _treatmentIntent: ValueSetContains) {
  }

  public execute(): IPartialState {
    const medicationRequest = lodash.cloneDeep(this._medicationRequest);

    if (this._treatmentIntent) {
      if (!medicationRequest.extension) {
        medicationRequest.extension = new Array<Extension>();
        medicationRequest.extension.push(
          {
            url: 'http://interopsante.org/fhir/StructureDefinition/FrTreatmentIntent',
            valueCodeableConcept: new CodeableConceptBuilder()
              .text(this._treatmentIntent.display)
              .addCoding(new CodingBuilder()
                .code(this._treatmentIntent.code)
                .system(this._treatmentIntent.system)
                .display(this._treatmentIntent.display)
                .build())
              .build()
          } as Extension
        );
      }
      else {
        const nExtension = medicationRequest.extension.findIndex((extension) => {
          return extension.url === 'http://interopsante.org/fhir/StructureDefinition/FrTreatmentIntent';
        });
        if (nExtension > -1) {
          medicationRequest.extension.forEach((extension) => {
            if (extension.url === 'http://interopsante.org/fhir/StructureDefinition/FrTreatmentIntent') {
              extension.valueCodeableConcept = new CodeableConceptBuilder()
                .text(this._treatmentIntent.display)
                .addCoding(new CodingBuilder()
                  .code(this._treatmentIntent.code)
                  .system(this._treatmentIntent.system)
                  .display(this._treatmentIntent.display)
                  .build())
                .build();
            }
          });
        }
        else {
          medicationRequest.extension.push(
            {
              url: 'http://interopsante.org/fhir/StructureDefinition/FrTreatmentIntent',
              valueCodeableConcept: new CodeableConceptBuilder()
                .text(this._treatmentIntent.display)
                .addCoding(new CodingBuilder()
                  .code(this._treatmentIntent.code)
                  .system(this._treatmentIntent.system)
                  .display(this._treatmentIntent.display)
                  .build())
                .build()
            } as Extension
          );
        }
      }

    }
    else {
      if (medicationRequest.extension) {
        const nExtension = medicationRequest.extension.findIndex((extension) => {
          return extension.url === 'http://interopsante.org/fhir/StructureDefinition/FrTreatmentIntent';
        });
        if (nExtension > -1) {
          medicationRequest.extension.splice(nExtension);
        }
        if (medicationRequest.extension.length === 0) {
          delete medicationRequest.extension;
        }
      }
    }

    return new MedicationFormStateValueChangesTreatmentIntent(medicationRequest);
  }
}
