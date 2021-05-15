import * as lodash from 'lodash';
import {
  IPartialState,
  MedicationFormStateAddMedication,
  MedicationFormStateDetailsMedication,
  MedicationFormStateAddMedicationRequest,
  MedicationFormStateAddTimeOfDay,
  MedicationFormStateValueChangesDosageInstruction,
  MedicationFormStateValueChangesDispenseRequest,
  MedicationFormStateAddDosageInstruction,
  MedicationFormStateRemoveDosageInstruction,
  MedicationFormStateRemoveTimeOfDay,
  MedicationFormStateAddDoseAndRate,
  MedicationFormStateRemoveDoseAndRate,
  MedicationFormStateRemoveMedication
} from './medication-request-form.state';

import { fhir } from '../../common/fhir/fhir.types';
import MedicationKnowledge = fhir.MedicationKnowledge;
import Medication = fhir.Medication;
import Coding = fhir.Coding;
import id = fhir.id;
import MedicationIngredient = fhir.MedicationIngredient;
import Dosage = fhir.Dosage;
import MedicationRequestDispenseRequest = fhir.MedicationRequestDispenseRequest;

export interface IAction {
  readonly type: string;

  execute(): IPartialState;
}

export class MedicationFormActionAddMedicationRequest implements IAction {
  readonly type = 'AddMedicationRequest';

  constructor() { }

  public execute(): IPartialState {
    return new MedicationFormStateAddMedicationRequest();
  }
}

export class MedicationFormActionDetailsMedication implements IAction {
  readonly type = 'DetailsMedication';

  constructor(private _medicationId: id,
              private _formCode: Coding,
              private _ingredient: MedicationIngredient[],
              private _routeCode: Coding) { }

  public execute(): IPartialState {
    return new MedicationFormStateDetailsMedication(this._medicationId, this._formCode, this._ingredient, this._routeCode);
  }
}

export class MedicationFormActionAddMedication implements IAction {
  type = 'AddMedication';

  constructor(private _medicationKnowledge: MedicationKnowledge) { }

  public execute(): IPartialState {
    const medication = {
        resourceType: 'Medication',
        id: this._medicationKnowledge.id,
        code: this._medicationKnowledge.code,
        ingredient: lodash.cloneDeep(this._medicationKnowledge.ingredient),
        form: this._medicationKnowledge.doseForm
      } as Medication;
    return new MedicationFormStateAddMedication(medication);
  }
}


export class MedicationFormActionRemoveMedication implements IAction {
  readonly type = 'RemoveMedication';

  constructor(private _nMedication: number) { }

  public execute(): IPartialState {
    return new MedicationFormStateRemoveMedication(this._nMedication);
  }
}


export class MedicationFormActionAddDosageInstruction implements IAction {
  readonly type = 'AddDosageInstruction';

  constructor() { }

  public execute(): IPartialState {
    return new MedicationFormStateAddDosageInstruction();
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

  constructor(
    private _nDosage: number) { }

  public execute(): IPartialState {
    return new MedicationFormStateAddTimeOfDay(this._nDosage);
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

  constructor(
    private _nDosage: number) { }

  public execute(): IPartialState {
    return new MedicationFormStateAddDoseAndRate(this._nDosage);
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
      this._value.expectedSupplyDuration = {
        value,
        unit: 'days',
        code: 'd',
        system: 'http://unitsofmeasure.org'
      };
    }
    return new MedicationFormStateValueChangesDispenseRequest(this._value);
  }
}

export class MedicationFormActionValueChangesDosageInstruction implements IAction {
  readonly type = 'ValueChangesDosageInstruction';

  constructor(
    private _nDosage: number,
    private _value: Dosage) { }

  public execute(): IPartialState {
    for (const doseAndRate of this._value.doseAndRate) {
      const doseQuantity = doseAndRate.doseQuantity;
      const coding = doseQuantity.unit as Coding;
      if (coding != null) {
        doseQuantity.system = coding.system;
        doseQuantity.code = coding.code;
        doseQuantity.unit = coding.display;
      }
    }

    return new MedicationFormStateValueChangesDosageInstruction(this._nDosage, this._value);
  }
}
