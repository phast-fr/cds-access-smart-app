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
  CodeableConcept, Coding, Dosage,
  id,
  Medication, MedicationIngredient,
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

  public get amountMap(): Map<id, Map<number, Array<Quantity>>> | undefined {
    if (this._state$.value) {
      const state = this._state$.value;
      return state.amountMap;
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
            if (valueSet.name === 'UCUMCodesForTime' && valueSet.expansion?.contains) {
              valueSet.expansion.contains.forEach(
                valueSetContains => state.durationUnitArray.push(valueSetContains));
            }
            else if (valueSet.name === 'FrTreatmentIntent' && valueSet.expansion?.contains) {
              valueSet.expansion.contains.forEach(
                valueSetContains => state.treatmentIntent.push(valueSetContains));
            }
            else if (valueSet.name === 'EventTiming' && valueSet.expansion?.contains) {
              valueSet.expansion.contains.forEach(
                valueSetContains => state.whenArray.push(valueSetContains));
            }
          }),
          error: err => console.error('error', err),
          complete: () => state.loadingTIOList = false
        });
    }

    const medication = state.medication;
    if (medication?.id) {
      const medicationId = medication?.id;
      state.loadingCIOList = true;
      const medicationKnowledge = state.medicationKnowledgeMap.get(medication.id);
      if (medicationKnowledge?.id && medicationKnowledge?.code) {
        const medicationKnowledgeId = medicationKnowledge.id;
        const medicationKnowledgeCode = medicationKnowledge.code;
        if (state.medicationRequest?.dosageInstruction) {
          const observables = new Array<Observable<Parameters>>();
          const amount = (medication.amount?.numerator) ? medication.amount.numerator : undefined;
          state.medicationRequest.dosageInstruction.forEach(dosage => {
            let doseQuantity;
            if (dosage?.doseAndRate && dosage?.doseAndRate.length > 0) {
              doseQuantity = dosage.doseAndRate[0]?.doseQuantity;
            }
            observables.push(
              this._cioDcSource.postMedicationKnowledgeLookupByRouteCodeAndFormCodeAndIngredient(
                  medicationKnowledgeId,
                  medicationKnowledgeCode,
                  medication.form,
                  amount,
                  medication.ingredient,
                  dosage?.route,
                  doseQuantity
              )
                .pipe(
                  retry({count: 3, delay: 1000})
                )
            );
          });
          forkJoin(observables)
            .subscribe({
              next: parameters => parameters.forEach((parameter, nDosage) =>
                this.buildList(state, medicationId, nDosage, parameter)),
              error: err => console.error('error', err),
              complete: () => state.loadingCIOList = false
            });
        }
        else {
          this._cioDcSource.postMedicationKnowledgeLookupByRouteCodeAndFormCodeAndIngredient(
            medicationKnowledgeId, medicationKnowledgeCode, medication.form, medication.amount, medication.ingredient
          )
            .pipe(
              retry({count: 3, delay: 1000})
            )
            .subscribe({
              next: parameters => this.buildList(state, medicationId, 0, parameters),
              error: err => console.error('error', err),
              complete: () => state.loadingCIOList = false
            });
        }
      }
    }
  }

  public clearList(state: MedicationRequestFormState): void {
    if (state.medication?.id && state.medicationRequest?.dosageInstruction) {
      const medicationId = state.medication.id;
      state.medicationRequest.dosageInstruction.forEach((dosage: Dosage, nDosage: number) => {
        const amountsForMed = state.amountMap.get(medicationId);
        if (amountsForMed) {
          const amounts = amountsForMed.get(nDosage);
          if (amounts) {
            amounts.length = 0;
          }
        }

        const formForMed = state.formMap.get(medicationId);
        if (formForMed) {
          const forms = formForMed.get(nDosage);
          if (forms) {
            forms.length = 0;
          }
        }

        if (state.medication?.ingredient) {
          state.medication.ingredient.forEach((ingredient: MedicationIngredient) => {
            if (ingredient.itemCodeableConcept?.text) {
              const strengthForIngredient = state.strengthMap.get(ingredient.itemCodeableConcept.text);
              if (strengthForIngredient) {
                const strengths = strengthForIngredient.get(nDosage);
                if (strengths) {
                  strengths.length = 0;
                }
              }
            }
          });
        }

        const doseAndRateUnitForMed = state.doseAndRateUnitMap.get(medicationId);
        if (doseAndRateUnitForMed) {
          const doseAndRateUnit = doseAndRateUnitForMed.get(nDosage);
          if (doseAndRateUnit) {
            doseAndRateUnit.length = 0;
          }
        }

        const routes = state.routeMap.get(nDosage);
        if (routes) {
          routes.length = 0;
        }
      });
    }
    else if (state.medication?.id) {
      const medicationId = state.medication.id;
      const amountsForMed = state.amountMap.get(medicationId);
      if (amountsForMed) {
        const amounts = amountsForMed.get(0);
        if (amounts) {
          amounts.length = 0;
        }
      }

      const formForMed = state.formMap.get(medicationId);
      if (formForMed) {
        const forms = formForMed.get(0);
        if (forms) {
          forms.length = 0;
        }
      }

      if (state.medication?.ingredient) {
        state.medication.ingredient.forEach((ingredient: MedicationIngredient) => {
          if (ingredient.itemCodeableConcept?.text) {
            const strengthForIngredient = state.strengthMap.get(ingredient.itemCodeableConcept.text);
            if (strengthForIngredient) {
              const strengths = strengthForIngredient.get(0);
              if (strengths) {
                strengths.length = 0;
              }
            }
          }
        });
      }

      const doseAndRateUnitForMed = state.doseAndRateUnitMap.get(medicationId);
      if (doseAndRateUnitForMed) {
        const doseAndRateUnit = doseAndRateUnitForMed.get(0);
        if (doseAndRateUnit) {
          doseAndRateUnit.length = 0;
        }
      }

      const routes = state.routeMap.get(0);
      if (routes) {
        routes.length = 0;
      }
    }
  }

  public buildList(state: MedicationRequestFormState, medicationId: id, nDosage: number, parameters: Parameters): void {
    if (parameters.parameter) {
      parameters.parameter.forEach(parameter => {
        switch (parameter.name) {
          case 'amount':
            const amountsForMed = state.amountMap.get(medicationId);
            if (amountsForMed) {
              const amounts = amountsForMed.get(nDosage);
              if (amounts) {
                this.addUniqueQuantity(amounts, parameter);
              }
            }
            break;
          case 'intendedRoute':
            const routes = state.routeMap.get(nDosage);
            if (routes) {
              this.addUniqueCodeableConcept(routes, parameter);
            }
            break;
          case 'doseForm':
            const formsForMed = state.formMap.get(medicationId);
            if (formsForMed) {
              const forms = formsForMed.get(nDosage);
              if (forms) {
                this.addUniqueCodeableConcept(forms, parameter);
              }
            }
            break;
          case 'Composition':
            if (parameter.part) {
              parameter.part.forEach(ingredient => {
                if (ingredient.name === 'ingredient' && ingredient.part) {
                  const strength = ingredient.part[0];
                  const item = ingredient.part[1];
                  if (item.valueCodeableConcept?.text) {
                    const strengthForIngredient = state.strengthMap.get(item.valueCodeableConcept.text);
                    if (strengthForIngredient) {
                      const strengths = strengthForIngredient.get(nDosage);
                      if (strengths) {
                        this.addUniqueRatio(strengths, strength);
                      }
                    }
                  }
                }
              });
            }
            break;
          case 'unite':
            const doseAndRateForMed = state.doseAndRateUnitMap.get(medicationId);
            if (doseAndRateForMed) {
              const doseAndRates = doseAndRateForMed.get(nDosage);
              if (doseAndRates) {
                this.addUniqueCoding(doseAndRates, parameter);
              }
            }
            break;
          default:
            // relatedMedicationKnowledge
            break;
        }
      });
    }
  }

  public addList(state: MedicationRequestFormState, nDosage: number): void {
    if (state.medication?.id) {
      const medicationId = state.medication.id;

      let amountForMed = state.amountMap.get(medicationId);
      if (!amountForMed) {
        amountForMed = new Map<number, Array<Ratio>>();
        state.amountMap.set(medicationId, amountForMed);
      }

      const amounts = amountForMed.get(nDosage);
      if (!amounts) {
        amountForMed.set(nDosage, new Array<Ratio>());
      }
      else {
        amounts.length = 0;
      }

      if (!state.formMap.get(medicationId)) {
        state.formMap.set(medicationId, new Map<number, Array<CodeableConcept>>());
      }

      let formForMed = state.formMap.get(medicationId);
      if (!formForMed) {
        formForMed = new Map<number, Array<CodeableConcept>>();
        state.formMap.set(medicationId, formForMed);
      }

      const forms = formForMed.get(nDosage);
      if (!forms) {
        formForMed.set(nDosage, new Array<CodeableConcept>());
      }
      else {
        forms.length = 0;
      }

      const medicationKnowledge = state.medicationKnowledgeMap.get(medicationId);
      if (medicationKnowledge?.ingredient) {
        medicationKnowledge.ingredient.forEach((ingredient: MedicationIngredient) => {
          if (ingredient.itemCodeableConcept?.text) {
            let strengthForIngredient = state.strengthMap.get(ingredient.itemCodeableConcept.text);
            if (!strengthForIngredient) {
              strengthForIngredient = new Map<number, Array<Ratio>>();
              state.strengthMap.set(ingredient.itemCodeableConcept.text, strengthForIngredient);
            }

            const strengths = strengthForIngredient.get(nDosage);
            if (!strengths) {
              strengthForIngredient.set(nDosage, new Array<Ratio>());
            }
            else {
              strengths.length = 0;
            }
          }
        });
      }

      let doseAndRateUnitForMed = state.doseAndRateUnitMap.get(medicationId);
      if (!doseAndRateUnitForMed) {
        doseAndRateUnitForMed = new Map<number, Array<Coding>>();
        state.doseAndRateUnitMap.set(medicationId, doseAndRateUnitForMed);
      }

      const doseAndRateUnits = doseAndRateUnitForMed.get(nDosage);
      if (!doseAndRateUnits) {
        doseAndRateUnitForMed.set(nDosage, new Array<Coding>());
      }
      else {
        doseAndRateUnits.length = 0;
      }
    }

    if (!state.routeMap.has(nDosage)) {
      state.routeMap.set(nDosage, new Array<CodeableConcept>());
    }
    else {
      const routes = state.routeMap.get(nDosage);
      if (routes) {
        routes.length = 0;
      }
    }
  }

  public removeList(state: MedicationRequestFormState, nDosage: number): void {
    if (state.medication?.id) {
      const medicationId = state.medication.id;

      const amountForMed = state.amountMap.get(medicationId);
      if (amountForMed) {
        if (amountForMed.has(nDosage)) {
          amountForMed.delete(nDosage);
        }
      }

      const formForMed = state.formMap.get(medicationId);
      if (formForMed) {
        if (formForMed.has(nDosage)) {
          formForMed.delete(nDosage);
        }
      }

      if (state.medication?.ingredient) {
        state.medication.ingredient.forEach(ingredient => {
          if (ingredient.itemCodeableConcept?.text) {
            const strengthForMed = state.strengthMap.get(ingredient.itemCodeableConcept.text);
            if (strengthForMed) {
              strengthForMed.delete(nDosage);
            }
          }
        });
      }

      const doseAndRateUnitForMed = state.doseAndRateUnitMap.get(medicationId);
      if (doseAndRateUnitForMed) {
        if (doseAndRateUnitForMed.has(nDosage)) {
          doseAndRateUnitForMed.delete(nDosage);
        }
      }
    }

    if (state.routeMap.get(nDosage)) {
      state.routeMap.delete(nDosage);
    }
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
            map(action => action.execute()),
            switchMap(partialState => this._reducer.reduce(this._state$.value as MedicationRequestFormState, partialState))
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
      case 'ValueChangesMedicationAmount':
        action = new MedicationFormActionValueChangesMedicationAmount(
          (intent as MedicationFormIntentValueChangesMedicationAmount).medicationRequest,
          (intent as MedicationFormIntentValueChangesMedicationAmount).medication,
          (intent as MedicationFormIntentValueChangesMedicationAmount).amountValue
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
      case 'ValueChangesDosageInstructionFrequencyValue':
        action = new MedicationFormActionValueChangesDosageInstructionFrequencyValue(
          (intent as MedicationFormIntentValueChangesDosageInstructionFrequencyValue).medicationRequest,
          (intent as MedicationFormIntentValueChangesDosageInstructionFrequencyValue).nDosage,
          (intent as MedicationFormIntentValueChangesDosageInstructionFrequencyValue).frequencyValue
        );
        break;
      case 'ValueChangesDosageInstructionPeriodValue':
        action = new MedicationFormActionValueChangesDosageInstructionPeriodValue(
          (intent as MedicationFormIntentValueChangesDosageInstructionPeriodValue).medicationRequest,
          (intent as MedicationFormIntentValueChangesDosageInstructionPeriodValue).nDosage,
          (intent as MedicationFormIntentValueChangesDosageInstructionPeriodValue).periodValue
        );
        break;
      case 'ValueChangesDosageInstructionPeriodUnit':
        action = new MedicationFormActionValueChangesDosageInstructionPeriodUnit(
          (intent as MedicationFormIntentValueChangesDosageInstructionPeriodUnit).medicationRequest,
          (intent as MedicationFormIntentValueChangesDosageInstructionPeriodUnit).nDosage,
          (intent as MedicationFormIntentValueChangesDosageInstructionPeriodUnit).periodUnit
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
      case 'ValueChangesDosageInstructionDayOfWeekValue':
        action = new MedicationFormActionValueChangesDosageInstructionDayOfWeek(
          (intent as MedicationFormIntentValueChangesDosageInstructionDayOfWeek).medicationRequest,
          (intent as MedicationFormIntentValueChangesDosageInstructionDayOfWeek).nDosage,
          (intent as MedicationFormIntentValueChangesDosageInstructionDayOfWeek).dayOfWeek
        );
        break;
      case 'ValueChangesDosageInstructionWhenValue':
        action = new MedicationFormActionValueChangesDosageInstructionWhenValue(
          (intent as MedicationFormIntentValueChangesDosageInstructionWhenValue).medicationRequest,
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
          (intent as MedicationFormIntentRemoveWhen).medicationRequest,
          (intent as MedicationFormIntentRemoveWhen).nDosage,
          (intent as MedicationFormIntentRemoveWhen).nWhen
        );
        break;
      case 'ValueChangesDosageInstructionOffsetValue':
        action = new MedicationFormActionValueChangesDosageInstructionOffsetValue(
          (intent as MedicationFormIntentValueChangesDosageInstructionOffsetValue).medicationRequest,
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
          (intent as MedicationFormIntentRemoveDoseAndRate).medicationRequest,
          (intent as MedicationFormIntentRemoveDoseAndRate).nDosage,
          (intent as MedicationFormIntentRemoveDoseAndRate).index
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
      case 'ValueChangesDosageInstructionRateRatioNumeratorValue':
        action = new MedicationFormActionValueChangesDosageInstructionRateRatioNumeratorValue(
          (intent as MedicationFormIntentValueChangesDosageInstructionRateRatioNumeratorValue).medicationRequest,
          (intent as MedicationFormIntentValueChangesDosageInstructionRateRatioNumeratorValue).nDosage,
          (intent as MedicationFormIntentValueChangesDosageInstructionRateRatioNumeratorValue).nDoseAndRate,
          (intent as MedicationFormIntentValueChangesDosageInstructionRateRatioNumeratorValue).rateRatioNumeratorValue
        );
        break;
      case 'ValueChangesDosageInstructionRateRatioNumeratorUnit':
        action = new MedicationFormActionValueChangesDosageInstructionRateRatioNumeratorUnit(
          (intent as MedicationFormIntentValueChangesDosageInstructionRateRatioNumeratorUnit).medicationRequest,
          (intent as MedicationFormIntentValueChangesDosageInstructionRateRatioNumeratorUnit).nDosage,
          (intent as MedicationFormIntentValueChangesDosageInstructionRateRatioNumeratorUnit).nDoseAndRate,
          (intent as MedicationFormIntentValueChangesDosageInstructionRateRatioNumeratorUnit).rateRatioNumeratorUnit
        );
        break;
      case 'ValueChangesDosageInstructionRateRatioDenominatorValue':
        action = new MedicationFormActionValueChangesDosageInstructionRateRatioDenominatorValue(
          (intent as MedicationFormIntentValueChangesDosageInstructionRateRatioDenominatorValue).medicationRequest,
          (intent as MedicationFormIntentValueChangesDosageInstructionRateRatioDenominatorValue).nDosage,
          (intent as MedicationFormIntentValueChangesDosageInstructionRateRatioDenominatorValue).nDoseAndRate,
          (intent as MedicationFormIntentValueChangesDosageInstructionRateRatioDenominatorValue).rateRatioDenominatorValue
        );
        break;
      case 'ValueChangesDosageInstructionRateRatioDenominatorUnit':
        action = new MedicationFormActionValueChangesDosageInstructionRateRatioDenominatorUnit(
          (intent as MedicationFormIntentValueChangesDosageInstructionRateRatioDenominatorUnit).medicationRequest,
          (intent as MedicationFormIntentValueChangesDosageInstructionRateRatioDenominatorUnit).nDosage,
          (intent as MedicationFormIntentValueChangesDosageInstructionRateRatioDenominatorUnit).nDoseAndRate,
          (intent as MedicationFormIntentValueChangesDosageInstructionRateRatioDenominatorUnit).rateRatioDenominatorUnit
        );
        break;
      case 'ValueChangesDosageInstructionRateQuantityValue':
        action = new MedicationFormActionValueChangesDosageInstructionRateQuantityValue(
          (intent as MedicationFormIntentValueChangesDosageInstructionRateQuantityValue).medicationRequest,
          (intent as MedicationFormIntentValueChangesDosageInstructionRateQuantityValue).nDosage,
          (intent as MedicationFormIntentValueChangesDosageInstructionRateQuantityValue).nDoseAndRate,
          (intent as MedicationFormIntentValueChangesDosageInstructionRateQuantityValue).rateQuantityValue
        );
        break;
      case 'ValueChangesDosageInstructionRateQuantityUnit':
        action = new MedicationFormActionValueChangesDosageInstructionRateQuantityUnit(
          (intent as MedicationFormIntentValueChangesDosageInstructionRateQuantityUnit).medicationRequest,
          (intent as MedicationFormIntentValueChangesDosageInstructionRateQuantityUnit).nDosage,
          (intent as MedicationFormIntentValueChangesDosageInstructionRateQuantityUnit).nDoseAndRate,
          (intent as MedicationFormIntentValueChangesDosageInstructionRateQuantityUnit).rateQuantityUnit
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
    if (parameter.valueCodeableConcept) {
      const valueCodeableConcept = parameter.valueCodeableConcept;
      const valueCodeableConceptHash = hash(valueCodeableConcept);
      let isExist = false;
      uniqueCodeableConceptArray.forEach((value: CodeableConcept) => {
        const refHash = hash(value);
        if (valueCodeableConceptHash === refHash) {
          isExist = true;
          return;
        }
      });
      if (!isExist) {
          uniqueCodeableConceptArray.push(valueCodeableConcept);
      }
    }
  }

  private addUniqueCoding(uniqueCodingArray: Array<Coding>, parameter: ParametersParameter): void {
    if (parameter.valueCoding) {
      const valueCoding = parameter.valueCoding;
      const valueHash = hash(valueCoding);
      let isExist = false;
      uniqueCodingArray.forEach((value: Coding) => {
        const refHash = hash(value);
        if (valueHash === refHash) {
          isExist = true;
          return;
        }
      });
      if (!isExist) {
        uniqueCodingArray.push(valueCoding);
      }
    }
  }

  private addUniqueRatio(uniqueRatioArray: Array<Ratio>, parameter: ParametersParameter): void {
    if (parameter.valueRatio) {
      const valueRatio = parameter.valueRatio;
      const valueHash = hash(valueRatio);
      let isExist = false;
      uniqueRatioArray.forEach((value: Ratio) => {
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

  private addUniqueQuantity(uniqueQuantityArray: Array<Quantity>, parameter: ParametersParameter): void {
    if (parameter.valueQuantity) {
      const valueQuantity = parameter.valueQuantity;
      const valueHash = hash(valueQuantity);
      let isExist = false;
      uniqueQuantityArray.forEach((value: Quantity) => {
        const refHash = hash(value);
        if (valueHash === refHash) {
          isExist = true;
          return;
        }
      });
      if (!isExist) {
        uniqueQuantityArray.push(valueQuantity);
      }
    }
  }
}
