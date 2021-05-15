import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, Subject } from 'rxjs';
import { map } from 'rxjs/operators';

import { PrescriptionStateService } from '../prescription-state.service';

import {
  IIntent,
  MedicationFormIntentAddDoseAndRate,
  MedicationFormIntentAddMedication,
  MedicationFormIntentAddTimeOfDay,
  MedicationFormIntentDetailsMedication,
  MedicationFormIntentRemoveDosageInstruction,
  MedicationFormIntentRemoveDoseAndRate, MedicationFormIntentRemoveMedication,
  MedicationFormIntentRemoveTimeOfDay,
  MedicationFormIntentValueChangesDispenseRequest,
  MedicationFormIntentValueChangesDosageInstruction
} from './medication-request-form.intent';
import {
  IAction,
  MedicationFormActionAddDosageInstruction,
  MedicationFormActionAddDoseAndRate,
  MedicationFormActionAddMedication,
  MedicationFormActionAddMedicationRequest,
  MedicationFormActionAddTimeOfDay,
  MedicationFormActionDetailsMedication,
  MedicationFormActionRemoveDosageInstruction,
  MedicationFormActionRemoveDoseAndRate, MedicationFormActionRemoveMedication,
  MedicationFormActionRemoveTimeOfDay,
  MedicationFormActionValueChangesDispenseRequest,
  MedicationFormActionValueChangesDosageInstruction
} from './medication-request-form.action';
import { MedicationRequestFormState } from './medication-request-form.state';
import { MedicationRequestFormReducer } from './medication-request-form.reducer';

import { FhirCioDcService } from '../../common/services/fhir.cio.dc.service';
import { fhir } from '../../common/fhir/fhir.types';
import Medication = fhir.Medication;
import Parameters = fhir.Parameters;
import id = fhir.id;
import MedicationKnowledge = fhir.MedicationKnowledge;
import CodeableConcept = fhir.CodeableConcept;
import Ratio = fhir.Ratio;
import Coding = fhir.Coding;

@Injectable()
export class MedicationRequestFormService {

  private readonly _formState$: BehaviorSubject<MedicationRequestFormState>;

  private _intents$ = new Subject<IIntent>();

  private readonly _reducer: MedicationRequestFormReducer;

  constructor(private _cioDcSource: FhirCioDcService,
              private _prescriptionState: PrescriptionStateService) {
    this._formState$ = new BehaviorSubject<MedicationRequestFormState>(
      new MedicationRequestFormState(
        _prescriptionState.user,
        _prescriptionState.patient,
        'AppStarted'));
    this._reducer = new MedicationRequestFormReducer(_prescriptionState, _cioDcSource);
    this.handlerIntent();
  }

  public get formState(): MedicationRequestFormState {
    return this._formState$.value;
  }

  public get formStateObservable(): Observable<MedicationRequestFormState> {
    return this._formState$;
  }

  public dispatchIntent(intent: IIntent): void {
    this._intents$.next(intent);
  }

  // TODO change this MK to Medication
  // to make this, do dev a solution to manage Medication id and relationship this MK source
  public initList(medicationKnowledge: MedicationKnowledge): void {
    if (this.formState.formMap[medicationKnowledge.id] == null) {
      this.formState.formMap[medicationKnowledge.id] = new Set<CodeableConcept>();
    }
    else {
      this.formState.formMap[medicationKnowledge.id].clear();
    }

    this.formState.routeArray.length = 0;

    for (const ingredient of medicationKnowledge.ingredient) {
      if (this.formState.strengthMap[ingredient.itemCodeableConcept.text] == null) {
        this.formState.strengthMap[ingredient.itemCodeableConcept.text] = new Set<Ratio>();
      }
      else {
        this.formState.strengthMap[ingredient.itemCodeableConcept.text].clear();
      }
    }

    this.formState.durationUnitArray.length = 0;
  }

  public clearList(medication: Medication): void {
    if (this.formState.formMap.hasOwnProperty(medication.id)) {
      this.formState.formMap[medication.id].clear();
    }

    this.formState.routeArray.length = 0;

    for (const ingredient of medication.ingredient) {
      if (ingredient.itemCodeableConcept != null) {
        this.formState.strengthMap[ingredient.itemCodeableConcept.text].clear();
      }
    }
    this.formState.doseAndRateUnitArray.length = 0;
  }

  public buildList(mkId: id, parameters: Parameters): void {
    if (parameters.parameter != null) {
      for (const parameter of parameters.parameter) {
        switch (parameter.name) {
          case 'intendedRoute':
            if (parameter.valueCodeableConcept !== undefined) {
              this.formState.routeArray.push(parameter.valueCodeableConcept);
            }
            else if (parameter.valueCoding !== undefined) {
              this.formState.routeArray.push({
                text: parameter.valueCoding.display,
                coding: new Array<Coding>(parameter.valueCoding)
              });
            }
            break;
          case 'doseForm':
            if (parameter.valueCodeableConcept !== undefined) {
              this.formState.formMap[mkId].add(parameter.valueCodeableConcept);
            }
            else if (parameter.valueCoding !== undefined) {
              this.formState.formMap[mkId].add({
                text: parameter.valueCoding.display,
                coding: new Array<Coding>(parameter.valueCoding)
              });
            }
            break;
          case 'ingredient':
            const part = parameter.part;
            const strength = part[0].valueRatio;
            const ingredientCode = part[1].valueCodeableConcept;
            this.formState.strengthMap[ingredientCode.text].add(strength);
            break;
          case 'unite':
            this.formState.doseAndRateUnitArray.push(parameter.valueCoding);
            break;
          default:
            // relatedMedicationKnowledge
            break;
        }
      }
    }
    this.formState.loading = false;
  }

  private handlerIntent(): void {
    this._intents$.pipe(
      map(intent => this.intentToAction(intent)),
      map(action => action.execute()),
      map(partialState => this._reducer.reduce(this.formState, partialState))
    ).subscribe(newState => this.emitNewState(newState));
  }

  private intentToAction(intent: IIntent): IAction {
    let action: IAction;
    switch (intent.type) {
      case 'AddMedication':
        action = new MedicationFormActionAddMedication(
          (intent as MedicationFormIntentAddMedication).medicationKnowledge
        );
        break;
      case 'RemoveMedication':
        action = new MedicationFormActionRemoveMedication(
          (intent as MedicationFormIntentRemoveMedication).nMedication
        );
        break;
      case 'DetailsMedication':
        action = new MedicationFormActionDetailsMedication(
          (intent as MedicationFormIntentDetailsMedication).id,
          (intent as MedicationFormIntentDetailsMedication).formCode,
          (intent as MedicationFormIntentDetailsMedication).ingredient,
          (intent as MedicationFormIntentDetailsMedication).routeCode,
        );
        break;
      case 'AddMedicationRequest':
        action = new MedicationFormActionAddMedicationRequest();
        break;
      case 'AddDosageInstruction':
        action = new MedicationFormActionAddDosageInstruction();
        break;
      case 'RemoveDosageInstruction':
        action = new MedicationFormActionRemoveDosageInstruction(
          (intent as MedicationFormIntentRemoveDosageInstruction).nDosage
        );
        break;
      case 'ValueChangesDosageInstruction':
        action = new MedicationFormActionValueChangesDosageInstruction(
          (intent as MedicationFormIntentValueChangesDosageInstruction).nDosage,
          (intent as MedicationFormIntentValueChangesDosageInstruction).value
        );
        break;
      case 'AddTimeOfDay':
        action = new MedicationFormActionAddTimeOfDay(
          (intent as MedicationFormIntentAddTimeOfDay).nDosage
        );
        break;
      case 'RemoveTimeOfDay':
        action = new MedicationFormActionRemoveTimeOfDay(
          (intent as MedicationFormIntentRemoveTimeOfDay).nDosage,
          (intent as MedicationFormIntentRemoveTimeOfDay).index
        );
        break;
      case 'AddDoseAndRate':
        action = new MedicationFormActionAddDoseAndRate(
          (intent as MedicationFormIntentAddDoseAndRate).nDosage
        );
        break;
      case 'RemoveDoseAndRate':
        action = new MedicationFormActionRemoveDoseAndRate(
          (intent as MedicationFormIntentRemoveDoseAndRate).nDosage,
          (intent as MedicationFormIntentRemoveDoseAndRate).index
        );
        break;
      case 'ValueChangesDispenseRequest':
        action = new MedicationFormActionValueChangesDispenseRequest(
          (intent as MedicationFormIntentValueChangesDispenseRequest).value
        );
        break;
      default:
        console.log('cannot find an action for this intent: ', intent);
        break;
    }
    return action;
  }

  private emitNewState(newSate: MedicationRequestFormState): void {
    this._formState$.next(newSate);
  }
}
