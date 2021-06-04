import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of, Subject } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

import hash from 'object-hash';

import { PrescriptionStateService } from '../prescription-state.service';

import {
  IIntent,
  MedicationFormIntentAddDosageInstruction,
  MedicationFormIntentAddDoseAndRate,
  MedicationFormIntentAddMedication,
  MedicationFormIntentAddMedicationRequest,
  MedicationFormIntentAddTimeOfDay,
  MedicationFormIntentRemoveDosageInstruction,
  MedicationFormIntentRemoveDoseAndRate,
  MedicationFormIntentRemoveMedication,
  MedicationFormIntentRemoveTimeOfDay,
  MedicationFormIntentValueChangesDispenseRequest,
  MedicationFormIntentValueChangesMedicationForm,
  MedicationFormIntentValueChangesMedicationIngredientStrength,
  MedicationFormIntentValueChangesMedicationIngredientStrengthValue,
  MedicationFormIntentValueChangesMedicationIngredientStrengthUnit,
  MedicationFormIntentValueChangesDosageInstructionRoute,
  MedicationFormIntentValueChangesDosageInstructionDurationValue,
  MedicationFormIntentValueChangesDosageInstructionDurationUnit,
  MedicationFormIntentValueChangesDosageInstructionDoseQuantityValue,
  MedicationFormIntentValueChangesDosageInstructionDoseQuantityUnit,
  MedicationFormIntentValueChangesDosageInstructionTimeOfDayValue
} from './medication-request-form.intent';
import {
  IAction,
  MedicationFormActionAddDosageInstruction,
  MedicationFormActionAddDoseAndRate,
  MedicationFormActionAddMedication,
  MedicationFormActionAddMedicationRequest,
  MedicationFormActionAddTimeOfDay,
  MedicationFormActionRemoveDosageInstruction,
  MedicationFormActionRemoveDoseAndRate,
  MedicationFormActionRemoveMedication,
  MedicationFormActionRemoveTimeOfDay,
  MedicationFormActionValueChangesDispenseRequest,
  MedicationFormActionValueChangesMedicationForm,
  MedicationFormActionValueChangesMedicationIngredientStrength,
  MedicationFormActionValueChangesMedicationIngredientStrengthValue,
  MedicationFormActionValueChangesMedicationIngredientStrengthUnit,
  MedicationFormActionValueChangesDosageInstructionRoute,
  MedicationFormActionValueChangesDosageInstructionDurationValue,
  MedicationFormActionValueChangesDosageInstructionDurationUnit,
  MedicationFormActionValueChangesDosageInstructionDoseQuantityValue,
  MedicationFormActionValueChangesDosageInstructionDoseQuantityUnit,
  MedicationFormActionValueChangesDosageInstructionTimeOfDayValue
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
import {FhirTioService} from '../../common/services/fhir.tio.service';
import ValueSet = fhir.ValueSet;
import UnitsOfTime = fhir.UnitsOfTime;
import ParametersParameter = fhir.ParametersParameter;

@Injectable()
export class MedicationRequestFormService {

  private readonly _formState$: BehaviorSubject<MedicationRequestFormState>;

  private _intents$ = new Subject<IIntent>();

  private readonly _reducer: MedicationRequestFormReducer;

  constructor(private _cioDcSource: FhirCioDcService,
              private _tioSource: FhirTioService,
              private _prescriptionState: PrescriptionStateService) {
    this._formState$ = new BehaviorSubject<MedicationRequestFormState>(
      new MedicationRequestFormState('AppStarted')
    );
    this._reducer = new MedicationRequestFormReducer();
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

  public nextMedicationId(): id {
    return 'med-' + this.formState.autoIncrement;
  }

  public initList(medicationKnowledge: MedicationKnowledge, medicationId: id): void {
    if (this.formState.formMap.get(medicationId) == null) {
      this.formState.formMap.set(medicationId, new Array<CodeableConcept>());
    }
    else {
      this.formState.formMap.get(medicationId).length = 0;
    }

    this.formState.routeArray.length = 0;

    for (const ingredient of medicationKnowledge.ingredient) {
      if (this.formState.strengthMap.get(ingredient.itemCodeableConcept.text) == null) {
        this.formState.strengthMap.set(ingredient.itemCodeableConcept.text, new Array<Ratio>());
      }
      else {
        this.formState.strengthMap.get(ingredient.itemCodeableConcept.text).length = 0;
      }
    }

    if (this.formState.doseAndRateUnitMap.get(medicationId) == null) {
      this.formState.doseAndRateUnitMap.set(medicationId, new Array<CodeableConcept>());
    }
    else {
      this.formState.doseAndRateUnitMap.get(medicationId).length = 0;
    }

    if (this.formState.durationUnitArray.length === 0) {
      this._tioSource.valueSet$expand('units-of-time')
        .then((valueSet: ValueSet) => {
          for (const valueSetExpansionContains of valueSet.expansion.contains) {
            this.formState.durationUnitArray.push(valueSetExpansionContains.display as UnitsOfTime);
          }
        });
    }
  }

  public clearList(medication: Medication): void {
    this.formState.loading = true;
    if (this.formState.formMap.get(medication.id)) {
      this.formState.formMap.get(medication.id).length = 0;
    }

    this.formState.routeArray.length = 0;

    for (const ingredient of medication.ingredient) {
      if (ingredient.itemCodeableConcept) {
        this.formState.strengthMap.get(ingredient.itemCodeableConcept.text).length = 0;
      }
    }
    if (this.formState.doseAndRateUnitMap.get(medication.id)) {
      this.formState.doseAndRateUnitMap.get(medication.id).length = 0;
    }
  }

  public buildList(medicationId: id, parameters: Parameters): void {
    if (parameters.parameter) {
      for (const parameter of parameters.parameter) {
        switch (parameter.name) {
          case 'intendedRoute':
            this.addUniqueCodeableConcept(this.formState.routeArray, parameter);
            break;
          case 'doseForm':
            this.addUniqueCodeableConcept(this.formState.formMap.get(medicationId), parameter);
            break;
          case 'ingredient':
            const ingredientCode = parameter.part[1].valueCodeableConcept;
            this.addUniqueRatio(this.formState.strengthMap.get(ingredientCode.text), parameter);
            break;
          case 'unite':
            this.addUniqueCoding(this.formState.doseAndRateUnitMap.get(medicationId), parameter);
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
      map(partialState => this._reducer.reduce(this.formState, partialState)),
      catchError(err => {
        console.log('Error: ', err);
        return of(this.formState);
      })
    ).subscribe(newState => this.emitNewState(newState));
  }

  private intentToAction(intent: IIntent): IAction {
    let action: IAction;
    switch (intent.type) {
      case 'AddMedication':
        action = new MedicationFormActionAddMedication(
          this._prescriptionState,
          this._cioDcSource,
          this,
          (intent as MedicationFormIntentAddMedication).medicationRequest,
          (intent as MedicationFormIntentAddMedication).medicationKnowledge,
          (intent as MedicationFormIntentAddMedication).medicationId
        );
        break;
      case 'RemoveMedication':
        action = new MedicationFormActionRemoveMedication(
          (intent as MedicationFormIntentRemoveMedication).medicationRequest,
          (intent as MedicationFormIntentRemoveMedication).nMedication
        );
        break;
      case 'ValueChangesMedicationForm':
        action = new MedicationFormActionValueChangesMedicationForm(
          this,
          this._cioDcSource,
          (intent as MedicationFormIntentValueChangesMedicationForm).medicationRequest,
          (intent as MedicationFormIntentValueChangesMedicationForm).medication,
          (intent as MedicationFormIntentValueChangesMedicationForm).formValue,
          (intent as MedicationFormIntentValueChangesMedicationForm).medicationKnowledge,
          (intent as MedicationFormIntentValueChangesMedicationForm).intendedRoute
        );
        break;
      case 'ValueChangesMedicationIngredientStrength':
        action = new MedicationFormActionValueChangesMedicationIngredientStrength(
          this,
          this._cioDcSource,
          (intent as MedicationFormIntentValueChangesMedicationIngredientStrength).medicationRequest,
          (intent as MedicationFormIntentValueChangesMedicationIngredientStrength).medication,
          (intent as MedicationFormIntentValueChangesMedicationIngredientStrength).itemCodeableConcept,
          (intent as MedicationFormIntentValueChangesMedicationIngredientStrength).strengthValue,
          (intent as MedicationFormIntentValueChangesMedicationIngredientStrength).medicationKnowledge,
          (intent as MedicationFormIntentValueChangesMedicationIngredientStrength).form,
          (intent as MedicationFormIntentValueChangesMedicationIngredientStrength).intendedRoute
        );
        break;
      case 'ValueChangesMedicationIngredientStrengthValue':
        action = new MedicationFormActionValueChangesMedicationIngredientStrengthValue(
          (intent as MedicationFormIntentValueChangesMedicationIngredientStrengthValue).medicationRequest,
          (intent as MedicationFormIntentValueChangesMedicationIngredientStrengthValue).medication,
          (intent as MedicationFormIntentValueChangesMedicationIngredientStrengthValue).itemReference,
          (intent as MedicationFormIntentValueChangesMedicationIngredientStrengthValue).strengthValue
        );
        break;
      case 'ValueChangesMedicationIngredientStrengthUnit':
        action = new MedicationFormActionValueChangesMedicationIngredientStrengthUnit(
          (intent as MedicationFormIntentValueChangesMedicationIngredientStrengthUnit).medicationRequest,
          (intent as MedicationFormIntentValueChangesMedicationIngredientStrengthUnit).medication,
          (intent as MedicationFormIntentValueChangesMedicationIngredientStrengthUnit).itemReference,
          (intent as MedicationFormIntentValueChangesMedicationIngredientStrengthUnit).strengthUnit
        );
        break;
      case 'AddMedicationRequest':
        action = new MedicationFormActionAddMedicationRequest(
          this._prescriptionState,
          (intent as MedicationFormIntentAddMedicationRequest).medicationRequest
          );
        break;
      case 'AddDosageInstruction':
        action = new MedicationFormActionAddDosageInstruction(
          (intent as MedicationFormIntentAddDosageInstruction).medicationRequest
        );
        break;
      case 'RemoveDosageInstruction':
        action = new MedicationFormActionRemoveDosageInstruction(
          (intent as MedicationFormIntentRemoveDosageInstruction).nDosage
        );
        break;
      case 'ValueChangesDosageInstructionRoute':
        action = new MedicationFormActionValueChangesDosageInstructionRoute(
          this,
          this._cioDcSource,
          (intent as MedicationFormIntentValueChangesDosageInstructionRoute).medicationRequest,
          (intent as MedicationFormIntentValueChangesDosageInstructionRoute).nDosage,
          (intent as MedicationFormIntentValueChangesDosageInstructionRoute).routeValue,
          (intent as MedicationFormIntentValueChangesDosageInstructionRoute).medicationKnowledge,
          (intent as MedicationFormIntentValueChangesDosageInstructionRoute).medication
        );
        break;
      case 'ValueChangesDosageInstructionDurationValue':
        action = new MedicationFormActionValueChangesDosageInstructionDurationValue(
          (intent as MedicationFormIntentValueChangesDosageInstructionDurationValue).medicationRequest,
          (intent as MedicationFormIntentValueChangesDosageInstructionDurationValue).nDosage,
          (intent as MedicationFormIntentValueChangesDosageInstructionDurationValue).durationValue
        );
        break;
      case 'ValueChangesDosageInstructionDurationUnit':
        action = new MedicationFormActionValueChangesDosageInstructionDurationUnit(
          (intent as MedicationFormIntentValueChangesDosageInstructionDurationUnit).medicationRequest,
          (intent as MedicationFormIntentValueChangesDosageInstructionDurationUnit).nDosage,
          (intent as MedicationFormIntentValueChangesDosageInstructionDurationUnit).durationUnit
        );
        break;
      case 'ValueChangesDosageInstructionDoseQuantityValue':
        action = new MedicationFormActionValueChangesDosageInstructionDoseQuantityValue(
          (intent as MedicationFormIntentValueChangesDosageInstructionDoseQuantityValue).medicationRequest,
          (intent as MedicationFormIntentValueChangesDosageInstructionDoseQuantityValue).nDosage,
          (intent as MedicationFormIntentValueChangesDosageInstructionDoseQuantityValue).nDoseAndRate,
          (intent as MedicationFormIntentValueChangesDosageInstructionDoseQuantityValue).doseQuantityValue
        );
        break;
      case 'ValueChangesDosageInstructionDoseQuantityUnit':
        action = new MedicationFormActionValueChangesDosageInstructionDoseQuantityUnit(
          (intent as MedicationFormIntentValueChangesDosageInstructionDoseQuantityUnit).medicationRequest,
          (intent as MedicationFormIntentValueChangesDosageInstructionDoseQuantityUnit).nDosage,
          (intent as MedicationFormIntentValueChangesDosageInstructionDoseQuantityUnit).nDoseAndRate,
          (intent as MedicationFormIntentValueChangesDosageInstructionDoseQuantityUnit).doseQuantityUnit
        );
        break;
      case 'ValueChangesDosageInstructionTimeOfDayValue':
        action = new MedicationFormActionValueChangesDosageInstructionTimeOfDayValue(
          (intent as MedicationFormIntentValueChangesDosageInstructionTimeOfDayValue).medicationRequest,
          (intent as MedicationFormIntentValueChangesDosageInstructionTimeOfDayValue).nDosage,
          (intent as MedicationFormIntentValueChangesDosageInstructionTimeOfDayValue).nTimeOfDay,
          (intent as MedicationFormIntentValueChangesDosageInstructionTimeOfDayValue).timeOfDay
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

  private addUniqueCodeableConcept(uniqueCodeableConceptArray: Array<CodeableConcept>, parameter: ParametersParameter): void {
    let isExist = false;
    if (parameter.valueCodeableConcept !== undefined) {
      const valueCodeableConceptHash = hash(parameter.valueCodeableConcept);
      uniqueCodeableConceptArray.forEach(value => {
        const refHash = hash(value);
        if (valueCodeableConceptHash === refHash) {
          isExist = true;
        }
      });
      if (!isExist) {
        uniqueCodeableConceptArray.push(parameter.valueCodeableConcept);
      }
    }
    else if (parameter.valueCoding !== undefined) {
      const valueCodingHash = hash(parameter.valueCoding);
      uniqueCodeableConceptArray.forEach(value => {
        const refHash = hash(value);
        if (valueCodingHash === refHash) {
          isExist = true;
        }
      });
      if (!isExist) {
        uniqueCodeableConceptArray.push({
          text: parameter.valueCoding.display,
          coding: new Array<Coding>(parameter.valueCoding)
        });
      }
    }
  }

  private addUniqueCoding(uniqueCodingArray: Array<Coding>, parameter: ParametersParameter): void {
    const valueHash = hash(parameter.valueCoding);
    let isExist = false;
    uniqueCodingArray.forEach(value => {
      const refHash = hash(value);
      if (valueHash === refHash) {
        isExist = true;
      }
    });
    if (!isExist) {
      uniqueCodingArray.push(parameter.valueCoding);
    }
  }

  private addUniqueRatio(uniqueRatioArray: Array<Ratio>, parameter: ParametersParameter): void {
    const valueRatio = parameter.part[0].valueRatio;
    const valueHash = hash(valueRatio);
    let isExist = false;
    uniqueRatioArray.forEach(value => {
      const refHash = hash(value);
      if (valueHash === refHash) {
        isExist = true;
      }
    });
    if (!isExist) {
      uniqueRatioArray.push(valueRatio);
    }
  }
}
