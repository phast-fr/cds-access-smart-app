/**
 * @license
 * Copyright PHAST SARL All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://cds-access.phast.fr/license
 */
import { Injectable } from '@angular/core';
import {BehaviorSubject, forkJoin, Observable, Subject} from 'rxjs';
import {map, retry} from 'rxjs/operators';

import hash from 'object-hash';
import {IAction, IIntent, IViewModel} from '../../common/cds-access/models/state.model';
import { MedicationRequestFormState } from './medication-request-form.state';
import { MedicationRequestFormReducer } from './medication-request-form.reducer';
import { PhastCioDcService } from '../../common/cds-access/services/phast.cio.dc.service';
import { PhastTioService } from '../../common/cds-access/services/phast.tio.service';
import {
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
  MedicationFormIntentValueChangesDosageInstructionTimeOfDayValue,
  MedicationFormIntentCdsHelp,
  MedicationFormIntentValueChangesDosageInstructionBoundsDurationValue,
  MedicationFormIntentValueChangesDosageInstructionBoundsDurationUnit,
  MedicationFormIntentValueChangesDosageInstructionBoundsPeriodStart,
  MedicationFormIntentValueChangesDosageInstructionBoundsPeriodEnd,
  MedicationFormIntentValueChangesTreatmentIntent
} from './medication-request-form.intent';
import {
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
  MedicationFormActionValueChangesDosageInstructionTimeOfDayValue,
  MedicationFormActionCdsHelp,
  MedicationFormActionValueChangesDosageInstructionBoundsDurationValue,
  MedicationFormActionValueChangesDosageInstructionBoundsDurationUnit,
  MedicationFormActionValueChangesDosageInstructionBoundsPeriodEnd,
  MedicationFormActionValueChangesDosageInstructionBoundsPeriodStart,
  MedicationFormActionValueChangesTreatmentIntent
} from './medication-request-form.action';
import {
  CodeableConcept, Coding,
  id,
  Medication,
  MedicationKnowledge, MedicationRequest,
  Parameters, ParametersParameter,
  Ratio,
  ValueSet, ValueSetContains
} from 'phast-fhir-ts';

@Injectable()
export class MedicationRequestFormViewModel implements IViewModel<IIntent, MedicationRequestFormState>{

  private readonly _state$: BehaviorSubject<MedicationRequestFormState>;

  private readonly _intents$: Subject<IIntent>;

  private readonly _reducer: MedicationRequestFormReducer;

  constructor(private _cioDcSource: PhastCioDcService,
              private _tioSource: PhastTioService) {
    this._intents$ = new Subject<IIntent>();
    this._state$ = new BehaviorSubject<MedicationRequestFormState>(null);
    this._reducer = new MedicationRequestFormReducer(this);
    this.handlerIntent();
  }

  public dispatchIntent(intent: IIntent): void {
    this._intents$.next(intent);
  }

  public state$(): Observable<MedicationRequestFormState> {
    return this._state$.asObservable();
  }

  public get isLoadingCIOList$(): Observable<boolean> {
    if (this._state$.value) {
      const state = this._state$.value;
      return state.isLoadingCIOList$;
    }
    return new BehaviorSubject<boolean>(false).asObservable();
  }

  public get isLoadingTIOList$(): Observable<boolean> {
    if (this._state$.value) {
      const state = this._state$.value;
      return state.isLoadingTIOList$;
    }
    return new BehaviorSubject<boolean>(false).asObservable();
  }

  public get medicationRequest(): MedicationRequest | undefined {
    if (this._state$.value) {
      const state = this._state$.value;
      return state.medicationRequest;
    }
    return undefined;
  }

  public get medication(): Medication | undefined {
    if (this._state$.value) {
      const state = this._state$.value;
      return state.medication;
    }
    return undefined;
  }

  public get formMap(): Map<id, Map<number, Array<CodeableConcept>>> | undefined {
    if (this._state$.value) {
      const state = this._state$.value;
      return state.formMap;
    }
    return undefined;
  }

  public get strengthMap(): Map<id, Map<number, Array<Ratio>>> | undefined {
    if (this._state$.value) {
      const state = this._state$.value;
      return state.strengthMap;
    }
    return undefined;
  }

  public get doseAndRateUnitMap(): Map<id, Map<number, Array<Coding>>> | undefined {
    if (this._state$.value) {
      const state = this._state$.value;
      return state.doseAndRateUnitMap;
    }
    return undefined;
  }

  public get routeMap(): Map<number, Array<CodeableConcept>> | undefined {
    if (this._state$.value) {
      const state = this._state$.value;
      return state.routeMap;
    }
    return undefined;
  }

  public get treatmentIntent(): Array<ValueSetContains> | undefined {
    if (this._state$.value) {
      const state = this._state$.value;
      return state.treatmentIntent;
    }
    return undefined;
  }

  public get durationUnitArray(): Array<ValueSetContains> | undefined {
    if (this._state$.value) {
      const state = this._state$.value;
      return state.durationUnitArray;
    }
    return undefined;
  }

  public get medicationKnowledgeMap(): Map<id, MedicationKnowledge> | undefined {
    if (this._state$.value) {
      const state = this._state$.value;
      return state.medicationKnowledgeMap;
    }
    return undefined;
  }

  public nextMedicationId(): id {
    if (this._state$.value) {
      return 'med-' + this._state$.value.autoIncrement;
    }
    return 'med-1';
  }

  public updateList(state: MedicationRequestFormState): void {
    if (state.durationUnitArray.length === 0
      && state.treatmentIntent.length === 0) {
      state.loadingTIOList = true;
      const tioObservable = [this._tioSource.valueSet$expand('http://hl7.org/fhir/ValueSet/units-of-time'),
        this._tioSource.valueSet$expand('http://interopsante.org/fhir/ValueSet/fr-treatment-intent')];

      forkJoin(tioObservable)
        .subscribe({
          next: (valueSets: ValueSet[]) => valueSets.forEach((valueSet) => {
            if (valueSet.name === 'UCUMCodesForTime') {
              valueSet.expansion.contains.forEach(
                (valueSetContains) => state.durationUnitArray.push(valueSetContains));
            }
            else if (valueSet.name === 'FrTreatmentIntent') {
              valueSet.expansion.contains.forEach(
                (valueSetContains) => state.treatmentIntent.push(valueSetContains));
            }
          }),
          error: err => console.error('error', err),
          complete: () => state.loadingTIOList = false
        });
    }

    const medication = state.medication;
    if (medication) {
      state.loadingCIOList = true;
      const medicationKnowledge = state.medicationKnowledgeMap.get(medication.id);
      if (state.medicationRequest.dosageInstruction) {
        const observables = new Array<Observable<Parameters>>();
        state.medicationRequest.dosageInstruction.forEach((dosage) => {
          observables.push(
            this._cioDcSource.postMedicationKnowledgeDetailsByRouteCodeAndFormCodeAndIngredient(
              medicationKnowledge.id, medicationKnowledge.code, medication.form, medication.ingredient, dosage?.route
            )
              .pipe(
                retry({count: 3, delay: 1000})
              )
          );
        });
        forkJoin(observables)
          .subscribe({
            next: parameters => parameters.forEach((parameter, nDosage) =>
              this.buildList(state, state.medication.id, nDosage, parameter)),
            error: err => console.error('error', err),
            complete: () => state.loadingCIOList = false
          });
      }
      else {
        this._cioDcSource.postMedicationKnowledgeDetailsByRouteCodeAndFormCodeAndIngredient(
          medicationKnowledge.id, medicationKnowledge.code, medication.form, medication.ingredient
        )
          .pipe(
            retry({count: 3, delay: 1000})
          )
          .subscribe({
            next: parameters => this.buildList(state, state.medication.id, 0, parameters),
            error: err => console.error('error', err),
            complete: () => state.loadingCIOList = false
          });
      }
    }
  }

  public clearList(state: MedicationRequestFormState): void {
    const medication = state.medication;
    if (medication && state.medicationRequest.dosageInstruction) {
      state.medicationRequest.dosageInstruction.forEach((dosage, nDosage) => {
        if (state.formMap.get(medication.id).get(nDosage)) {
          state.formMap.get(medication.id).get(nDosage).length = 0;
        }

        for (const ingredient of medication.ingredient) {
          if (ingredient.itemCodeableConcept) {
            state.strengthMap.get(ingredient.itemCodeableConcept.text).get(nDosage).length = 0;
          }
        }

        if (state.doseAndRateUnitMap.get(medication.id).get(nDosage)) {
          state.doseAndRateUnitMap.get(medication.id).get(nDosage).length = 0;
        }

        if (state.routeMap.get(nDosage)) {
          state.routeMap.get(nDosage).length = 0;
        }
      });
    }
    else if (medication) {
      if (state.formMap.get(medication.id).get(0)) {
        state.formMap.get(medication.id).get(0).length = 0;
      }

      for (const ingredient of medication.ingredient) {
        if (ingredient.itemCodeableConcept) {
          state.strengthMap.get(ingredient.itemCodeableConcept.text).get(0).length = 0;
        }
      }

      if (state.doseAndRateUnitMap.get(medication.id).get(0)) {
        state.doseAndRateUnitMap.get(medication.id).get(0).length = 0;
      }

      if (state.routeMap.get(0)) {
        state.routeMap.get(0).length = 0;
      }
    }
  }

  public buildList(state: MedicationRequestFormState, medicationId: id, nDosage: number, parameters: Parameters): void {
    if (parameters.parameter) {
      for (const parameter of parameters.parameter) {
        switch (parameter.name) {
          case 'intendedRoute':
            this.addUniqueCodeableConcept(state.routeMap.get(nDosage), parameter);
            break;
          case 'doseForm':
            this.addUniqueCodeableConcept(state.formMap.get(medicationId).get(nDosage), parameter);
            break;
          case 'ingredient':
            const ingredientCode = parameter.part[1].valueCodeableConcept;
            this.addUniqueRatio(state.strengthMap.get(ingredientCode.text).get(nDosage), parameter);
            break;
          case 'unite':
            this.addUniqueCoding(state.doseAndRateUnitMap.get(medicationId).get(nDosage), parameter);
            break;
          default:
            // relatedMedicationKnowledge
            break;
        }
      }
    }
  }

  public addList(state: MedicationRequestFormState, nDosage: number): void {
    const medication = state.medication;
    const medicationKnowledge = state.medicationKnowledgeMap.get(medication.id);

    if (!state.formMap.get(medication.id)) {
      state.formMap.set(medication.id, new Map<number, Array<CodeableConcept>>());
    }

    if (!state.formMap.get(medication.id).get(nDosage)) {
      state.formMap.get(medication.id).set(nDosage, new Array<CodeableConcept>());
    }
    else {
      state.formMap.get(medication.id).get(nDosage).length = 0;
    }

    medicationKnowledge.ingredient.forEach(ingredient => {
      if (!state.strengthMap.get(ingredient.itemCodeableConcept.text)) {
        state.strengthMap.set(ingredient.itemCodeableConcept.text, new Map<number, Array<Ratio>>());
      }

      if (!state.strengthMap.get(ingredient.itemCodeableConcept.text).get(nDosage)) {
        state.strengthMap.get(ingredient.itemCodeableConcept.text).set(nDosage, new Array<Ratio>());
      }
      else {
        state.strengthMap.get(ingredient.itemCodeableConcept.text).get(nDosage).length = 0;
      }
    });

    if (!state.doseAndRateUnitMap.get(medication.id)) {
      state.doseAndRateUnitMap.set(medication.id, new Map<number, Array<Coding>>());
    }

    if (!state.doseAndRateUnitMap.get(medication.id).get(nDosage)) {
      state.doseAndRateUnitMap.get(medication.id).set(nDosage, new Array<Coding>());
    }
    else {
      state.doseAndRateUnitMap.get(medication.id).get(nDosage).length = 0;
    }

    if (!state.routeMap.get(nDosage)) {
      state.routeMap.set(nDosage, new Array<CodeableConcept>());
    }
    else {
      state.routeMap.get(nDosage).length = 0;
    }
  }

  public removeList(state: MedicationRequestFormState, nDosage: number): void {
    const medication = state.medication;

    if (state.formMap.get(medication.id).get(nDosage)) {
      state.formMap.get(medication.id).delete(nDosage);
    }

    for (const ingredient of medication.ingredient) {
      if (ingredient.itemCodeableConcept) {
        state.strengthMap.get(ingredient.itemCodeableConcept.text).delete(nDosage);
      }
    }

    if (state.doseAndRateUnitMap.get(medication.id).get(nDosage)) {
      state.doseAndRateUnitMap.get(medication.id).delete(nDosage);
    }

    if (state.routeMap.get(nDosage)) {
      state.routeMap.delete(nDosage);
    }
  }

  public searchMedicationKnowledge(value: string, option: string): Observable<any> {
    if (option === 'sp') {
      return this._cioDcSource.searchMedicationKnowledgeUCD(value);
    }
    return this._cioDcSource.searchMedicationKnowledgeDC(value);
  }

  private handlerIntent(): void {
    this._intents$
      .pipe(
        map(intent => this.intentToAction(intent)),
        map(action => action.execute()),
        map(partialState => this._reducer.reduce(this._state$.value as MedicationRequestFormState, partialState))
      )
      .subscribe({
        next: state => this.emitState(state as MedicationRequestFormState),
        error: err => console.error('error', err)
      });
  }

  private intentToAction(intent: IIntent): IAction {
    let action: IAction;
    switch (intent.type) {
      case 'AddMedication':
        action = new MedicationFormActionAddMedication(
          (intent as MedicationFormIntentAddMedication).medicationRequest,
          (intent as MedicationFormIntentAddMedication).medicationKnowledge,
          (intent as MedicationFormIntentAddMedication).medicationId,
          (intent as MedicationFormIntentAddMedication).patient,
          (intent as MedicationFormIntentAddMedication).practitioner
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
          (intent as MedicationFormIntentValueChangesMedicationForm).medicationRequest,
          (intent as MedicationFormIntentValueChangesMedicationForm).medication,
          (intent as MedicationFormIntentValueChangesMedicationForm).formValue
        );
        break;
      case 'ValueChangesMedicationIngredientStrength':
        action = new MedicationFormActionValueChangesMedicationIngredientStrength(
          (intent as MedicationFormIntentValueChangesMedicationIngredientStrength).medicationRequest,
          (intent as MedicationFormIntentValueChangesMedicationIngredientStrength).medication,
          (intent as MedicationFormIntentValueChangesMedicationIngredientStrength).itemCodeableConcept,
          (intent as MedicationFormIntentValueChangesMedicationIngredientStrength).strengthValue
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
      case 'AddDosageInstruction':
        action = new MedicationFormActionAddDosageInstruction(
          (intent as MedicationFormIntentAddDosageInstruction).medicationRequest
        );
        break;
      case 'RemoveDosageInstruction':
        action = new MedicationFormActionRemoveDosageInstruction(
          (intent as MedicationFormIntentRemoveDosageInstruction).medicationRequest,
          (intent as MedicationFormIntentRemoveDosageInstruction).nDosage
        );
        break;
      case 'ValueChangesDosageInstructionRoute':
        action = new MedicationFormActionValueChangesDosageInstructionRoute(
          (intent as MedicationFormIntentValueChangesDosageInstructionRoute).medicationRequest,
          (intent as MedicationFormIntentValueChangesDosageInstructionRoute).nDosage,
          (intent as MedicationFormIntentValueChangesDosageInstructionRoute).routeValue,
          (intent as MedicationFormIntentValueChangesDosageInstructionRoute).medication
        );
        break;
      case 'ValueChangesDosageInstructionBoundsDurationValue':
        action = new MedicationFormActionValueChangesDosageInstructionBoundsDurationValue(
          (intent as MedicationFormIntentValueChangesDosageInstructionBoundsDurationValue).medicationRequest,
          (intent as MedicationFormIntentValueChangesDosageInstructionBoundsDurationValue).nDosage,
          (intent as MedicationFormIntentValueChangesDosageInstructionBoundsDurationValue).boundsDurationValue
        );
        break;
      case 'ValueChangesDosageInstructionBoundsDurationUnit':
        action = new MedicationFormActionValueChangesDosageInstructionBoundsDurationUnit(
          (intent as MedicationFormIntentValueChangesDosageInstructionBoundsDurationUnit).medicationRequest,
          (intent as MedicationFormIntentValueChangesDosageInstructionBoundsDurationUnit).nDosage,
          (intent as MedicationFormIntentValueChangesDosageInstructionBoundsDurationUnit).boundsDurationUnit
        );
        break;
      case 'ValueChangesDosageInstructionBoundsPeriodStart':
        action = new MedicationFormActionValueChangesDosageInstructionBoundsPeriodStart(
          (intent as MedicationFormIntentValueChangesDosageInstructionBoundsPeriodStart).medicationRequest,
          (intent as MedicationFormIntentValueChangesDosageInstructionBoundsPeriodStart).nDosage,
          (intent as MedicationFormIntentValueChangesDosageInstructionBoundsPeriodStart).boundsPeriodStart
        );
        break;
      case 'ValueChangesDosageInstructionBoundsPeriodEnd':
        action = new MedicationFormActionValueChangesDosageInstructionBoundsPeriodEnd(
          (intent as MedicationFormIntentValueChangesDosageInstructionBoundsPeriodEnd).medicationRequest,
          (intent as MedicationFormIntentValueChangesDosageInstructionBoundsPeriodEnd).nDosage,
          (intent as MedicationFormIntentValueChangesDosageInstructionBoundsPeriodEnd).boundsPeriodEnd
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
          (intent as MedicationFormIntentRemoveTimeOfDay).medicationRequest,
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
          (intent as MedicationFormIntentRemoveDoseAndRate).medicationRequest,
          (intent as MedicationFormIntentRemoveDoseAndRate).nDosage,
          (intent as MedicationFormIntentRemoveDoseAndRate).index
        );
        break;
      case 'ValueChangesDispenseRequest':
        action = new MedicationFormActionValueChangesDispenseRequest(
          (intent as MedicationFormIntentValueChangesDispenseRequest).medicationRequest,
          (intent as MedicationFormIntentValueChangesDispenseRequest).medicationDispense
        );
        break;
      case 'AddMedicationRequest':
        action = new MedicationFormActionAddMedicationRequest(
          (intent as MedicationFormIntentAddMedicationRequest).medicationRequest
        );
        break;
      case 'CdsHelp':
        action = new MedicationFormActionCdsHelp(
          (intent as MedicationFormIntentCdsHelp).medicationRequest
        );
        break;
      case 'ValueChangesTreatmentIntent':
        action = new MedicationFormActionValueChangesTreatmentIntent(
          (intent as MedicationFormIntentValueChangesTreatmentIntent).medicationRequest,
          (intent as MedicationFormIntentValueChangesTreatmentIntent).treatmentIntent
        );
        break;
      default:
        console.log('cannot find an action for this intent: ', intent);
        break;
    }
    return action;
  }

  private emitState(newSate: MedicationRequestFormState): void {
    this._state$.next(newSate);
  }

  private addUniqueCodeableConcept(uniqueCodeableConceptArray: Array<CodeableConcept>, parameter: ParametersParameter): void {
    let valueCodeableConceptHash = null;
    if (parameter.valueCodeableConcept !== undefined) {
      valueCodeableConceptHash = hash(parameter?.valueCodeableConcept);
    }
    else if (parameter.valueCoding !== undefined) {
      valueCodeableConceptHash = hash({
        text: parameter?.valueCoding?.display,
        coding: new Array<Coding>(parameter?.valueCoding)
      });
    }

    let isExist = false;
    uniqueCodeableConceptArray.forEach(value => {
      const refHash = hash(value);
      if (valueCodeableConceptHash === refHash) {
        isExist = true;
        return;
      }
    });
    if (!isExist) {
      if (parameter.valueCodeableConcept !== undefined) {
        uniqueCodeableConceptArray.push(parameter.valueCodeableConcept);
      }
      else if (parameter.valueCoding !== undefined) {
        uniqueCodeableConceptArray.push({
          text: parameter?.valueCoding?.display,
          coding: new Array<Coding>(parameter?.valueCoding)
        });
      }
    }
  }

  private addUniqueCoding(uniqueCodingArray: Array<Coding>, parameter: ParametersParameter): void {
    const valueHash = hash(parameter?.valueCoding);
    let isExist = false;
    uniqueCodingArray.forEach(value => {
      const refHash = hash(value);
      if (valueHash === refHash) {
        isExist = true;
        return;
      }
    });
    if (!isExist) {
      uniqueCodingArray.push(parameter?.valueCoding);
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
        return;
      }
    });
    if (!isExist) {
      uniqueRatioArray.push(valueRatio);
    }
  }
}
