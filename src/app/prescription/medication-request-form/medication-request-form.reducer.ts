import * as lodash from 'lodash';
import {IPartialState, IReducer} from '../../common/cds-access/models/state.model';
import {
  MedicationFormStateAddMedication,
  MedicationRequestFormState,
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

import {MedicationRequestFormViewModel} from './medication-request-form-view-model';
import {CodeableConcept, Ratio} from 'phast-fhir-ts';

export class MedicationRequestFormReducer implements IReducer<MedicationRequestFormState>{

  constructor(private _viewModel: MedicationRequestFormViewModel) {
  }

  public reduce(state: MedicationRequestFormState, partialState: IPartialState): MedicationRequestFormState {
    let newState: MedicationRequestFormState;
    if (!state) {
      newState = new MedicationRequestFormState(partialState.type);
    }
    else {
      newState = lodash.cloneDeep(state);
      newState.type = partialState.type;
    }

    switch (partialState.type) {
      case 'AddMedicationRequest':
        this.addMedicationRequest(newState, partialState as MedicationFormStateAddMedicationRequest);
        break;
      case 'AddMedication':
        this.addMedication(newState, partialState as MedicationFormStateAddMedication);
        break;
      case 'RemoveMedication':
        this.removeMedication(newState, partialState as MedicationFormStateRemoveMedication);
        break;
      case 'ValueChangesMedication':
        this.valueChangesMedication(newState, partialState as MedicationFormStateValueChangesMedication);
        break;
      case 'AddDosageInstruction':
        this.addDosageInstruction(newState, partialState as MedicationFormStateAddDosageInstruction);
        break;
      case 'RemoveDosageInstruction':
        this.removeDosageInstruction(newState, partialState as MedicationFormStateRemoveDosageInstruction);
        break;
      case 'ValueChangesDosageInstruction':
        this.valueChangesDosageInstruction(newState, partialState as MedicationFormStateValueChangesDosageInstruction);
        break;
      case 'AddTimeOfDay':
        this.addTimeOfDay(newState, partialState as MedicationFormStateAddTimeOfDay);
        break;
      case 'RemoveTimeOfDay':
        this.removeTimeOfDay(newState, partialState as MedicationFormStateRemoveTimeOfDay);
        break;
      case 'AddDoseAndRate':
        this.addDoseAndRate(newState, partialState as MedicationFormStateAddDoseAndRate);
        break;
      case 'RemoveDoseAndRate':
        this.removeDoseAndRate(newState, partialState as MedicationFormStateRemoveDoseAndRate);
        break;
      case 'ValueChangesDispenseRequest':
        this.valueChangesDispenseRequest(newState, partialState as MedicationFormStateValueChangesDispenseRequest);
        break;
      default:
        break;
    }
    return newState;
  }

  private addMedicationRequest(newState: MedicationRequestFormState, _): void {
    newState.medicationRequest = null;
    newState.nMedicationArray.length = 0;
    newState.nDosage = undefined;
    newState.index = undefined;
    for (const key of Object.keys(newState.medicationKnowledgeMap)) {
      delete newState.medicationKnowledgeMap[key];
    }
  }

  private addMedication(newState: MedicationRequestFormState, partialState: MedicationFormStateAddMedication): void {
    newState.medicationRequest = partialState.medicationRequest;
    newState.medicationKnowledgeMap.set(
      partialState.medication.id, partialState.medicationKnowledge
    );
    if (!newState.formMap.get(partialState.medication.id)) {
      newState.formMap.set(partialState.medication.id, new Array<CodeableConcept>());
    }
    else {
      newState.formMap.get(partialState.medication.id).length = 0;
    }

    for (const ingredient of partialState.medicationKnowledge.ingredient) {
      if (newState.strengthMap.get(ingredient.itemCodeableConcept.text) == null) {
        newState.strengthMap.set(ingredient.itemCodeableConcept.text, new Array<Ratio>());
      }
      else {
        newState.strengthMap.get(ingredient.itemCodeableConcept.text).length = 0;
      }
    }

    if (newState.doseAndRateUnitMap.get(partialState.medication.id) == null) {
      newState.doseAndRateUnitMap.set(partialState.medication.id, new Array<CodeableConcept>());
    }
    else {
      newState.doseAndRateUnitMap.get(partialState.medication.id).length = 0;
    }

    this._viewModel.updateList(
      newState, partialState.medicationKnowledge, partialState.medication, undefined, undefined, undefined
    );
  }

  private removeMedication(newState: MedicationRequestFormState, partialState: MedicationFormStateRemoveMedication): void {
    newState.nMedicationArray.length = 0;
    const contained = newState.medicationRequest.contained;
    if (partialState.nMedication === 0) {
      for (let i = 0; i < contained.length; i++) {
        newState.nMedicationArray.push(i);
      }
      newState.nMedicationArray.sort((a, b) => b - a);
      for (const key of newState.medicationKnowledgeMap.keys()) {
        newState.medicationKnowledgeMap.delete(key);
      }
    }
    else if (partialState.nMedication !== 0 && contained.length === 3) {
      const medicationDelete = contained[partialState.nMedication];
      newState.medicationKnowledgeMap.delete(medicationDelete.id);

      newState.nMedicationArray.push(partialState.nMedication);
      newState.nMedicationArray.push(0);
    }
    else {
      const medicationDelete = contained[partialState.nMedication];
      newState.medicationKnowledgeMap.delete(medicationDelete.id);
      newState.nMedicationArray.push(partialState.nMedication);
    }
    newState.medicationRequest = partialState.medicationRequest;
  }

  private valueChangesMedication(newState: MedicationRequestFormState,
                                 partialState: MedicationFormStateValueChangesMedication): void {
    newState.medicationRequest = partialState.medicationRequest;
    if (partialState.medication) {
      this._viewModel.clearList(newState, partialState.medication);
      this._viewModel.updateList(
        newState,
        partialState.medicationKnowledge,
        partialState.medication,
        partialState.medication.form,
        partialState.ingredient,
        partialState.route
      );
    }
  }

  private valueChangesDosageInstruction(newState: MedicationRequestFormState,
                                        partialState: MedicationFormStateValueChangesDosageInstruction): void {
    newState.medicationRequest = partialState.medicationRequest;
    newState.nDosage = partialState.nDosage;
    if (partialState.medication) {
      this._viewModel.clearList(newState, partialState.medication);
      this._viewModel.updateList(
        newState,
        partialState.medicationKnowledge,
        partialState.medication,
        partialState.medication.form,
        partialState.ingredient,
        partialState.route
      );
    }
  }

  private addDosageInstruction(newState: MedicationRequestFormState, partialState: MedicationFormStateAddDosageInstruction): void {
    newState.medicationRequest = partialState.medicationRequest;
    newState.nDosage = partialState.medicationRequest.dosageInstruction.length - 1;
  }

  private removeDosageInstruction(newState: MedicationRequestFormState,
                                  partialState: MedicationFormStateRemoveDosageInstruction): void {
    newState.medicationRequest = partialState.medicationRequest;
    newState.nDosage = partialState.nDosage;
    if (!newState.medicationRequest.dosageInstruction) {
      this._viewModel.clearList(newState, partialState.medication);
      this._viewModel.updateList(
        newState,
        partialState.medicationKnowledge,
        partialState.medication,
        partialState.medication.form,
        partialState.ingredient,
        null
      );
    }
  }

  private addTimeOfDay(newState: MedicationRequestFormState, partialState: MedicationFormStateAddTimeOfDay): void {
    newState.nDosage = partialState.nDosage;
  }

  private removeTimeOfDay(newState: MedicationRequestFormState,
                          partialState: MedicationFormStateRemoveTimeOfDay): void {
    newState.medicationRequest = partialState.medicationRequest;
    newState.nDosage = partialState.nDosage;
    newState.index = partialState.index;
  }

  private addDoseAndRate(newState: MedicationRequestFormState,
                         partialState: MedicationFormStateAddDoseAndRate): void {
    newState.nDosage = partialState.nDosage;
  }

  private removeDoseAndRate(newState: MedicationRequestFormState,
                            partialState: MedicationFormStateRemoveDoseAndRate): void {
    newState.medicationRequest = partialState.medicationRequest;
    newState.nDosage = partialState.nDosage;
    newState.index = partialState.index;
  }

  private valueChangesDispenseRequest(newState: MedicationRequestFormState,
                                      partialState: MedicationFormStateValueChangesDispenseRequest): void {
    newState.medicationRequest = partialState.medicationRequest;
  }
}
