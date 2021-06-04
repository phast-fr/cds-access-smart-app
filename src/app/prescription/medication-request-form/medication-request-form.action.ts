import * as lodash from 'lodash';
import { from } from 'rxjs';
import {
  IPartialState,
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
  MedicationFormStateRemoveMedication, MedicationFormStateValueChangesMedication
} from './medication-request-form.state';
import {
  DosageBuilder,
  DoseAndRateBuilder, DurationBuilder,
  MedicationBuilder, MedicationIngredientBuilder,
  MedicationRequestBuilder, RatioBuilder,
  ReferenceBuilder,
  TimeBuilder
} from '../../common/fhir/fhir.resource.builder';
import { PrescriptionStateService } from '../prescription-state.service';
import {fhir} from '../../common/fhir/fhir.types';
import MedicationKnowledge = fhir.MedicationKnowledge;
import Coding = fhir.Coding;
import id = fhir.id;
import MedicationRequestDispenseRequest = fhir.MedicationRequestDispenseRequest;
import MedicationRequest = fhir.MedicationRequest;
import Medication = fhir.Medication;
import CodeableConcept = fhir.CodeableConcept;
import Ratio = fhir.Ratio;
import Reference = fhir.Reference;
import UnitsOfTime = fhir.UnitsOfTime;
import {FhirCioDcService} from '../../common/services/fhir.cio.dc.service';
import {MedicationRequestFormService} from './medication-request-form.service';

export interface IAction {
  readonly type: string;

  execute(): IPartialState;
}

export class MedicationFormActionAddMedicationRequest implements IAction {
  readonly type = 'AddMedicationRequest';

  constructor(private _prescriptionState: PrescriptionStateService,
              private _medicationRequest: MedicationRequest) { }

  public execute(): IPartialState {
    this._prescriptionState.addMedicationRequest(this._medicationRequest);
    return new MedicationFormStateAddMedicationRequest();
  }
}

export class MedicationFormActionAddMedication implements IAction {
  type = 'AddMedication';

  constructor(private _prescriptionState: PrescriptionStateService,
              private _cioDcSource: FhirCioDcService,
              private _formStateService: MedicationRequestFormService,
              private _medicationRequest: MedicationRequest,
              private _medicationKnowledge: MedicationKnowledge,
              private _medicationId: id) { }

  public execute(): IPartialState {
    const medication = new MedicationBuilder(this._medicationId)
      .code(this._medicationKnowledge.code)
      .form(this._medicationKnowledge.doseForm)
      .ingredient(lodash.cloneDeep(this._medicationKnowledge.ingredient))
      .build();
    if (this._medicationRequest == null) {
      const subject = new ReferenceBuilder(this._prescriptionState.patient.id)
        .resourceType('Patient')
        .build();
      this._medicationRequest = new MedicationRequestBuilder('active', 'order', subject)
        .build();
      this._medicationRequest.medicationReference = new ReferenceBuilder(medication.id)
        .build();
      if (this._prescriptionState.user != null) {
        this._medicationRequest.requester = new ReferenceBuilder(this._prescriptionState.user.id)
          .resourceType(this._prescriptionState.user.resourceType)
          .build();
      }
    }
    else if (this._medicationRequest.contained.length === 0) {
      this._medicationRequest.medicationReference = new ReferenceBuilder(medication.id)
        .build();
    }
    else if (this._medicationRequest.contained.length === 1) {
      const medicationOld = this._medicationRequest.contained.shift() as Medication;

      // TODO use a builder
      const medicationRoot = {
        resourceType: 'Medication',
        id: 'med-root',
        code: {
          text: medicationOld.code.text + '&' + medication.code.text
        },
        ingredient: [{
          itemReference: {
            reference: '#' + medicationOld.id,
            display: medicationOld.code.text
          },
          strength: medicationOld.ingredient[0]?.strength
        }, {
          itemReference: {
            reference: '#' + medication.id,
            display: medication.code.text
          }
        }]
      } as Medication;
      this._medicationRequest.contained.push(medicationRoot);
      this._medicationRequest.contained.push(medicationOld);
      this._medicationRequest.medicationReference = new ReferenceBuilder(medicationRoot.id)
        .build();
    }
    else if (this._medicationRequest.contained.length !== 0) {
      const medicationRoot = this._medicationRequest.contained[0] as Medication;
      medicationRoot.code.text += '&' + medication.code.text;
      medicationRoot.ingredient.push(new MedicationIngredientBuilder()
        .setItemReference(new ReferenceBuilder(medication.id)
          .display(medication.code.text)
          .build())
        .build());
    }
    this._medicationRequest.contained.push(medication);
    this._formStateService.initList(this._medicationKnowledge, medication.id);
    this._cioDcSource.postMedicationKnowledgeDetailsByRouteCodeAndFormCodeAndIngredient(
      this._medicationKnowledge.id, this._medicationKnowledge.code, undefined, undefined, undefined
      ).then(
        parameters => this._formStateService.buildList(medication.id, parameters)
      );

    return new MedicationFormStateAddMedication(this._medicationRequest, this._medicationKnowledge, medication);
  }
}

export class MedicationFormActionRemoveMedication implements IAction {
  readonly type = 'RemoveMedication';

  constructor(private _medicationRequest: MedicationRequest,
              private _nMedication: number) { }

  public execute(): IPartialState {
    const copyMedicationRequest = lodash.cloneDeep(this._medicationRequest);
    const contained = copyMedicationRequest.contained;
    if (this._nMedication === 0) {
      contained.length = 0;
      copyMedicationRequest.medicationReference = undefined;
    }
    else if (this._nMedication !== 0 && contained.length === 3) {
      contained.splice(this._nMedication, 1);
      contained.splice(0, 1);
      const medication = contained[0];
      copyMedicationRequest.medicationReference = new ReferenceBuilder(medication.id)
        .build();
    }
    else {
      const medicationRoot = contained[0] as Medication;
      medicationRoot.ingredient.splice(this._nMedication, 1);
      contained.splice(this._nMedication, 1);
    }
    return new MedicationFormStateRemoveMedication(copyMedicationRequest, this._nMedication);
  }
}

export class MedicationFormActionValueChangesMedicationForm implements IAction {
  readonly type = 'ValueChangesMedicationForm';

  constructor(private _formStateService: MedicationRequestFormService,
              private _cioDcSource: FhirCioDcService,
              private _medicationRequest: MedicationRequest,
              private _medication: Medication,
              private _formValue: CodeableConcept,
              private _medicationKnowledge: MedicationKnowledge,
              private _intendedRoute: CodeableConcept) {
  }

  public execute(): IPartialState {
    const nMedication = this._medicationRequest.contained.findIndex(
      (value) => {
        return value.id === this._medication.id;
      }
    );
    this._medication.form = this._formValue;

    const ingredient = (this._medicationRequest.contained.length > 1) ?
      this._medicationKnowledge.ingredient : this._medication.ingredient;

    const medList = (this._medicationRequest.contained.length > 1) ?
      this._medicationRequest.contained[1] as Medication : this._medication;
    this._formStateService.clearList(medList);
    from(this._cioDcSource.postMedicationKnowledgeDetailsByRouteCodeAndFormCodeAndIngredient(
      this._medicationKnowledge.id,
      this._medicationKnowledge.code,
      this._formValue,
      ingredient,
      this._intendedRoute
    ))
      .subscribe(value => this._formStateService.buildList(medList.id, value));

    return new MedicationFormStateValueChangesMedication(nMedication, this._medication);
  }
}

export class MedicationFormActionValueChangesMedicationIngredientStrength implements IAction {
  readonly type = 'ValueChangesMedicationIngredientStrength';

  constructor(private _formStateService: MedicationRequestFormService,
              private _cioDcSource: FhirCioDcService,
              private _medicationRequest: MedicationRequest,
              private _medication: Medication,
              private _itemCodeableConcept: CodeableConcept,
              private _strengthValue: Ratio,
              private _medicationKnowledge: MedicationKnowledge,
              private _form: CodeableConcept,
              private _intendedRoute: CodeableConcept) {
  }

  public execute(): IPartialState {
    const nMedication = this._medicationRequest.contained.findIndex(
      (value) => {
        return value.id === this._medication.id;
      }
    );
    const nIngredient = this._medication.ingredient.findIndex(
      value => value.itemCodeableConcept === this._itemCodeableConcept
    );
    this._medication.ingredient[nIngredient].strength = this._strengthValue;

    this._formStateService.clearList(this._medication);
    from(this._cioDcSource.postMedicationKnowledgeDetailsByRouteCodeAndFormCodeAndIngredient(
      this._medicationKnowledge.id,
      this._medicationKnowledge.code,
      this._form,
      this._medication.ingredient,
      this._intendedRoute
    ))
      .subscribe(value => this._formStateService.buildList(this._medication.id, value));

    return new MedicationFormStateValueChangesMedication(nMedication, this._medication);
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
    const nMedication = this._medicationRequest.contained.findIndex(
      (value) => {
        return value.id === this._medication.id;
      }
    );
    const nIngredient = this._medication.ingredient.findIndex(
      value => value.itemReference === this._itemReference
    );
    if (!this._medication.ingredient[nIngredient].strength) {
      this._medication.ingredient[nIngredient].strength = {
        numerator: {
          value: this._strengthValue
        }} as Ratio;
    }
    else {
      this._medication.ingredient[nIngredient].strength.numerator.value = this._strengthValue;
    }
    return new MedicationFormStateValueChangesMedication(nMedication, this._medication);
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
    const nMedication = this._medicationRequest.contained.findIndex(
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
          .setNumeratorUnit(this._strengthUnit.display)
          .setNumeratorSystem(this._strengthUnit.system)
          .setNumeratorCode(this._strengthUnit.code)
          .build();
      }
      else {
        this._medication.ingredient[nIngredient].strength.numerator.unit = this._strengthUnit.display;
        this._medication.ingredient[nIngredient].strength.numerator.code = this._strengthUnit.code;
        this._medication.ingredient[nIngredient].strength.numerator.system = this._strengthUnit.system;
      }
    }
    else {
      this._medication.ingredient[nIngredient].strength.numerator.unit = null;
      this._medication.ingredient[nIngredient].strength.numerator.code = null;
      this._medication.ingredient[nIngredient].strength.numerator.system = null;
    }

    return new MedicationFormStateValueChangesMedication(nMedication, this._medication);
  }
}

export class MedicationFormActionAddDosageInstruction implements IAction {
  readonly type = 'AddDosageInstruction';

  constructor(private _medicationRequest: MedicationRequest) { }

  public execute(): IPartialState {
    const dosageInstruction =
      new DosageBuilder(this._medicationRequest.dosageInstruction.length + 1).build();
    return new MedicationFormStateAddDosageInstruction(dosageInstruction);
  }
}

export class MedicationFormActionRemoveDosageInstruction implements IAction {
  readonly type = 'RemoveDosageInstruction';

  constructor(private _nDosage: number) { }

  execute(): IPartialState {
    return new MedicationFormStateRemoveDosageInstruction(this._nDosage);
  }
}

export class MedicationFormActionAddTimeOfDay implements IAction {
  readonly type = 'AddTimeOfDay';

  constructor(private _nDosage: number) { }

  public execute(): IPartialState {
    const timeOfDay = new TimeBuilder().build();
    return new MedicationFormStateAddTimeOfDay(this._nDosage, timeOfDay);
  }
}

export class MedicationFormActionRemoveTimeOfDay implements IAction {
  readonly type = 'RemoveTimeOfDay';

  constructor(private _nDosage: number,
              private _index: number) {
  }

  public execute(): IPartialState {
    return new MedicationFormStateRemoveTimeOfDay(this._nDosage, this._index);
  }
}

export class MedicationFormActionAddDoseAndRate implements IAction {
  readonly type = 'AddDoseAndRate';

  constructor(private _nDosage: number) { }

  public execute(): IPartialState {
    const doseAndRate = new DoseAndRateBuilder()
      .build();
    return new MedicationFormStateAddDoseAndRate(doseAndRate, this._nDosage);
  }
}

export class MedicationFormActionRemoveDoseAndRate implements IAction {
  readonly type = 'RemoveDoseAndRate';

  constructor(private _nDosage: number,
              private _index: number) {
  }

  public execute(): IPartialState {
    return new MedicationFormStateRemoveDoseAndRate(this._nDosage, this._index);
  }
}

export class MedicationFormActionValueChangesDispenseRequest implements IAction {
  readonly type = 'ValueChangesDispenseRequest';

  constructor(private _value: MedicationRequestDispenseRequest) { }

  public execute(): IPartialState {
    if (this._value.expectedSupplyDuration != null) {
      const value = this._value.expectedSupplyDuration.value;
      this._value.expectedSupplyDuration = new DurationBuilder()
        .setValue(value)
        .setUnit('days')
        .setCode('d')
        .setSystem('http://unitsofmeasure.org')
        .build();
    }
    return new MedicationFormStateValueChangesDispenseRequest(this._value);
  }
}

export class MedicationFormActionValueChangesDosageInstructionRoute implements IAction {
  readonly type = 'ValueChangesDosageInstructionRoute';

  constructor(private _formStateService: MedicationRequestFormService,
              private _cioDcSource: FhirCioDcService,
              private _medicationRequest: MedicationRequest,
              private _nDosage: number,
              private _routeValue: CodeableConcept,
              private _medicationKnowledge: MedicationKnowledge,
              private _medication: Medication) { }

  public execute(): IPartialState {
    const dosage = this._medicationRequest.dosageInstruction[this._nDosage];
    dosage.route = this._routeValue;

    const ingredient = (this._medicationRequest.contained.length > 1) ?
      this._medicationKnowledge.ingredient : this._medication.ingredient;

    const medList = (this._medicationRequest.contained.length > 1) ?
      this._medicationRequest.contained[1] as Medication : this._medication;
    this._formStateService.clearList(medList);
    from(this._cioDcSource.postMedicationKnowledgeDetailsByRouteCodeAndFormCodeAndIngredient(
      this._medicationKnowledge.id,
      this._medicationKnowledge.code,
      medList.form,
      ingredient,
      this._routeValue
    ))
      .subscribe(value => this._formStateService.buildList(medList.id, value));

    return new MedicationFormStateValueChangesDosageInstruction(this._nDosage, dosage);
  }
}

export class MedicationFormActionValueChangesDosageInstructionDurationValue implements IAction {
  readonly type = 'ValueChangesDosageInstructionDurationValue';

  constructor(private _medicationRequest: MedicationRequest,
              private _nDosage: number,
              private _durationValue: number) { }

  public execute(): IPartialState {
    const dosage = this._medicationRequest.dosageInstruction[this._nDosage];
    dosage.timing.repeat.duration = this._durationValue;
    return new MedicationFormStateValueChangesDosageInstruction(this._nDosage, dosage);
  }
}

export class MedicationFormActionValueChangesDosageInstructionDurationUnit implements IAction {
  readonly type = 'ValueChangesDosageInstructionDurationValue';

  constructor(private _medicationRequest: MedicationRequest,
              private _nDosage: number,
              private _durationUnit: UnitsOfTime) { }

  public execute(): IPartialState {
    const dosage = this._medicationRequest.dosageInstruction[this._nDosage];
    dosage.timing.repeat.durationUnit = this._durationUnit;
    return new MedicationFormStateValueChangesDosageInstruction(this._nDosage, dosage);
  }
}

export class MedicationFormActionValueChangesDosageInstructionDoseQuantityValue implements IAction {
  readonly type = 'ValueChangesDosageInstructionDoseQuantityValue';

  constructor(private _medicationRequest: fhir.MedicationRequest,
              private _nDosage: number,
              private _nDoseAndRate: number,
              private _doseQuantityValue: number) { }

  public execute(): IPartialState {
    const dosage = this._medicationRequest.dosageInstruction[this._nDosage];
    dosage.doseAndRate[this._nDoseAndRate].doseQuantity.value = this._doseQuantityValue;
    return new MedicationFormStateValueChangesDosageInstruction(this._nDosage, dosage);
  }
}

export class MedicationFormActionValueChangesDosageInstructionDoseQuantityUnit implements IAction {
  readonly type = 'ValueChangesDosageInstructionDoseQuantityUnit';

  constructor(private _medicationRequest: fhir.MedicationRequest,
              private _nDosage: number,
              private _nDoseAndRate: number,
              private _doseQuantityUnit: Coding) { }

  public execute(): IPartialState {
    const dosage = this._medicationRequest.dosageInstruction[this._nDosage];
    dosage.doseAndRate[this._nDoseAndRate].doseQuantity.unit = this._doseQuantityUnit.display;
    dosage.doseAndRate[this._nDoseAndRate].doseQuantity.code = this._doseQuantityUnit.code;
    dosage.doseAndRate[this._nDoseAndRate].doseQuantity.system = this._doseQuantityUnit.system;
    return new MedicationFormStateValueChangesDosageInstruction(this._nDosage, dosage);
  }
}

export class MedicationFormActionValueChangesDosageInstructionTimeOfDayValue implements IAction {
  readonly type = 'ValueChangesDosageInstructionTimeOfDay';

  constructor(private _medicationRequest: fhir.MedicationRequest,
              private _nDosage: number,
              private _nTimeOfDay: number,
              private _timeOfDayValue: UnitsOfTime) { }

  public execute(): IPartialState {
    const dosage = this._medicationRequest.dosageInstruction[this._nDosage];
    dosage.timing.repeat.timeOfDay[this._nTimeOfDay] = this._timeOfDayValue;
    return new MedicationFormStateValueChangesDosageInstruction(this._nDosage, dosage);
  }
}
