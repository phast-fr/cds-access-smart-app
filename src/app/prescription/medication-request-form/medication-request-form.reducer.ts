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
  MedicationFormStateRemoveMedication,
  MedicationFormStateValueChangesMedication,
  MedicationFormStateValueChangesTreatmentIntent,
  MedicationFormStateAddWhen, MedicationFormStateRemoveWhen
} from './medication-request-form.state';
import {MedicationRequestFormViewModel} from './medication-request-form.view-model';

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
      case 'AddWhen':
        this.addWhen(newState, partialState as MedicationFormStateAddWhen);
        break;
      case 'RemoveWhen':
        this.removeWhen(newState, partialState as MedicationFormStateRemoveWhen);
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
      case 'ValueChangesTreatmentIntent':
        this.valueChangesTreatmentIntent(newState, partialState as MedicationFormStateValueChangesTreatmentIntent);
        break;
      default:
        break;
    }
    return newState;
  }

  private addMedicationRequest(newState: MedicationRequestFormState, _: MedicationFormStateAddMedicationRequest): void {
    newState.medicationRequest = undefined;
    newState.nMedicationArray.length = 0;
    newState.nDosage = undefined;
    newState.index = undefined;
    newState.medicationKnowledgeMap.clear();
  }

  private addMedication(newState: MedicationRequestFormState, partialState: MedicationFormStateAddMedication): void {
    newState.medicationRequest = partialState.medicationRequest;
    if (newState?.medication?.id) {
      newState.medicationKnowledgeMap.set(
        newState.medication.id, partialState.medicationKnowledge
      );
    }

    if (newState?.medicationRequest?.dosageInstruction) {
      newState.medicationRequest.dosageInstruction.forEach((dosage, nDosage) => {
        this._viewModel.addList(newState, nDosage);
      });
    }

    this._viewModel.updateList(newState);
  }

  private removeMedication(newState: MedicationRequestFormState, partialState: MedicationFormStateRemoveMedication): void {
    newState.nMedicationArray.length = 0;
    if (newState?.medicationRequest?.contained) {
      const contained = newState.medicationRequest.contained;
      if (partialState.nMedication === 0) {
        contained.forEach((resource, index) => {
          newState.nMedicationArray.push(index);
        });
        newState.nMedicationArray.sort((a, b) => b - a);
        for (const key of newState.medicationKnowledgeMap.keys()) {
          newState.medicationKnowledgeMap.delete(key);
        }
      }
      else if (partialState.nMedication !== 0 && contained.length === 3) {
        const medicationDelete = contained[partialState.nMedication];
        if (medicationDelete?.id) {
          newState.medicationKnowledgeMap.delete(medicationDelete.id);
        }

        newState.nMedicationArray.push(partialState.nMedication);
        newState.nMedicationArray.push(0);
      }
      else {
        const medicationDelete = contained[partialState.nMedication];
        if (medicationDelete?.id) {
          newState.medicationKnowledgeMap.delete(medicationDelete.id);
        }
        newState.nMedicationArray.push(partialState.nMedication);
      }

      if (partialState.medicationRequest === null) {
        newState.medicationRequest = undefined;
      }
    }
  }

  private valueChangesMedication(newState: MedicationRequestFormState,
                                 partialState: MedicationFormStateValueChangesMedication): void {
    newState.medicationRequest = partialState.medicationRequest;
    this._viewModel.clearList(newState);
    this._viewModel.updateList(newState);
  }

  private valueChangesDosageInstruction(newState: MedicationRequestFormState,
                                        partialState: MedicationFormStateValueChangesDosageInstruction): void {
    newState.medicationRequest = partialState.medicationRequest;
    newState.nDosage = partialState.nDosage;

    this._viewModel.clearList(newState);
    this._viewModel.updateList(newState);
  }

  private addDosageInstruction(newState: MedicationRequestFormState, partialState: MedicationFormStateAddDosageInstruction): void {
    newState.medicationRequest = partialState.medicationRequest;
    if (partialState?.medicationRequest?.dosageInstruction) {
      newState.nDosage = partialState.medicationRequest.dosageInstruction.length - 1;
    }
    if (newState?.nDosage && newState.nDosage > 0) {
      this._viewModel.addList(newState, newState.nDosage);
    }
    this._viewModel.clearList(newState);
    this._viewModel.updateList(newState);
  }

  private removeDosageInstruction(newState: MedicationRequestFormState,
                                  partialState: MedicationFormStateRemoveDosageInstruction): void {
    newState.medicationRequest = partialState.medicationRequest;
    newState.nDosage = partialState.nDosage;
    if (newState.medicationRequest.dosageInstruction) {
      this._viewModel.removeList(newState, newState.nDosage);
    }
    this._viewModel.clearList(newState);
    this._viewModel.updateList(newState);
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

  private addWhen(newState: MedicationRequestFormState, partialState: MedicationFormStateAddWhen): void {
    newState.nDosage = partialState.nDosage;
  }

  private removeWhen(newState: MedicationRequestFormState, partialState: MedicationFormStateRemoveWhen): void {
    newState.medicationRequest = partialState.medicationRequest;
    newState.nDosage = partialState.nDosage;
    newState.index = partialState.nWhen;
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

  private valueChangesTreatmentIntent(newState: MedicationRequestFormState,
                                      partialState: MedicationFormStateValueChangesTreatmentIntent): void {
    newState.medicationRequest = partialState.medicationRequest;
  }
}
