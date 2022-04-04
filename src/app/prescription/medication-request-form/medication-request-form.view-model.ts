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

import { Injectable } from '@angular/core';
import {BehaviorSubject, forkJoin, Observable, Subject, switchMap} from 'rxjs';
import {filter, map, retry} from 'rxjs/operators';

import * as hash from 'object-hash';
import {
  Bundle,
  CodeableConcept, Coding,
  id, Medication,
  MedicationKnowledge, MedicationRequest, OperationOutcome,
  Parameters, ParametersParameter, Quantity,
  Ratio,
  ValueSet, ValueSetContains
} from 'phast-fhir-ts';

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
  MedicationFormIntentValueChangesTreatmentIntent,
  MedicationFormIntentValueChangesDosageInstructionDayOfWeek,
  MedicationFormIntentValueChangesDosageInstructionPeriodUnit,
  MedicationFormIntentValueChangesDosageInstructionPeriodValue,
  MedicationFormIntentValueChangesDosageInstructionFrequencyValue,
  MedicationFormIntentValueChangesDosageInstructionWhenValue,
  MedicationFormIntentAddWhen,
  MedicationFormIntentRemoveWhen,
  MedicationFormIntentValueChangesDosageInstructionOffsetValue,
  MedicationFormIntentValueChangesDosageInstructionRateQuantityValue,
  MedicationFormIntentValueChangesDosageInstructionRateQuantityUnit,
  MedicationFormIntentValueChangesDosageInstructionRateRatioNumeratorValue,
  MedicationFormIntentValueChangesDosageInstructionRateRatioNumeratorUnit,
  MedicationFormIntentValueChangesDosageInstructionRateRatioDenominatorValue,
  MedicationFormIntentValueChangesDosageInstructionRateRatioDenominatorUnit, MedicationFormIntentValueChangesMedicationAmount
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
  MedicationFormActionValueChangesTreatmentIntent,
  MedicationFormActionValueChangesDosageInstructionDayOfWeek,
  MedicationFormActionValueChangesDosageInstructionPeriodValue,
  MedicationFormActionValueChangesDosageInstructionPeriodUnit,
  MedicationFormActionValueChangesDosageInstructionFrequencyValue,
  MedicationFormActionValueChangesDosageInstructionWhenValue,
  MedicationFormActionAddWhen,
  MedicationFormActionRemoveWhen,
  MedicationFormActionValueChangesDosageInstructionOffsetValue,
  MedicationFormActionValueChangesDosageInstructionRateQuantityValue,
  MedicationFormActionValueChangesDosageInstructionRateQuantityUnit,
  MedicationFormActionValueChangesDosageInstructionRateRatioNumeratorValue,
  MedicationFormActionValueChangesDosageInstructionRateRatioNumeratorUnit,
  MedicationFormActionValueChangesDosageInstructionRateRatioDenominatorValue,
  MedicationFormActionValueChangesDosageInstructionRateRatioDenominatorUnit, MedicationFormActionValueChangesMedicationAmount
} from './medication-request-form.action';
import {FhirTypeGuard} from '../../common/fhir/utils/fhir.type.guard';

@Injectable()
export class MedicationRequestFormViewModel implements IViewModel<IIntent, MedicationRequestFormState>{

  private readonly _state$: BehaviorSubject<MedicationRequestFormState>;

  private readonly _intents$: Subject<IIntent>;

  private readonly _reducer: MedicationRequestFormReducer;

  constructor(private _cioDcSource: PhastCioDcService,
              private _tioSource: PhastTioService) {
    this._intents$ = new Subject<IIntent>();
    this._state$ = new BehaviorSubject<MedicationRequestFormState>(new MedicationRequestFormState('init'));
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

  public get bundle(): Bundle | undefined {
    if (this._state$.value) {
      const state = this._state$.value;
      return state.bundle;
    }
    return undefined;
  }

  public get amountMap(): Map<string, Array<Quantity>> | undefined {
    if (this._state$.value) {
      const state = this._state$.value;
      return state.amountMap;
    }
    return undefined;
  }

  public get formMap(): Map<id, Array<CodeableConcept>> | undefined {
    if (this._state$.value) {
      const state = this._state$.value;
      return state.formMap;
    }
    return undefined;
  }

  public get strengthMap(): Map<string, Array<Ratio>> | undefined {
    if (this._state$.value) {
      const state = this._state$.value;
      return state.strengthMap;
    }
    return undefined;
  }

  public get doseUnitMap(): Map<number, Array<Coding>> | undefined {
    if (this._state$.value) {
      const state = this._state$.value;
      return state.doseUnitMap;
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

  public get whenArray(): Array<ValueSetContains> | undefined {
    if (this._state$.value) {
      const state = this._state$.value;
      return state.whenArray;
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
      || state.treatmentIntent.length === 0
      || state.whenArray.length === 0) {
      state.loadingTIOList = true;
      const tioObservable = [
        this._tioSource.valueSet$expand('http://hl7.org/fhir/ValueSet/units-of-time'),
        this._tioSource.valueSet$expand('http://interopsante.org/fhir/ValueSet/fr-treatment-intent'),
        this._tioSource.valueSet$expand('http://hl7.org/fhir/ValueSet/event-timing')
      ];

      forkJoin(tioObservable)
        .pipe(
            map(value => value as ValueSet[])
        )
        .subscribe({
          next: (valueSets: ValueSet[]) => valueSets.forEach((valueSet: ValueSet) => {
            if (valueSet.name === 'UCUMCodesForTime') {
              valueSet.expansion?.contains?.forEach(
                valueSetContains => state.durationUnitArray.push(valueSetContains));
            }
            else if (valueSet.name === 'FrTreatmentIntent') {
              valueSet.expansion?.contains?.forEach(
                valueSetContains => state.treatmentIntent.push(valueSetContains));
            }
            else if (valueSet.name === 'EventTiming') {
              valueSet.expansion?.contains?.forEach(
                valueSetContains => state.whenArray.push(valueSetContains));
            }
            else {
              console.error('error:', `this ${valueSet.id} valueset is not supported`);
            }
          }),
          error: err => console.error('error', err),
          complete: () => state.loadingTIOList = false
        });
    }

    this._cioDcSource.postMedicationKnowledgeLookup(state.bundle)
        .pipe(
            retry({count: 3, delay: 1000})
        )
        .subscribe({
          next: parameters => this.buildList(state, parameters),
          error: err => console.error('error', err),
          complete: () => state.loadingCIOList = false
        });
  }

  public clearList(state: MedicationRequestFormState): void {
    const medications = state.bundle?.entry?.filter(entry => FhirTypeGuard.isMedication(entry.resource))
        .map(entry => entry.resource as Medication);
    medications?.forEach(medication => {
      if (medication.code) {
        const medicationKey = hash(medication.code);
        state.amountMapClear(medicationKey);
        state.formMapClear(medicationKey);
      }
      if (medication.ingredient) {
        state.strengthMapClear(medication.ingredient);
      }
    });
    const medicationRequest = state.bundle?.entry?.filter(entry => FhirTypeGuard.isMedicationRequest(entry.resource))
        .map(entry => entry.resource as MedicationRequest)
        .reduce((_, current) => current);
    medicationRequest?.dosageInstruction?.forEach((_, nDosage) => {
      state.doseUnitMapClear(nDosage);
      state.routeMapClear(nDosage);
    });
  }

  public buildList(state: MedicationRequestFormState, parameters: Parameters): void {
    if (parameters.parameter) {
      parameters.parameter.forEach(parameter => {
        let nDosage = -1;
        parameter.part?.forEach((item: ParametersParameter) => {
          switch (item.name) {
            case 'identifier':
              nDosage++;
              break;
            case 'medication':
              let code: CodeableConcept | undefined;
              item.part?.forEach(item2 => {
                switch (item2.name) {
                  case 'code':
                    code = item2.valueCodeableConcept;
                    break;
                  case 'amount':
                    if (code && item2.valueQuantity) {
                      state.amountMapAddRatio(hash(code), item2.valueQuantity);
                    }
                    break;
                  case 'intendedRoute':
                    if (item2.valueCodeableConcept) {
                      state.routeMapAddCodeableConcept(nDosage, item2.valueCodeableConcept);
                    }
                    break;
                  case 'doseForm':
                    if (code && item2.valueCodeableConcept) {
                      state.formMapAddCodeableConcept(hash(code), item2.valueCodeableConcept);
                    }
                    break;
                  case 'unite':
                    if (item2.valueCoding) {
                      state.doseUnitMapAddCoding(nDosage, item2.valueCoding);
                    }
                    break;
                  case 'Composition':
                    item2.part?.forEach(item3 => {
                      switch (item3.name) {
                        case 'ingredient':
                          if (item3.part
                              && item3.part[0] && item3.part[0].valueRatio
                              && item3.part[1] && item3.part[1].valueCodeableConcept) {
                            state.strengthMapAddRatio(
                                hash(item3.part[1].valueCodeableConcept),
                                item3.part[0].valueRatio
                            );
                          }
                          break;
                      }
                    });
                    break;
                }
              });
              break;
            default:
              console.log('not supported item', item);
              break;
          }
        });
      });
    }
  }

  public addList(state: MedicationRequestFormState, nDosage: number): void {
    const medications = state.bundle?.entry?.filter(entry => FhirTypeGuard.isMedication(entry.resource))
        .map(entry => entry.resource as Medication);
    medications?.forEach(medication => {
      if (medication.code) {
        const medicationKey = hash(medication.code);
        state.amountMapAdd(medicationKey);
        state.formMapAdd(medicationKey);
        const medicationKnowledge = state.medicationKnowledgeMap.get(medicationKey);
        if (medicationKnowledge?.ingredient) {
          state.strengthMapAdd(medicationKnowledge.ingredient);
        }
      }
    });
    state.routeMapAdd(nDosage);
  }

  public removeList(state: MedicationRequestFormState, nDosage: number): void {
    const medications = state.bundle?.entry?.filter(entry => FhirTypeGuard.isMedication(entry.resource))
        .map(entry => entry.resource as Medication);
    medications?.forEach(medication => {
      if (medication.code) {
        const medicationKey = hash(medication.code);
        state.amountMapRemove(medicationKey);
        state.formMapMapRemove(medicationKey);

        if (medication?.ingredient) {
          state.strengthMapRemove(medication.ingredient);
        }
      }
    });
    state.routeMapRemove(nDosage);
  }

  public searchMedicationKnowledge(value: string, option: string): Observable<OperationOutcome | Bundle & { type: 'searchset' }> {
    if (option === 'sp') {
      return this._cioDcSource.searchMedicationKnowledgeUCD(value);
    }
    return this._cioDcSource.searchMedicationKnowledgeDC(value);
  }

  private handlerIntent(): void {
    this._intents$
        .pipe(
            map(intent => this.intentToAction(intent)),
            filter(action => !!action),
            map(action => action as IAction),
            switchMap(action => action.execute()),
            map(partialState => this._reducer.reduce(this._state$.value as MedicationRequestFormState, partialState))
        )
        .subscribe({
          next: state => this.emitState(state as MedicationRequestFormState),
          error: err => console.error('error', err)
        });
  }

  private intentToAction(intent: IIntent): IAction | undefined {
    let action: IAction | undefined;
    switch (intent.type) {
      case 'AddMedication':
        action = new MedicationFormActionAddMedication(
          (intent as MedicationFormIntentAddMedication).bundle,
          (intent as MedicationFormIntentAddMedication).medicationKnowledge,
          (intent as MedicationFormIntentAddMedication).medicationId,
          (intent as MedicationFormIntentAddMedication).patient,
          (intent as MedicationFormIntentAddMedication).practitioner
        );
        break;
      case 'RemoveMedication':
        action = new MedicationFormActionRemoveMedication(
          (intent as MedicationFormIntentRemoveMedication).bundle,
          (intent as MedicationFormIntentRemoveMedication).nMedication
        );
        break;
      case 'ValueChangesMedicationAmount':
        action = new MedicationFormActionValueChangesMedicationAmount(
          (intent as MedicationFormIntentValueChangesMedicationAmount).bundle,
          (intent as MedicationFormIntentValueChangesMedicationAmount).medication,
          (intent as MedicationFormIntentValueChangesMedicationAmount).amountValue
        );
        break;
      case 'ValueChangesMedicationForm':
        action = new MedicationFormActionValueChangesMedicationForm(
          (intent as MedicationFormIntentValueChangesMedicationForm).bundle,
          (intent as MedicationFormIntentValueChangesMedicationForm).medication,
          (intent as MedicationFormIntentValueChangesMedicationForm).formValue
        );
        break;
      case 'ValueChangesMedicationIngredientStrength':
        action = new MedicationFormActionValueChangesMedicationIngredientStrength(
          (intent as MedicationFormIntentValueChangesMedicationIngredientStrength).bundle,
          (intent as MedicationFormIntentValueChangesMedicationIngredientStrength).medication,
          (intent as MedicationFormIntentValueChangesMedicationIngredientStrength).itemCodeableConcept,
          (intent as MedicationFormIntentValueChangesMedicationIngredientStrength).strengthValue
        );
        break;
      case 'ValueChangesMedicationIngredientStrengthValue':
        action = new MedicationFormActionValueChangesMedicationIngredientStrengthValue(
          (intent as MedicationFormIntentValueChangesMedicationIngredientStrengthValue).bundle,
          (intent as MedicationFormIntentValueChangesMedicationIngredientStrengthValue).medication,
          (intent as MedicationFormIntentValueChangesMedicationIngredientStrengthValue).itemReference,
          (intent as MedicationFormIntentValueChangesMedicationIngredientStrengthValue).strengthValue
        );
        break;
      case 'ValueChangesMedicationIngredientStrengthUnit':
        action = new MedicationFormActionValueChangesMedicationIngredientStrengthUnit(
          (intent as MedicationFormIntentValueChangesMedicationIngredientStrengthUnit).bundle,
          (intent as MedicationFormIntentValueChangesMedicationIngredientStrengthUnit).medication,
          (intent as MedicationFormIntentValueChangesMedicationIngredientStrengthUnit).itemReference,
          (intent as MedicationFormIntentValueChangesMedicationIngredientStrengthUnit).strengthUnit
        );
        break;
      case 'AddDosageInstruction':
        action = new MedicationFormActionAddDosageInstruction(
          (intent as MedicationFormIntentAddDosageInstruction).bundle
        );
        break;
      case 'RemoveDosageInstruction':
        action = new MedicationFormActionRemoveDosageInstruction(
          (intent as MedicationFormIntentRemoveDosageInstruction).bundle,
          (intent as MedicationFormIntentRemoveDosageInstruction).nDosage
        );
        break;
      case 'ValueChangesDosageInstructionRoute':
        action = new MedicationFormActionValueChangesDosageInstructionRoute(
          (intent as MedicationFormIntentValueChangesDosageInstructionRoute).bundle,
          (intent as MedicationFormIntentValueChangesDosageInstructionRoute).nDosage,
          (intent as MedicationFormIntentValueChangesDosageInstructionRoute).routeValue
        );
        break;
      case 'ValueChangesDosageInstructionBoundsDurationValue':
        action = new MedicationFormActionValueChangesDosageInstructionBoundsDurationValue(
          (intent as MedicationFormIntentValueChangesDosageInstructionBoundsDurationValue).bundle,
          (intent as MedicationFormIntentValueChangesDosageInstructionBoundsDurationValue).nDosage,
          (intent as MedicationFormIntentValueChangesDosageInstructionBoundsDurationValue).boundsDurationValue
        );
        break;
      case 'ValueChangesDosageInstructionBoundsDurationUnit':
        action = new MedicationFormActionValueChangesDosageInstructionBoundsDurationUnit(
          (intent as MedicationFormIntentValueChangesDosageInstructionBoundsDurationUnit).bundle,
          (intent as MedicationFormIntentValueChangesDosageInstructionBoundsDurationUnit).nDosage,
          (intent as MedicationFormIntentValueChangesDosageInstructionBoundsDurationUnit).boundsDurationUnit
        );
        break;
      case 'ValueChangesDosageInstructionBoundsPeriodStart':
        action = new MedicationFormActionValueChangesDosageInstructionBoundsPeriodStart(
          (intent as MedicationFormIntentValueChangesDosageInstructionBoundsPeriodStart).bundle,
          (intent as MedicationFormIntentValueChangesDosageInstructionBoundsPeriodStart).nDosage,
          (intent as MedicationFormIntentValueChangesDosageInstructionBoundsPeriodStart).boundsPeriodStart
        );
        break;
      case 'ValueChangesDosageInstructionBoundsPeriodEnd':
        action = new MedicationFormActionValueChangesDosageInstructionBoundsPeriodEnd(
          (intent as MedicationFormIntentValueChangesDosageInstructionBoundsPeriodEnd).bundle,
          (intent as MedicationFormIntentValueChangesDosageInstructionBoundsPeriodEnd).nDosage,
          (intent as MedicationFormIntentValueChangesDosageInstructionBoundsPeriodEnd).boundsPeriodEnd
        );
        break;
      case 'ValueChangesDosageInstructionDurationValue':
        action = new MedicationFormActionValueChangesDosageInstructionDurationValue(
          (intent as MedicationFormIntentValueChangesDosageInstructionDurationValue).bundle,
          (intent as MedicationFormIntentValueChangesDosageInstructionDurationValue).nDosage,
          (intent as MedicationFormIntentValueChangesDosageInstructionDurationValue).durationValue
        );
        break;
      case 'ValueChangesDosageInstructionDurationUnit':
        action = new MedicationFormActionValueChangesDosageInstructionDurationUnit(
          (intent as MedicationFormIntentValueChangesDosageInstructionDurationUnit).bundle,
          (intent as MedicationFormIntentValueChangesDosageInstructionDurationUnit).nDosage,
          (intent as MedicationFormIntentValueChangesDosageInstructionDurationUnit).durationUnit
        );
        break;
      case 'ValueChangesDosageInstructionFrequencyValue':
        action = new MedicationFormActionValueChangesDosageInstructionFrequencyValue(
          (intent as MedicationFormIntentValueChangesDosageInstructionFrequencyValue).bundle,
          (intent as MedicationFormIntentValueChangesDosageInstructionFrequencyValue).nDosage,
          (intent as MedicationFormIntentValueChangesDosageInstructionFrequencyValue).frequencyValue
        );
        break;
      case 'ValueChangesDosageInstructionPeriodValue':
        action = new MedicationFormActionValueChangesDosageInstructionPeriodValue(
          (intent as MedicationFormIntentValueChangesDosageInstructionPeriodValue).bundle,
          (intent as MedicationFormIntentValueChangesDosageInstructionPeriodValue).nDosage,
          (intent as MedicationFormIntentValueChangesDosageInstructionPeriodValue).periodValue
        );
        break;
      case 'ValueChangesDosageInstructionPeriodUnit':
        action = new MedicationFormActionValueChangesDosageInstructionPeriodUnit(
          (intent as MedicationFormIntentValueChangesDosageInstructionPeriodUnit).bundle,
          (intent as MedicationFormIntentValueChangesDosageInstructionPeriodUnit).nDosage,
          (intent as MedicationFormIntentValueChangesDosageInstructionPeriodUnit).periodUnit
        );
        break;
      case 'ValueChangesDosageInstructionTimeOfDayValue':
        action = new MedicationFormActionValueChangesDosageInstructionTimeOfDayValue(
          (intent as MedicationFormIntentValueChangesDosageInstructionTimeOfDayValue).bundle,
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
          (intent as MedicationFormIntentRemoveTimeOfDay).bundle,
          (intent as MedicationFormIntentRemoveTimeOfDay).nDosage,
          (intent as MedicationFormIntentRemoveTimeOfDay).index
        );
        break;
      case 'ValueChangesDosageInstructionDayOfWeekValue':
        action = new MedicationFormActionValueChangesDosageInstructionDayOfWeek(
          (intent as MedicationFormIntentValueChangesDosageInstructionDayOfWeek).bundle,
          (intent as MedicationFormIntentValueChangesDosageInstructionDayOfWeek).nDosage,
          (intent as MedicationFormIntentValueChangesDosageInstructionDayOfWeek).dayOfWeek
        );
        break;
      case 'ValueChangesDosageInstructionWhenValue':
        action = new MedicationFormActionValueChangesDosageInstructionWhenValue(
          (intent as MedicationFormIntentValueChangesDosageInstructionWhenValue).bundle,
          (intent as MedicationFormIntentValueChangesDosageInstructionWhenValue).nDosage,
          (intent as MedicationFormIntentValueChangesDosageInstructionWhenValue).nWhen,
          (intent as MedicationFormIntentValueChangesDosageInstructionWhenValue).whenValue
        );
        break;
      case 'AddWhen':
        action = new MedicationFormActionAddWhen(
          (intent as MedicationFormIntentAddWhen).nDosage
        );
        break;
      case 'RemoveWhen':
        action = new MedicationFormActionRemoveWhen(
          (intent as MedicationFormIntentRemoveWhen).bundle,
          (intent as MedicationFormIntentRemoveWhen).nDosage,
          (intent as MedicationFormIntentRemoveWhen).nWhen
        );
        break;
      case 'ValueChangesDosageInstructionOffsetValue':
        action = new MedicationFormActionValueChangesDosageInstructionOffsetValue(
          (intent as MedicationFormIntentValueChangesDosageInstructionOffsetValue).bundle,
          (intent as MedicationFormIntentValueChangesDosageInstructionOffsetValue).nDosage,
          (intent as MedicationFormIntentValueChangesDosageInstructionOffsetValue).offsetValue
        );
        break;
      case 'AddDoseAndRate':
        action = new MedicationFormActionAddDoseAndRate(
          (intent as MedicationFormIntentAddDoseAndRate).nDosage
        );
        break;
      case 'RemoveDoseAndRate':
        action = new MedicationFormActionRemoveDoseAndRate(
          (intent as MedicationFormIntentRemoveDoseAndRate).bundle,
          (intent as MedicationFormIntentRemoveDoseAndRate).nDosage,
          (intent as MedicationFormIntentRemoveDoseAndRate).index
        );
        break;
      case 'ValueChangesDosageInstructionDoseQuantityValue':
        action = new MedicationFormActionValueChangesDosageInstructionDoseQuantityValue(
          (intent as MedicationFormIntentValueChangesDosageInstructionDoseQuantityValue).bundle,
          (intent as MedicationFormIntentValueChangesDosageInstructionDoseQuantityValue).nDosage,
          (intent as MedicationFormIntentValueChangesDosageInstructionDoseQuantityValue).doseQuantityValue
        );
        break;
      case 'ValueChangesDosageInstructionDoseQuantityUnit':
        action = new MedicationFormActionValueChangesDosageInstructionDoseQuantityUnit(
          (intent as MedicationFormIntentValueChangesDosageInstructionDoseQuantityUnit).bundle,
          (intent as MedicationFormIntentValueChangesDosageInstructionDoseQuantityUnit).nDosage,
          (intent as MedicationFormIntentValueChangesDosageInstructionDoseQuantityUnit).doseQuantityUnit
        );
        break;
      case 'ValueChangesDosageInstructionRateRatioNumeratorValue':
        action = new MedicationFormActionValueChangesDosageInstructionRateRatioNumeratorValue(
          (intent as MedicationFormIntentValueChangesDosageInstructionRateRatioNumeratorValue).bundle,
          (intent as MedicationFormIntentValueChangesDosageInstructionRateRatioNumeratorValue).nDosage,
          (intent as MedicationFormIntentValueChangesDosageInstructionRateRatioNumeratorValue).rateRatioNumeratorValue
        );
        break;
      case 'ValueChangesDosageInstructionRateRatioNumeratorUnit':
        action = new MedicationFormActionValueChangesDosageInstructionRateRatioNumeratorUnit(
          (intent as MedicationFormIntentValueChangesDosageInstructionRateRatioNumeratorUnit).bundle,
          (intent as MedicationFormIntentValueChangesDosageInstructionRateRatioNumeratorUnit).nDosage,
          (intent as MedicationFormIntentValueChangesDosageInstructionRateRatioNumeratorUnit).rateRatioNumeratorUnit
        );
        break;
      case 'ValueChangesDosageInstructionRateRatioDenominatorValue':
        action = new MedicationFormActionValueChangesDosageInstructionRateRatioDenominatorValue(
          (intent as MedicationFormIntentValueChangesDosageInstructionRateRatioDenominatorValue).bundle,
          (intent as MedicationFormIntentValueChangesDosageInstructionRateRatioDenominatorValue).nDosage,
          (intent as MedicationFormIntentValueChangesDosageInstructionRateRatioDenominatorValue).rateRatioDenominatorValue
        );
        break;
      case 'ValueChangesDosageInstructionRateRatioDenominatorUnit':
        action = new MedicationFormActionValueChangesDosageInstructionRateRatioDenominatorUnit(
          (intent as MedicationFormIntentValueChangesDosageInstructionRateRatioDenominatorUnit).bundle,
          (intent as MedicationFormIntentValueChangesDosageInstructionRateRatioDenominatorUnit).nDosage,
          (intent as MedicationFormIntentValueChangesDosageInstructionRateRatioDenominatorUnit).rateRatioDenominatorUnit
        );
        break;
      case 'ValueChangesDosageInstructionRateQuantityValue':
        action = new MedicationFormActionValueChangesDosageInstructionRateQuantityValue(
          (intent as MedicationFormIntentValueChangesDosageInstructionRateQuantityValue).bundle,
          (intent as MedicationFormIntentValueChangesDosageInstructionRateQuantityValue).nDosage,
          (intent as MedicationFormIntentValueChangesDosageInstructionRateQuantityValue).nDoseAndRate,
          (intent as MedicationFormIntentValueChangesDosageInstructionRateQuantityValue).rateQuantityValue
        );
        break;
      case 'ValueChangesDosageInstructionRateQuantityUnit':
        action = new MedicationFormActionValueChangesDosageInstructionRateQuantityUnit(
          (intent as MedicationFormIntentValueChangesDosageInstructionRateQuantityUnit).bundle,
          (intent as MedicationFormIntentValueChangesDosageInstructionRateQuantityUnit).nDosage,
          (intent as MedicationFormIntentValueChangesDosageInstructionRateQuantityUnit).nDoseAndRate,
          (intent as MedicationFormIntentValueChangesDosageInstructionRateQuantityUnit).rateQuantityUnit
        );
        break;
      case 'ValueChangesDispenseRequest':
        action = new MedicationFormActionValueChangesDispenseRequest(
          (intent as MedicationFormIntentValueChangesDispenseRequest).bundle,
          (intent as MedicationFormIntentValueChangesDispenseRequest).medicationDispense
        );
        break;
      case 'AddMedicationRequest':
        action = new MedicationFormActionAddMedicationRequest(
          (intent as MedicationFormIntentAddMedicationRequest).bundle
        );
        break;
      case 'CdsHelp':
        action = new MedicationFormActionCdsHelp(
          (intent as MedicationFormIntentCdsHelp).bundle
        );
        break;
      case 'ValueChangesTreatmentIntent':
        action = new MedicationFormActionValueChangesTreatmentIntent(
          (intent as MedicationFormIntentValueChangesTreatmentIntent).bundle,
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
}
