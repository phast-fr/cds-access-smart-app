/**
 * @license
 * Copyright PHAST SARL All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://cds-access.phast.fr/license
 */
import {ChangeDetectionStrategy, Component, OnDestroy, OnInit} from '@angular/core';
import {AbstractControl, FormArray, FormBuilder, FormControl, FormGroup} from '@angular/forms';
import {BehaviorSubject, Observable, Subject} from 'rxjs';
import {debounceTime, distinctUntilChanged, filter, takeUntil, tap} from 'rxjs/operators';

import {nanoid} from 'nanoid';
import {
  CodeableConcept,
  Coding, id,
  Medication,
  MedicationIngredient, Quantity,
  Ratio,
  Reference
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
import {Utils} from '../../../common/cds-access/utils/utils';
import {FhirLabelProviderFactory} from '../../../common/fhir/providers/fhir.label.provider.factory';

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

  public get amountList(): Array<Quantity> {
    if (this._viewModel.amountMap && this._viewModel.medication?.id) {
      const map = this._viewModel.amountMap.get(this._viewModel.medication.id);
      if (map) {
        const input = Array.from(map.values());
        const comparator = (a: Quantity, b: Quantity) => {
          return a?.value === b?.value
            && a?.code === b?.code;
        };
        return Utils.intersect<CodeableConcept>(input[0], input, comparator);
      }
    }
    return new Array<Quantity>();
  }

  public get formList(): Array<CodeableConcept> {
    if (this._viewModel.formMap && this._viewModel.medication?.id) {
      const map = this._viewModel.formMap.get(this._viewModel.medication.id);
      if (map) {
        const input = Array.from(map.values());
        const comparator = (a: CodeableConcept, b: CodeableConcept) => {
          return a.text === b.text;
        };
        return Utils.intersect<CodeableConcept>(input[0], input, comparator);
      }
    }
    return new Array<CodeableConcept>();
  }

  public strengthList(itemCodeableConcept: id): Array<Ratio> {
    if (this._viewModel.strengthMap) {
      const map = this._viewModel.strengthMap.get(itemCodeableConcept);
      if (map) {
        const input = Array.from(map.values());
        const comparator = (a: Ratio, b: Ratio) => {
          return a.numerator?.value === b.numerator?.value;
        };
        return Utils.intersect<Ratio>(input[0], input, comparator);
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
        if (state.medicationRequest?.contained) {
          this._medicationGroup$.next(
            this.addMedication(0, state.medicationRequest.contained[0])
          );
        }
        break;
      case 'RemoveMedication':
        this._medicationGroup$.next(false);
        break;
      case 'ValueChangesMedication':
      case 'ValueChangesDosageInstruction':
        if (state.medicationRequest?.contained) {
          this._medicationGroup$.next(
            this.updateMedication(0, state.medicationRequest.contained[0])
          );
        }
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

  public doseAndRateUnitList(reference: Reference): Array<Coding> {
    if (this._viewModel.doseAndRateUnitMap && reference.reference) {
      const map = this._viewModel.doseAndRateUnitMap.get(reference.reference.substring(1));
      if (map) {
        const input = Array.from(map.values());
        const comparator = (a: Coding, b: Coding) => {
          return a.code === b.code && a.system === b.system;
        };
        return Utils.intersect<Coding>(input[0], input, comparator);
      }
    }
    return new Array<Coding>();
  }

  public onRemoveMedication(nMedication: number): void {
    if (this._viewModel.medicationRequest) {
      this._viewModel.dispatchIntent(
        new MedicationFormIntentRemoveMedication(this._viewModel.medicationRequest, nMedication)
      );
    }
  }

  public onRemoveIngredient(nIngredient: number): void {
    if (this._viewModel.medicationRequest) {
      this._viewModel.dispatchIntent(
        new MedicationFormIntentRemoveIngredient(this._viewModel.medicationRequest, nIngredient)
      );
    }
  }

  private addMedication(nMedication: number, medication: Medication): FormGroup {
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
            if (this._viewModel.medicationRequest) {
              this._viewModel.dispatchIntent(
                new MedicationFormIntentValueChangesMedicationAmount(
                  this._viewModel.medicationRequest,
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
            if (this._viewModel.medicationRequest) {
              this._viewModel.dispatchIntent(
                new MedicationFormIntentValueChangesMedicationAmount(
                  this._viewModel.medicationRequest,
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
            if (this._viewModel.medicationRequest) {
              this._viewModel.dispatchIntent(
                new MedicationFormIntentValueChangesMedicationForm(
                  this._viewModel.medicationRequest,
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
            if (this._viewModel.medicationRequest) {
              this._viewModel.dispatchIntent(
                new MedicationFormIntentValueChangesMedicationForm(
                  this._viewModel.medicationRequest,
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

  private updateMedication(_: number, medication: Medication): FormGroup | boolean {
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

      if (medication.ingredient) {
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
            if (this._viewModel.medicationRequest && itemCodeableConceptControl) {
              this._viewModel.dispatchIntent(
                new MedicationFormIntentValueChangesMedicationIngredientStrength(
                  this._viewModel.medicationRequest,
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
            if (this._viewModel.medicationRequest && itemCodeableConceptControl) {
              this._viewModel.dispatchIntent(
                new MedicationFormIntentValueChangesMedicationIngredientStrength(
                  this._viewModel.medicationRequest,
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
            if (this._viewModel.medicationRequest && itemReferenceControl) {
              this._viewModel.dispatchIntent(
                new MedicationFormIntentValueChangesMedicationIngredientStrengthValue(
                  this._viewModel.medicationRequest,
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
            if (this._viewModel.medicationRequest && itemReferenceControl) {
              this._viewModel.dispatchIntent(
                new MedicationFormIntentValueChangesMedicationIngredientStrengthUnit(
                  this._viewModel.medicationRequest,
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
            if (this._viewModel.medicationRequest && itemReferenceControl) {
              this._viewModel.dispatchIntent(
                new MedicationFormIntentValueChangesMedicationIngredientStrengthUnit(
                  this._viewModel.medicationRequest,
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
        }
        else {
          formControl.enable(options);
        }
      }

      const amountControl = medicationGroup.get('amount');
      if (amountControl) {
        if (this.amountList.length === 0) {
          amountControl.disable(options);
        }
        else {
          amountControl.enable(options);
        }
      }

      if (this._viewModel.medicationRequest?.contained) {
        const ingredientFormArray = medicationGroup.get('ingredient') as FormArray;
        this._viewModel.medicationRequest.contained.forEach((value) => {
          const medication = value as Medication;
          if (medication.ingredient) {
            medication.ingredient.forEach((ingredient: MedicationIngredient, nIngredient: number) => {
              if (ingredient.itemCodeableConcept?.text && this.strengthList(ingredient.itemCodeableConcept.text).length === 0) {
                ingredientFormArray.at(nIngredient).disable(options);
              }
              else if (ingredient.itemCodeableConcept) {
                ingredientFormArray.at(nIngredient).enable(options);
              }
            });
          }
        });
      }
    }
  }
}
