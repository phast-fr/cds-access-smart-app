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

import {ChangeDetectionStrategy, Component, OnDestroy, OnInit, ViewChild} from '@angular/core';
import {AbstractControl, FormArray, FormBuilder, FormControl, FormGroup} from '@angular/forms';
import {BehaviorSubject, Observable, Subject} from 'rxjs';
import {debounceTime, distinctUntilChanged, filter, takeUntil, tap} from 'rxjs/operators';

import {nanoid} from 'nanoid';
import * as hash from 'object-hash';
import {
  CodeableConcept,
  Coding,
  Medication,
  MedicationIngredient, Quantity,
  Ratio
} from 'phast-fhir-ts';

import {IRender} from '../../../common/cds-access/models/state.model';
import {MedicationRequestFormViewModel} from '../medication-request-form.view-model';
import {
  MedicationFormIntentRemoveIngredient,
  MedicationFormIntentRemoveMedication, MedicationFormIntentValueChangesMedicationAmount,
  MedicationFormIntentValueChangesMedicationForm,
  MedicationFormIntentValueChangesMedicationIngredientStrength,
  MedicationFormIntentValueChangesMedicationIngredientStrengthUnit,
  MedicationFormIntentValueChangesMedicationIngredientStrengthValue
} from '../medication-request-form.intent';
import {MedicationRequestFormState} from '../medication-request-form.state';
import {FhirLabelProviderFactory} from '../../../common/fhir/providers/fhir.label.provider.factory';
import {FhirTypeGuard} from '../../../common/fhir/utils/fhir.type.guard';

@Component({
  selector: 'app-medication-form',
  templateUrl: './medication-form.component.html',
  styleUrls: ['./medication-form.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MedicationFormComponent implements OnInit, OnDestroy, IRender<MedicationRequestFormState> {
  private readonly _unsubscribeTrigger$: Subject<void>;

  private readonly _medicationGroup$: BehaviorSubject<FormGroup | boolean>;

  constructor(private _fb: FormBuilder,
              private _labelProviderFactory: FhirLabelProviderFactory,
              private _viewModel: MedicationRequestFormViewModel) {
    this._unsubscribeTrigger$ = new Subject<void>();
    this._medicationGroup$ = new BehaviorSubject<FormGroup | boolean>(false);
  }

  public get medicationGroup$(): Observable<FormGroup | boolean> {
    return this._medicationGroup$.asObservable();
  }

  public get medicationGroup(): FormGroup | null {
    if (this._medicationGroup$.value) {
      return this._medicationGroup$.value as FormGroup;
    }
    return null;
  }

  public get isLoadingList$(): Observable<boolean> {
    return this._viewModel.isLoadingCIOList$;
  }

  public amountList(medicationCode: CodeableConcept): Array<Quantity> {
    if (this._viewModel.amountMap) {
      const array = this._viewModel.amountMap.get(hash(medicationCode));
      if (array) {
        return array;
      }
    }
    return new Array<Quantity>();
  }

  public formList(medicationCode: CodeableConcept): Array<CodeableConcept> {
    if (this._viewModel.formMap) {
      const array = this._viewModel.formMap.get(hash(medicationCode));
      if (array) {
        return array;
      }
    }
    return new Array<CodeableConcept>();
  }

  public strengthList(itemCodeableConcept: CodeableConcept): Array<Ratio> {
    if (this._viewModel.strengthMap) {
      const array = this._viewModel.strengthMap.get(hash(itemCodeableConcept));
      if (array) {
        return array;
      }
    }
    return new Array<Ratio>();
  }

  public toFormControl(control: AbstractControl): FormControl {
    return control as FormControl;
  }

  public toFormArray(control: AbstractControl): FormArray {
    return control as FormArray;
  }

  public ngOnInit(): void {
    this._viewModel.state$()
      .pipe(
        takeUntil(this._unsubscribeTrigger$),
        filter(state => state !== null)
      )
      .subscribe({
        next: state => this.render(state),
        error: err => console.error('error', err)
      });
  }

  public ngOnDestroy(): void {
    this._unsubscribeTrigger$.next();
    this._unsubscribeTrigger$.complete();

    this._medicationGroup$.complete();
  }

  public render(state: MedicationRequestFormState): void {
    switch (state.type) {
      case 'AddMedication':
        this._medicationGroup$.next(
            this.addMedication(
                0,
                state.bundle?.entry?.filter(entry => FhirTypeGuard.isMedication(entry.resource))
                    .map(entry => entry.resource as Medication)[0]
            )
        );
        break;
      case 'RemoveMedication':
        this._medicationGroup$.next(false);
        break;
      case 'ValueChangesMedication':
      case 'ValueChangesDosageInstruction':
        this.updateMedication(
            0,
            state.bundle?.entry?.filter(entry => FhirTypeGuard.isMedication(entry.resource))
                .map(entry => entry.resource as Medication)[0]
        );
        break;
      case 'AddMedicationRequest':
        this._medicationGroup$.next(false);
        break;
    }
  }

  public trackByCodeableConcept(_: number, codeableConcept: CodeableConcept): string | undefined {
    return codeableConcept.text;
  }

  public displayFnCodeableConcept(codeableConcept: CodeableConcept): string | undefined {
    return this._labelProviderFactory.getProvider('fhir.CodeableConcept')?.getText(codeableConcept);
  }

  public trackByCoding(_: number, coding: Coding): string | undefined {
    return coding.code;
  }

  public displayFnCoding(coding: Coding): string | undefined {
    return this._labelProviderFactory.getProvider('fhir.Coding')?.getText(coding);
  }

  public trackByQuantity(_: number, quantity: Quantity): string | undefined {
    return quantity.code;
  }

  public displayFnQuantity(quantity: Quantity): string | undefined {
    return this._labelProviderFactory.getProvider('fhir.Quantity')?.getText(quantity);
  }

  public trackByRatio(_: number, ratio: Ratio): string | undefined {
    return ratio.numerator?.code;
  }

  public displayFnRatio(ratio: Ratio): string | undefined {
    return this._labelProviderFactory.getProvider('fhir.Ratio')?.getText(ratio);
  }

  public trackByControl(_: number, ac: AbstractControl): string {
    return ac.get('track-id')?.value;
  }

  // TODO explore this for medication compound
  /*public get unitArray(): Array<Coding> {
    if (this._viewModel.doseUnitMap) {
      return this._viewModel.doseUnitMap;
    }
    return new Array<Coding>();
  }*/

  public onRemoveMedication(nMedication: number): void {
    if (this._viewModel.bundle) {
      this._viewModel.dispatchIntent(
        new MedicationFormIntentRemoveMedication(this._viewModel.bundle, nMedication)
      );
    }
  }

  public onRemoveIngredient(nIngredient: number): void {
    if (this._viewModel.bundle) {
      this._viewModel.dispatchIntent(
        new MedicationFormIntentRemoveIngredient(this._viewModel.bundle, nIngredient)
      );
    }
  }

  private addMedication(nMedication: number, medication: Medication | undefined): FormGroup {
    if (medication) {
      const medicationGroup = this._fb.group({
        'track-id': nanoid(16),
        medication: [medication],
        ingredient: this._fb.array([]),
        amount: [medication.amount],
        form: [medication.form]
      });
      this.setUpAmount(medication, medicationGroup);
      this.setUpForm(medication, medicationGroup);
      this.setUpList();

      if (medication.ingredient) {
        const ingredientArray = medicationGroup.get('ingredient') as FormArray;
        medication.ingredient.forEach(ingredient => {
          if (ingredient.itemCodeableConcept) {
            ingredientArray.push(this.addIngredientCodeableConcept(nMedication, medication, ingredient));
          }
          else if (ingredient.itemReference) {
            ingredientArray.push(this.addIngredientReference(medication, ingredient));
          }
        });
      }
      return medicationGroup;
    }
    return this._fb.group({
      'track-id': nanoid(16),
      medication: [undefined],
      ingredient: this._fb.array([]),
      amount: [undefined],
      form: [undefined]
    });
  }

  private setUpAmount(medication: Medication, medicationGroup: FormGroup): void {
    const amountControl = medicationGroup.get('amount');
    if (amountControl) {
      const amountString$ = amountControl.valueChanges
        .pipe(
          filter(value => typeof value === 'string')
        );
      const amountObj$ = amountControl.valueChanges
        .pipe(
          filter(value => value instanceof Object)
        );

      amountString$
        .pipe(
          takeUntil(this._unsubscribeTrigger$),
          tap(() => amountControl.reset(undefined, {emitEvent: false}))
        )
        .subscribe({
          next: () => {
            if (this._viewModel.bundle) {
              this._viewModel.dispatchIntent(
                new MedicationFormIntentValueChangesMedicationAmount(
                  this._viewModel.bundle,
                  medication,
                  null
                )
              );
            }
          },
          error: err => console.error('error', err)
        });
      amountObj$
        .pipe(
          takeUntil(this._unsubscribeTrigger$)
        )
        .subscribe({
          next: value => {
            if (this._viewModel.bundle) {
              this._viewModel.dispatchIntent(
                new MedicationFormIntentValueChangesMedicationAmount(
                  this._viewModel.bundle,
                  medication,
                  value
                )
              );
            }
          },
          error: err => console.error('error', err)
        });
    }
  }

  private setUpForm(medication: Medication, medicationGroup: FormGroup): void {
    const formControl = medicationGroup.get('form');
    if (formControl) {
      const formString$ = formControl.valueChanges
        .pipe(
          filter(value => typeof value === 'string')
        );
      const formObj$ = formControl.valueChanges
        .pipe(
          filter(value => value instanceof Object)
        );

      formString$
        .pipe(
          takeUntil(this._unsubscribeTrigger$),
          tap(() => formControl.reset(undefined, {emitEvent: false}))
        )
        .subscribe({
          next: () => {
            if (this._viewModel.bundle) {
              this._viewModel.dispatchIntent(
                new MedicationFormIntentValueChangesMedicationForm(
                  this._viewModel.bundle,
                  medication,
                  null
                )
              );
            }
          },
          error: err => console.error('error', err)
        });
      formObj$
        .pipe(
          takeUntil(this._unsubscribeTrigger$)
        )
        .subscribe({
          next: value => {
            if (this._viewModel.bundle) {
              this._viewModel.dispatchIntent(
                new MedicationFormIntentValueChangesMedicationForm(
                  this._viewModel.bundle,
                  medication,
                  value
                )
              );
            }
          },
          error: err => console.error('error', err)
        });
    }
  }

  private setUpList(): void {
    const loadedList$ = this.isLoadingList$
      .pipe(
        filter(value => !value)
      );

    loadedList$
      .pipe(
        takeUntil(this._unsubscribeTrigger$)
      )
      .subscribe({
        next: () => this.onLoadedList(),
        error: err => console.error('error', err)
      });

  }

  private updateMedication(_: number, medication: Medication | undefined): FormGroup | boolean {
    if (this._medicationGroup$.value) {
      const options = {emitEvent: false};
      const medicationGroup = this._medicationGroup$.value as FormGroup;
      const amountControl = medicationGroup.get('amount');
      if (amountControl) {
        if (medication?.amount) {
          amountControl.setValue(medication.amount, options);
        }
        else {
          amountControl.reset(undefined, options);
        }
      }

      const formControl = medicationGroup.get('form');
      if (formControl) {
        if (medication?.form) {
          formControl.setValue(medication.form, options);
        }
        else {
          formControl.reset(undefined, options);
        }
      }

      if (medication && medication.ingredient) {
        const ingredientArray = medicationGroup.get('ingredient') as FormArray;
        medication.ingredient.forEach((ingredient: MedicationIngredient, nIngredient: number) => {
          if (ingredient.itemCodeableConcept) {
            if (ingredient.strength) {
              const ingredientControl = ingredientArray.at(nIngredient);
              if (ingredientControl) {
                const strengthControl = ingredientControl.get('strength');
                if (strengthControl) {
                  strengthControl.setValue(ingredient.strength, options);
                }
              }
            }
            else {
              const ingredientControl = ingredientArray.at(nIngredient);
              if (ingredientControl) {
                const strengthControl = ingredientControl.get('strength');
                if (strengthControl) {
                  strengthControl.reset(undefined, options);
                }
              }
            }
          }
        });
      }
      return medicationGroup;
    }
    return false;
  }

  private addIngredientCodeableConcept(_: number, medication: Medication,
                                       ingredient: MedicationIngredient): FormGroup {
    const ingredientGroup = this._fb.group({
      'track-id': nanoid(16),
      itemCodeableConcept: ingredient.itemCodeableConcept,
      strength: ingredient.strength
    });

    const strengthControl = ingredientGroup.get('strength');
    if (strengthControl) {
      const strengthString$ = strengthControl.valueChanges
        .pipe(
          filter(value => typeof value === 'string')
        );
      const strengthObj$ = strengthControl.valueChanges
        .pipe(
          filter(value => value instanceof Object)
        );
      strengthString$
        .pipe(
          takeUntil(this._unsubscribeTrigger$),
          tap(() => strengthControl.reset(undefined, {emitEvent: false}))
        )
        .subscribe({
          next: () => {
            const itemCodeableConceptControl = ingredientGroup.get('itemCodeableConcept');
            if (this._viewModel.bundle && itemCodeableConceptControl) {
              this._viewModel.dispatchIntent(
                new MedicationFormIntentValueChangesMedicationIngredientStrength(
                  this._viewModel.bundle,
                  medication,
                  itemCodeableConceptControl.value,
                  null
                )
              );
            }
          },
          error: err => console.error('error', err)
        });
      strengthObj$
        .pipe(
          takeUntil(this._unsubscribeTrigger$)
        )
        .subscribe({
          next: value => {
            const itemCodeableConceptControl = ingredientGroup.get('itemCodeableConcept');
            if (this._viewModel.bundle && itemCodeableConceptControl) {
              this._viewModel.dispatchIntent(
                new MedicationFormIntentValueChangesMedicationIngredientStrength(
                  this._viewModel.bundle,
                  medication,
                  itemCodeableConceptControl.value,
                  value
                )
              );
            }
          },
          error: err => console.error('error', err)
        });
    }

    return ingredientGroup;
  }

  private addIngredientReference(medication: Medication, ingredient: MedicationIngredient): FormGroup {
    const ingredientGroup = this._fb.group({
      'track-id': nanoid(16),
      itemReference: ingredient.itemReference,
      strength: this._fb.group({
        numerator: this._fb.group({
          value: ingredient.strength?.numerator?.value,
          unit: {
            code: ingredient.strength?.numerator?.code,
            display: ingredient.strength?.numerator?.unit,
            system: ingredient.strength?.numerator?.system
          }
        })
      })
    });

    const strengthValueControl = ingredientGroup.get(['strength', 'numerator', 'value']);
    if (strengthValueControl) {
      strengthValueControl.valueChanges
        .pipe(
          takeUntil(this._unsubscribeTrigger$),
          debounceTime(500),
          distinctUntilChanged()
        )
        .subscribe({
          next: strengthValue => {
            const itemReferenceControl = ingredientGroup.get('itemReference');
            if (this._viewModel.bundle && itemReferenceControl) {
              this._viewModel.dispatchIntent(
                new MedicationFormIntentValueChangesMedicationIngredientStrengthValue(
                  this._viewModel.bundle,
                  medication,
                  itemReferenceControl.value,
                  strengthValue
                )
              );
            }
          },
          error: err => console.error('error', err)
        });
    }

    const strengthUnitControl = ingredientGroup.get(['strength', 'numerator', 'unit']);
    if (strengthUnitControl) {
      const strengthNumeratorUnitString$ = strengthUnitControl.valueChanges
        .pipe(
          filter(predicate => typeof predicate === 'string')
        );
      const strengthNumeratorUnitObj$ = strengthUnitControl.valueChanges
        .pipe(
          filter(value => value instanceof Object)
        );
      strengthNumeratorUnitString$
        .pipe(
          takeUntil(this._unsubscribeTrigger$),
          tap(() => strengthUnitControl.reset(undefined, {emitEvent: false}))
        )
        .subscribe({
          next: () => {
            const itemReferenceControl = ingredientGroup.get('itemReference');
            if (this._viewModel.bundle && itemReferenceControl) {
              this._viewModel.dispatchIntent(
                new MedicationFormIntentValueChangesMedicationIngredientStrengthUnit(
                  this._viewModel.bundle,
                  medication,
                  itemReferenceControl.value,
                  null
                )
              );
            }
          },
          error: err => console.error('error', err)
        });
      strengthNumeratorUnitObj$
        .pipe(
          takeUntil(this._unsubscribeTrigger$)
        )
        .subscribe({
          next: strengthUnit => {
            const itemReferenceControl = ingredientGroup.get('itemReference');
            if (this._viewModel.bundle && itemReferenceControl) {
              this._viewModel.dispatchIntent(
                new MedicationFormIntentValueChangesMedicationIngredientStrengthUnit(
                  this._viewModel.bundle,
                  medication,
                  itemReferenceControl.value,
                  strengthUnit
                )
              );
            }
          },
          error: err => console.error('error', err)
        });
    }
    return ingredientGroup;
  }

  private onLoadedList(): void {
    if (this._medicationGroup$.value) {
      const options = {emitEvent: false};
      const medicationGroup = this._medicationGroup$.value as FormGroup;
      const formControl = medicationGroup.get('form');
      if (formControl) {
        if (this.formList.length === 0) {
          formControl.disable(options);
        } else {
          formControl.enable(options);
        }
      }

      const amountControl = medicationGroup.get('amount');
      if (amountControl) {
        if (this.amountList.length === 0) {
          amountControl.disable(options);
        } else {
          amountControl.enable(options);
        }
      }

      const ingredientFormArray = medicationGroup.get('ingredient') as FormArray;
      this._viewModel.bundle?.entry?.filter(entry => FhirTypeGuard.isMedication(entry.resource))
          .map(entry => entry.resource as Medication)
          .forEach(medication => {
            if (medication.ingredient) {
              medication.ingredient.forEach((ingredient: MedicationIngredient, nIngredient: number) => {
                if (ingredient.itemCodeableConcept && this.strengthList(ingredient.itemCodeableConcept).length === 0) {
                  ingredientFormArray.at(nIngredient).disable(options);
                } else if (ingredient.itemCodeableConcept) {
                  ingredientFormArray.at(nIngredient).enable(options);
                }
              });
            }
          });
    }
  }
}
