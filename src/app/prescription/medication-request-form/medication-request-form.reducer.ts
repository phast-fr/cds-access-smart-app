import * as lodash from 'lodash';
import {
  IPartialState,
  MedicationFormStateAddMedication,
  MedicationRequestFormState,
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
import { PrescriptionStateService } from '../prescription-state.service';
import { FhirCioDcService } from '../../common/services/fhir.cio.dc.service';
import { fhir } from '../../common/fhir/fhir.types';
import Medication = fhir.Medication;
import MedicationIngredient = fhir.MedicationIngredient;
import Reference = fhir.Reference;
import Dosage = fhir.Dosage;
import time = fhir.time;
import DoseAndRate = fhir.DoseAndRate;

export class MedicationRequestFormReducer {

  constructor(private _prescriptionState: PrescriptionStateService,
              private _cioDcSource: FhirCioDcService) { }

  public reduce(state: MedicationRequestFormState, partialState: IPartialState): MedicationRequestFormState {
    const newState: MedicationRequestFormState = lodash.cloneDeep(state);
    newState.type = partialState.type;
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
      case 'DetailsMedication':
        this.detailsMedication(newState, partialState as MedicationFormStateDetailsMedication);
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
        console.log('Partial state not supported: ', partialState);
        break;
    }
    return newState;
  }

  private addMedicationRequest(newState: MedicationRequestFormState, _): void {
    this._prescriptionState.addMedicationRequest(newState.medicationRequest);
    newState.medicationRequestAdded();
    newState.medicationArray.length = 0;
    newState.nDosage = undefined;
    newState.index = undefined;
  }

  private addMedication(newState: MedicationRequestFormState, partialState: MedicationFormStateAddMedication): void {
    const medication = partialState.medication();
    let medicationRequest = newState.medicationRequest;
    if (medicationRequest == null) {
      const subject = {
        reference: 'Patient/' + newState.patient.id
      } as Reference;
      medicationRequest = newState.newMedicationRequest('order', subject);
      medicationRequest.medicationReference = {
        reference: '#' + medication.id
      };
      if (newState.user != null) {
        medicationRequest.requester = {
          reference: newState.user.resourceType + '/' + newState.user.id
        };
      }
    }
    else if (medicationRequest.contained.length === 1) {
      const medicationOld = medicationRequest.contained.shift() as Medication;

      const medicationRoot = {
        resourceType: 'Medication',
        id: 'med01',
        code: {
          text: medicationOld.code.text + ' & ' + medication.code.text
        },
        ingredient: [{
          itemReference: {
            reference: '#' + medicationOld.id,
            display: medicationOld.code.text
          }
        }, {
          itemReference: {
            reference: '#' + medication.id,
            display: medication.code.text
          }
        }]
      } as Medication;
      medicationRequest.contained.push(medicationRoot);
      medicationRequest.contained.push(medicationOld);
    }
    else if (medicationRequest.contained.length !== 0) {
      const medicationRoot = medicationRequest.contained[0] as Medication;
      medicationRoot.code.text += ' &' + medication.code.text;
      medicationRoot.ingredient.push({
        itemReference: {
          reference: '#' + medication.id,
          display: medication.code.text
        }
      } as MedicationIngredient);
    }
    medicationRequest.contained.push(medication);
  }

  private removeMedication(newState: MedicationRequestFormState, partialState: MedicationFormStateRemoveMedication): void {
    newState.medicationArray.length = 0;
    const contained = newState.medicationRequest.contained;
    if (partialState.nMedication === 0) {
      for (let i = 0; i < contained.length; i++) {
        newState.medicationArray.push(i);
      }
      newState.medicationArray.sort((a, b) => b - a);
      contained.length = 0;
    }
    else if (partialState.nMedication !== 0 && contained.length === 3) {
      contained.splice(partialState.nMedication, 1);
      contained.splice(0, 1);
      newState.medicationArray.push(partialState.nMedication);
      newState.medicationArray.push(0);
    }
    else {
      const medicationRoot = contained[0] as Medication;
      medicationRoot.ingredient.splice(partialState.nMedication, 1);
      contained.splice(partialState.nMedication, 1);
      newState.medicationArray.push(partialState.nMedication);
    }
  }

  private detailsMedication(newState: MedicationRequestFormState, partialState: MedicationFormStateDetailsMedication): void {
    const index = newState.medicationRequest.contained.findIndex(
      (value) => {
        return value.id === partialState.id;
      }
    );
    const medication = newState.medicationRequest.contained[index] as Medication;
    medication.form = partialState.formCode;
    medication.ingredient = partialState.ingredient;
  }

  private valueChangesDosageInstruction(newState: MedicationRequestFormState,
                                        partialState: MedicationFormStateValueChangesDosageInstruction): void {
    newState.medicationRequest.dosageInstruction[partialState.nDosage] = partialState.value;
  }

  private addDosageInstruction(newState: MedicationRequestFormState, partialState: MedicationFormStateAddDosageInstruction): void {
    const dosageInstruction = {
      sequence: newState.medicationRequest.dosageInstruction.length + 1,
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
    newState.medicationRequest.dosageInstruction.push(dosageInstruction);
  }

  private removeDosageInstruction(newState: MedicationRequestFormState,
                                  partialState: MedicationFormStateRemoveDosageInstruction): void {
    newState.medicationRequest.dosageInstruction.splice(partialState.nDosage, 1);
    newState.nDosage = partialState.nDosage;
  }

  private addTimeOfDay(newState: MedicationRequestFormState, partialState: MedicationFormStateAddTimeOfDay): void {
    newState.medicationRequest.dosageInstruction[partialState.nDosage].timing.repeat.timeOfDay.push('');
    newState.nDosage = partialState.nDosage;
  }

  private removeTimeOfDay(newState: MedicationRequestFormState,
                          partialState: MedicationFormStateRemoveTimeOfDay): void {
    newState.medicationRequest.dosageInstruction[partialState.nDosage].timing.repeat.timeOfDay.splice(partialState.index, 1);
    newState.nDosage = partialState.nDosage;
    newState.index = partialState.index;
  }

  private addDoseAndRate(newState: MedicationRequestFormState, partialState: MedicationFormStateAddDoseAndRate): void {
    newState.medicationRequest.dosageInstruction[partialState.nDosage].doseAndRate.push({
      type: {
        text: 'Ordered',
        coding: [{
          code: 'ordered',
          display: 'Ordered',
          system: 'http://terminology.hl7.org/CodeSystem/dose-rate-type',
        }]
      },
      doseRange: undefined,
      doseQuantity: {
        value: 0,
        unit: '',
        code: '',
        system: ''
      },
      rateRatio: undefined,
      rateRange: undefined,
      rateQuantity: undefined
    });
    newState.nDosage = partialState.nDosage;
  }

  private removeDoseAndRate(newState: MedicationRequestFormState,
                            partialState: MedicationFormStateRemoveDoseAndRate): void {
    newState.medicationRequest.dosageInstruction[partialState.nDosage].doseAndRate.splice(partialState.index, 1);
    newState.nDosage = partialState.nDosage;
    newState.index = partialState.index;
  }

  private valueChangesDispenseRequest(newState: MedicationRequestFormState,
                                      partialState: MedicationFormStateValueChangesDispenseRequest): void {
    newState.medicationRequest.dispenseRequest = partialState.value;
  }
}
