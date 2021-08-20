/**
 * @license
 * Copyright PHAST SARL All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://cds-access.phast.fr/license
 */
import * as lodash from 'lodash';
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
  MedicationFormStateRemoveMedication, MedicationFormStateValueChangesMedication, MedicationFormStateCdsHelp
} from './medication-request-form.state';
import {
  DosageBuilder,
  DoseAndRateBuilder, DurationBuilder,
  MedicationBuilder, MedicationIngredientBuilder,
  MedicationRequestBuilder, PeriodBuilder, QuantityBuilder, RatioBuilder,
  ReferenceBuilder, TimingBuilder, TimingRepeatBuilder
} from '../../common/fhir/builders/fhir.resource.builder';
import {
  CodeableConcept, Coding, dateTime, decimal, Dosage, DosageDoseAndRate,
  id,
  Medication,
  MedicationKnowledge,
  MedicationRequest, MedicationRequestDispenseRequest, Patient, Practitioner,
  Ratio,
  Reference, time, UnitsOfTime, ValueSetContains
} from 'phast-fhir-ts';
import * as moment from 'moment';

export class MedicationFormActionAddMedicationRequest implements IAction {
  readonly type = 'AddMedicationRequest';

  constructor(private _medicationRequest: MedicationRequest) { }

  public execute(): IPartialState {
    return new MedicationFormStateAddMedicationRequest();
  }
}

export class MedicationFormActionCdsHelp implements IAction {
  readonly type = 'CdsHelp';

  constructor(private _medicationRequest: MedicationRequest) { }

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
              private _practitioner: Practitioner) { }

  public execute(): IPartialState {
    let medicationRequest = lodash.cloneDeep(this._medicationRequest);
    const medication = new MedicationBuilder(this._medicationId)
      .code(this._medicationKnowledge.code)
      .form(this._medicationKnowledge.doseForm)
      .ingredient(lodash.cloneDeep(this._medicationKnowledge.ingredient))
      .build();
    if (!medicationRequest) {
      if (this._patient) {
        medicationRequest = new MedicationRequestBuilder(
          'active',
          'order',
          new ReferenceBuilder(this._patient.id)
            .resourceType('Patient')
            .build()
        )
          .build();

        medicationRequest.medicationReference = new ReferenceBuilder(medication.id)
          .build();
        if (this._practitioner) {
          medicationRequest.requester = new ReferenceBuilder(this._practitioner.id)
            .resourceType(this._practitioner.resourceType)
            .build();
        }
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
          .itemReference(new ReferenceBuilder('#' + medicationOld.id)
            .display(medicationOld.code.text)
            .build()
          )
          .strength(medicationOld.ingredient[0]?.strength)
          .build(),
          new MedicationIngredientBuilder()
            .itemReference(new ReferenceBuilder('#' + medication.id)
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

    if (medicationRequest) {
      medicationRequest.contained.push(medication);
    }

    return new MedicationFormStateAddMedication(medicationRequest, this._medicationKnowledge, medication);
  }
}

export class MedicationFormActionRemoveMedication implements IAction {
  readonly type = 'RemoveMedication';

  constructor(private _medicationRequest: MedicationRequest,
              private _nMedication: number) { }

  public execute(): IPartialState {
    const medicationRequest = lodash.cloneDeep(this._medicationRequest);
    const contained = medicationRequest.contained;
    if (this._nMedication === 0) {
      contained.length = 0;
      delete medicationRequest.medicationReference;
    }
    else if (this._nMedication !== 0 && contained.length === 3) {
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
              private _formValue: CodeableConcept,
              private _medicationKnowledge: MedicationKnowledge,
              private _intendedRoute: CodeableConcept) {
  }

  public execute(): IPartialState {
    const medicationRequest = lodash.cloneDeep(this._medicationRequest);
    const nMedication = medicationRequest.contained.findIndex(
      (value) => {
        return value.id === this._medication.id;
      }
    );

    if (this._formValue) {
      this._medication.form = this._formValue;
    }
    else {
      delete this._medication.form;
    }

    medicationRequest.contained[nMedication] = this._medication;

    const ingredient = (medicationRequest.contained.length > 1) ?
      this._medicationKnowledge.ingredient : this._medication.ingredient;

    const medication = (medicationRequest.contained.length > 1) ?
      medicationRequest.contained[1] as Medication : this._medication;

    return new MedicationFormStateValueChangesMedication(
      medicationRequest, this._medicationKnowledge, medication, ingredient, this._intendedRoute
    );
  }
}

export class MedicationFormActionValueChangesMedicationIngredientStrength implements IAction {
  readonly type = 'ValueChangesMedicationIngredientStrength';

  constructor(private _medicationRequest: MedicationRequest,
              private _medication: Medication,
              private _itemCodeableConcept: CodeableConcept,
              private _strengthValue: Ratio,
              private _medicationKnowledge: MedicationKnowledge,
              private _form: CodeableConcept,
              private _intendedRoute: CodeableConcept) {
  }

  public execute(): IPartialState {
    const medicationRequest = lodash.cloneDeep(this._medicationRequest);
    const nMedication = medicationRequest.contained.findIndex(
      (value) => {
        return value.id === this._medication.id;
      }
    );
    const nIngredient = this._medication.ingredient.findIndex(
      value => value.itemCodeableConcept === this._itemCodeableConcept
    );

    if (this._strengthValue) {
      this._medication.ingredient[nIngredient].strength = this._strengthValue;
    }
    else {
      delete this._medication.ingredient[nIngredient].strength;
    }

    medicationRequest.contained[nMedication] = this._medication;

    return new MedicationFormStateValueChangesMedication(
      medicationRequest, this._medicationKnowledge, this._medication, this._medication.ingredient, this._intendedRoute
    );
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

  constructor(private _medicationRequest: MedicationRequest) { }

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
                  .start(Utils.now())
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
              private _nDosage: number,
              private _medicationKnowledge: MedicationKnowledge,
              private _medication: Medication) { }

  execute(): IPartialState {
    const medicationRequest = lodash.cloneDeep(this._medicationRequest);
    if (medicationRequest.dosageInstruction[this._nDosage]) {
      medicationRequest.dosageInstruction.splice(this._nDosage, 1);
    }
    if (medicationRequest.dosageInstruction.length === 0) {
      delete medicationRequest.dosageInstruction;
    }
    const ingredient = (this._medicationRequest.contained.length > 1) ?
      this._medicationKnowledge.ingredient : this._medication.ingredient;

    const medication = (this._medicationRequest.contained.length > 1) ?
      this._medicationRequest.contained[1] as Medication : this._medication;

    return new MedicationFormStateRemoveDosageInstruction(
      medicationRequest, this._nDosage, this._medicationKnowledge, medication, ingredient
    );
  }
}

export class MedicationFormActionValueChangesDosageInstructionRoute implements IAction {
  readonly type = 'ValueChangesDosageInstructionRoute';

  constructor(private _medicationRequest: MedicationRequest,
              private _nDosage: number,
              private _routeValue: CodeableConcept,
              private _medicationKnowledge: MedicationKnowledge,
              private _medication: Medication) { }

  public execute(): IPartialState {
    const medicationRequest = lodash.cloneDeep(this._medicationRequest);
    const dosage = medicationRequest.dosageInstruction[this._nDosage];

    if (this._routeValue) {
      dosage.route = this._routeValue;
    }
    else {
      delete dosage.route;
    }

    const ingredient = (this._medicationRequest.contained.length > 1) ?
      this._medicationKnowledge.ingredient : this._medication.ingredient;

    const medication = (this._medicationRequest.contained.length > 1) ?
      this._medicationRequest.contained[1] as Medication : this._medication;

    return new MedicationFormStateValueChangesDosageInstruction(
      medicationRequest, this._nDosage, this._medicationKnowledge, medication, ingredient, this._routeValue
    );
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
      if (dosage.timing === undefined) {
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
      else if (dosage.timing.repeat === undefined) {
        dosage.timing.repeat = new TimingRepeatBuilder()
          .boundsDuration(new DurationBuilder()
            .value(this._boundsDurationValue)
            .build()
          )
          .build();
      }
      else if (dosage.timing.repeat.boundsDuration === undefined) {
        dosage.timing.repeat.boundsDuration = new DurationBuilder()
          .value(this._boundsDurationValue)
          .build();
      }
      else {
        dosage.timing.repeat.boundsDuration.value = this._boundsDurationValue;
      }
    }
    else {
      if (dosage.timing !== undefined
        && dosage.timing.repeat !== undefined
        && dosage.timing.repeat.boundsDuration !== undefined) {
        if (!dosage.timing.repeat.boundsDuration.code) {
          delete dosage.timing.repeat.boundsDuration;
        }
        else {
          dosage.timing.repeat.boundsDuration.value = null;
        }
      }
    }

    this.synchronizeBounds(dosage);

    return new MedicationFormStateValueChangesDosageInstruction(medicationRequest, this._nDosage);
  }

  private synchronizeBounds(dosage): void {
    if (dosage.timing.repeat?.boundsPeriod?.start) {
      const start = moment(dosage.timing.repeat.boundsPeriod.start);

      let unit;
      if (dosage.timing.repeat.boundsDuration.code) {
        unit = Utils.adaptUnitsOfTime(dosage.timing.repeat.boundsDuration.code);
      }
      else {
        unit = 'd';
        dosage.timing.repeat.boundsDuration.code = 'd';
        dosage.timing.repeat.boundsDuration.unit = 'j';
        dosage.timing.repeat.boundsDuration.system = 'http://unitsofmeasure.org';
      }

      const duration = moment.duration(
        dosage.timing.repeat.boundsDuration.value,
        unit as any
      );
      const end = start.add(duration);

      dosage.timing.repeat.boundsPeriod.end = end.toISOString();
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
    if (this._boundsDurationUnit) {
      if (dosage.timing === undefined) {
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
      else if (dosage.timing.repeat === undefined) {
        dosage.timing.repeat = new TimingRepeatBuilder()
          .boundsDuration(new DurationBuilder()
            .unit(this._boundsDurationUnit.display)
            .code(this._boundsDurationUnit.code)
            .system(this._boundsDurationUnit.system)
            .build()
          )
          .build();
      }
      else if (dosage.timing.repeat.boundsDuration === undefined) {
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
    }
    else {
      if (dosage.timing !== undefined
        && dosage.timing.repeat !== undefined
        && dosage.timing.repeat.boundsDuration !== undefined) {
        if (!dosage.timing.repeat.boundsDuration.value) {
          delete dosage.timing.repeat.boundsDuration;
        }
        else {
          dosage.timing.repeat.boundsDuration.unit = null;
          dosage.timing.repeat.boundsDuration.code = null;
          dosage.timing.repeat.boundsDuration.system = null;
        }
      }
    }

    this.synchronizeBounds(dosage);

    return new MedicationFormStateValueChangesDosageInstruction(medicationRequest, this._nDosage);
  }

  private synchronizeBounds(dosage: Dosage): void {
    if (dosage.timing.repeat?.boundsPeriod?.start
      && dosage.timing.repeat?.boundsDuration?.value
      && dosage.timing.repeat?.boundsDuration?.code) {
      const start = moment(dosage.timing.repeat.boundsPeriod.start);
      const unit = Utils.adaptUnitsOfTime(dosage.timing.repeat.boundsDuration.code);
      const duration = moment.duration(
        dosage.timing.repeat.boundsDuration.value,
        unit as any
      );
      const end = start.add(duration);

      dosage.timing.repeat.boundsPeriod.end = end.toISOString();
    }
  }
}

export class MedicationFormActionValueChangesDosageInstructionBoundsPeriodStart implements IAction {
  readonly type = 'ValueChangesDosageInstructionBoundsPeriodStart';

  constructor(private _medicationRequest: MedicationRequest,
              private _nDosage: number,
              private _boundsPeriodStart: dateTime) {
  }

  public execute(): IPartialState {
    const medicationRequest = lodash.cloneDeep(this._medicationRequest);
    const dosage = medicationRequest.dosageInstruction[this._nDosage];

    if (this._boundsPeriodStart) {
      if (dosage.timing === undefined) {
        dosage.timing = new TimingBuilder()
          .timingRepeat(new TimingRepeatBuilder()
            .boundsPeriod(new PeriodBuilder()
              .start(this._boundsPeriodStart)
              .build()
            )
            .build()
          )
          .build();
      }
      else if (dosage.timing.repeat === undefined) {
        dosage.timing.repeat = new TimingRepeatBuilder()
          .boundsPeriod(new PeriodBuilder()
            .start(this._boundsPeriodStart)
            .build())
          .build();
      }
      else if (dosage.timing.repeat.boundsPeriod === undefined) {
        dosage.timing.repeat.boundsPeriod = new PeriodBuilder()
          .start(this._boundsPeriodStart)
          .build();
      }
      else {
        dosage.timing.repeat.boundsPeriod.start = this._boundsPeriodStart;
      }
    }
    else {
      if (dosage.timing && dosage.timing.repeat && dosage.timing.repeat.boundsPeriod) {
        if (!dosage.timing.repeat.boundsPeriod.end) {
          delete dosage.timing.repeat.boundsPeriod;
        }
        else {
          dosage.timing.repeat.boundsPeriod.start = null;
        }
      }
    }

    this.synchronizeBounds(dosage);

    return new MedicationFormStateValueChangesDosageInstruction(medicationRequest, this._nDosage);
  }

  private synchronizeBounds(dosage: Dosage): void {
    if (dosage.timing.repeat?.boundsPeriod?.start
      && dosage.timing.repeat?.boundsDuration?.value) {
      const start = moment(dosage.timing.repeat.boundsPeriod.start);

      let unit;
      if (dosage.timing.repeat.boundsDuration.code) {
        unit = Utils.adaptUnitsOfTime(dosage.timing.repeat.boundsDuration.code);
      }
      else {
        unit = 'd';
        dosage.timing.repeat.boundsDuration.code = 'd';
        dosage.timing.repeat.boundsDuration.unit = 'j';
        dosage.timing.repeat.boundsDuration.system = 'http://unitsofmeasure.org';
      }
      const duration = moment.duration(
        dosage.timing.repeat.boundsDuration.value,
        unit
      );
      const end = start.add(duration);

      dosage.timing.repeat.boundsPeriod.end = end.toISOString();
    }
    else if (dosage.timing.repeat?.boundsPeriod?.start
      && dosage.timing.repeat?.boundsPeriod?.end) {
      const start = moment(dosage.timing.repeat.boundsPeriod.start);
      const end = moment(dosage.timing.repeat.boundsPeriod.end);
      const duration = moment.duration(end.diff(start));
      if (dosage.timing.repeat.boundsDuration === undefined) {
        dosage.timing.repeat.boundsDuration = new DurationBuilder()
          .value(duration.days())
          .default()
          .build();
      }
      else {
        dosage.timing.repeat.boundsDuration.value = duration.days();
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
              private _boundsPeriodEnd: dateTime) {
  }

  public execute(): IPartialState {
    const medicationRequest = lodash.cloneDeep(this._medicationRequest);
    const dosage = medicationRequest.dosageInstruction[this._nDosage];

    if (this._boundsPeriodEnd) {
      if (dosage.timing === undefined) {
        dosage.timing = new TimingBuilder()
          .timingRepeat(new TimingRepeatBuilder()
            .boundsPeriod(new PeriodBuilder()
              .end(this._boundsPeriodEnd)
              .build()
            )
            .build())
          .build();
      }
      else if (dosage.timing.repeat === undefined) {
        dosage.timing.repeat = new TimingRepeatBuilder()
          .boundsPeriod(new PeriodBuilder()
            .end(this._boundsPeriodEnd)
            .build()
          )
          .build();
      }
      else if (dosage.timing.repeat.boundsPeriod === undefined) {
        dosage.timing.repeat.boundsPeriod = new PeriodBuilder()
          .end(this._boundsPeriodEnd)
          .build();
      }
      else {
        dosage.timing.repeat.boundsPeriod.end = this._boundsPeriodEnd;
      }
    }
    else {
      if (dosage.timing && dosage.timing.repeat && dosage.timing.repeat.boundsPeriod) {
        if (!dosage.timing.repeat.boundsPeriod.start) {
          delete dosage.timing.repeat.boundsPeriod;
        }
        else {
          dosage.timing.repeat.boundsPeriod.end = null;
        }
      }
    }

    this.synchronizedBounds(dosage);

    return new MedicationFormStateValueChangesDosageInstruction(medicationRequest, this._nDosage);
  }

  private synchronizedBounds(dosage): void {
    if (dosage.timing.repeat?.boundsPeriod?.start
      && dosage.timing.repeat?.boundsPeriod?.end) {
      const start = moment(dosage.timing.repeat.boundsPeriod.start);
      const end = moment(dosage.timing.repeat.boundsPeriod.end);
      const duration = moment.duration(end.diff(start));
      if (dosage.timing.repeat.boundsDuration === undefined) {
        dosage.timing.repeat.boundsDuration = new DurationBuilder()
          .value(duration.days())
          .default()
          .build();
      }
      else {
        dosage.timing.repeat.boundsDuration.value = duration.days();
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
              private _durationValue: decimal) { }

  public execute(): IPartialState {
    const medicationRequest = lodash.cloneDeep(this._medicationRequest);
    const dosage = medicationRequest.dosageInstruction[this._nDosage];

    if (this._durationValue) {
      if (dosage.timing === undefined) {
        dosage.timing = new TimingBuilder()
          .timingRepeat(new TimingRepeatBuilder()
            .duration(this._durationValue)
            .build()
          )
          .build();
      }
      else if (dosage.timing.repeat === undefined) {
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
  readonly type = 'ValueChangesDosageInstructionDurationValue';

  constructor(private _medicationRequest: MedicationRequest,
              private _nDosage: number,
              private _durationUnit: ValueSetContains) { }

  public execute(): IPartialState {
    const medicationRequest = lodash.cloneDeep(this._medicationRequest);
    const dosage = medicationRequest.dosageInstruction[this._nDosage];

    if (this._durationUnit) {
      if (dosage.timing === undefined) {
        dosage.timing = new TimingBuilder()
          .timingRepeat(
            new TimingRepeatBuilder()
              .durationUnit(this._durationUnit.code as UnitsOfTime)
              .build()
          )
          .build();
      }
      else if (dosage.timing.repeat) {
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
              private _doseQuantityValue: number) { }

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

    return new MedicationFormStateValueChangesDosageInstruction(medicationRequest, this._nDosage, dosage);
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

    return new MedicationFormStateValueChangesDosageInstruction(medicationRequest, this._nDosage, dosage);
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
      if (dosage.timing === undefined) {
        dosage.timing = new TimingBuilder()
          .timingRepeat(new TimingRepeatBuilder()
            .addTimeOfDay(this._timeOfDayValue)
            .build()
          )
          .build();
      }
      else if (dosage.timing.repeat === undefined) {
        dosage.timing.repeat = new TimingRepeatBuilder()
          .addTimeOfDay(this._timeOfDayValue)
          .build();
      }
      else if (dosage.timing.repeat.timeOfDay === undefined) {
        dosage.timing.repeat.timeOfDay = new Array<time>(this._timeOfDayValue);
      }
      else {
        dosage.timing.repeat.timeOfDay[this._nTimeOfDay] = this._timeOfDayValue;
      }
    }
    else {
      if (dosage.timing.repeat.timeOfDay[this._nTimeOfDay]) {
        dosage.timing.repeat.timeOfDay.splice(this._nTimeOfDay, 1);
      }
      if (dosage.timing.repeat.timeOfDay.length === 0) {
        delete dosage.timing.repeat.timeOfDay;
      }
    }

    return new MedicationFormStateValueChangesDosageInstruction(medicationRequest, this._nDosage, dosage);
  }
}

export class MedicationFormActionValueChangesDispenseRequest implements IAction {
  readonly type = 'ValueChangesDispenseRequest';

  constructor(private _medicationRequest: MedicationRequest,
              private _medicationDispense: MedicationRequestDispenseRequest) { }

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
