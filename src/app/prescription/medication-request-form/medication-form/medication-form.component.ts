import { Component, OnDestroy, OnInit } from '@angular/core';
import { AbstractControl, FormArray, FormBuilder, FormControl, FormGroup } from '@angular/forms';
import { Observable, Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, filter, map, switchMap, takeUntil, tap } from 'rxjs/operators';

import { MedicationRequestFormService } from '../medication-request-form.service';
import {
  MedicationFormIntentRemoveIngredient,
  MedicationFormIntentRemoveMedication,
  MedicationFormIntentValueChangesMedicationForm,
  MedicationFormIntentValueChangesMedicationIngredientStrength,
  MedicationFormIntentValueChangesMedicationIngredientStrengthValue,
  MedicationFormIntentValueChangesMedicationIngredientStrengthUnit
} from '../medication-request-form.intent';
import { MedicationRequestFormState } from '../medication-request-form.state';
import { Utils } from '../../../common/utils';
import { FhirCioDcService } from '../../../common/services/fhir.cio.dc.service';
import { FhirLabelProviderFactory } from '../../../common/fhir/fhir.label.provider.factory';
import { fhir } from '../../../common/fhir/fhir.types';
import Medication = fhir.Medication;
import Coding = fhir.Coding;
import Ratio = fhir.Ratio;
import CodeableConcept = fhir.CodeableConcept;
import Bundle = fhir.Bundle;
import MedicationIngredient = fhir.MedicationIngredient;
import MedicationKnowledge = fhir.MedicationKnowledge;

@Component({
  selector: 'app-medication-form',
  templateUrl: './medication-form.component.html',
  styleUrls: ['./medication-form.component.css']
})
export class MedicationFormComponent implements OnInit, OnDestroy {

  private _unsubscribeTrigger$ = new Subject<void>();

  private _labelProviderFactory = new FhirLabelProviderFactory();

  medication = this.fb.array([]);

  constructor(
    private _cioDcSource: FhirCioDcService,
    private _formStateService: MedicationRequestFormService,
    private fb: FormBuilder) { }

  public get formState(): MedicationRequestFormState {
    return this._formStateService.formState;
  }

  public get labelProviderFactory(): FhirLabelProviderFactory {
    return this._labelProviderFactory;
  }

  public ngOnInit(): void {
    this.subscribeUI(this._formStateService.formStateObservable);
  }

  public ngOnDestroy(): void {
    this._unsubscribeTrigger$.next();
    this._unsubscribeTrigger$.complete();
  }

  public subscribeUI(state$: Observable<MedicationRequestFormState>): void {
    state$
      .pipe(
        takeUntil(this._unsubscribeTrigger$)
      )
      .subscribe(
        formState => {
          this.render(formState);
        }
      );
  }

  public getIngredient(medicationGroup: AbstractControl | null): FormArray {
    if (medicationGroup == null) { return this.fb.array([]); }
    return medicationGroup.get('ingredient') as FormArray;
  }

  public getFormControlByGroup(medicationGroup: AbstractControl): FormControl {
    return medicationGroup.get('form') as FormControl;
  }

  trackByCodeableConcept(_, codeableConcept: CodeableConcept): string {
    return codeableConcept.text;
  }

  displayFnCodeableConcept(codeableConcept: CodeableConcept): string | null {
    return this._labelProviderFactory.getProvider('fhir.CodeableConcept').getText(codeableConcept);
  }

  trackByCoding(_, coding: Coding): string {
    return coding.code;
  }

  displayFnCoding(coding: Coding): string | null {
    return this._labelProviderFactory.getProvider('fhir.Coding').getText(coding);
  }

  trackByRatio(_, ratio: Ratio): string {
    return ratio.numerator.code;
  }

  displayFnRatio(ratio: Ratio): string | null {
    return this._labelProviderFactory.getProvider('fhir.Ratio').getText(ratio);
  }

  trackByControl(_, ac: AbstractControl): string {
    return ac['track-id'];
  }

  onRemoveMedication(nMedication: number): void {
    this._formStateService.dispatchIntent(
      new MedicationFormIntentRemoveMedication(this.formState.medicationRequest, nMedication)
    );
  }

  onRemoveIngredient(nIngredient: number): void {
    this._formStateService.dispatchIntent(
      new MedicationFormIntentRemoveIngredient(this.formState.medicationRequest, nIngredient)
    );
  }

  private render(formState: MedicationRequestFormState): void {
    switch (formState.type) {
      case 'AddMedication':
        this.medication.clear();
        this.addMedication(
          formState.medicationRequest.contained[0] as Medication,
          this.medication,
          formState.medicationRequest.contained as Array<Medication>
        );
        break;
      case 'RemoveMedication':
        for (const index of formState.nMedicationArray) {
          this.medication.removeAt(index);
        }
        break;
      case 'AddMedicationRequest':
        this.medication.clear();
        break;
    }

    /*let count = 0;
    for (const ingredientControl of ingredient.controls) {
      if (this._formStateService.formState.dosageRatioSet[count].size === 1) {
        ingredientControl.get('strength').setValue(
          this._formStateService.formState.dosageRatioSet[count].values().next().value, options);
      }
      ingredientControl.get('strength').setValidators(
        [DosageInstructionFormComponent.ratioSelected(this._formStateService.formState.dosageRatioSet[count])]);
      ingredientControl.get('strength').updateValueAndValidity(options);
      count++;
    }

    const routeControl = dosageInstructionGroup.get('route');
    if (this._formStateService.formState.routeCodeSet.size === 1) {
      routeControl.setValue(this._formStateService.formState.routeCodeSet.values().next().value, options);
    }
    routeControl.setValidators(
      [DosageInstructionFormComponent.codingSelected(this._formStateService.formState.routeCodeSet)]);
    routeControl.updateValueAndValidity(options);

    const formControl = medicationGroup.get('form');
    if (this._formStateService.formState.formCodeSet.size === 1) {
      formControl.setValue(this._formStateService.formState.formCodeSet.values().next().value, options);
    }
    formControl.setValidators(
      [DosageInstructionFormComponent.codingSelected(this._formStateService.formState.formCodeSet)]);
    formControl.updateValueAndValidity(options);*/
  }

  private addMedication(medication: Medication, medicationFormArray: FormArray,
                        medications: Array<Medication>): void {
    const medicationKnowledge = this.formState.medicationKnowledgeMap.get(medication.id);
    const medicationGroup = this.fb.group({
      'track-id': Utils.randomString(16),
      medication: [medication],
      ingredient: this.fb.array([]),
      form: [medication.form]
    });
    medicationFormArray.push(medicationGroup);

    const formString$ = medicationGroup.get('form').valueChanges
      .pipe(
        filter(value => typeof value === 'string')
      );
    const formObj$ = medicationGroup.get('form').valueChanges
      .pipe(
        filter(value => value instanceof Object)
      );

    if (medicationKnowledge) {
      formString$
        .pipe(
          takeUntil(this._unsubscribeTrigger$),
          tap(_ => {
            medicationGroup.get('form').setValue(null, {emitEvent: false});
            this._formStateService.dispatchIntent(
              new MedicationFormIntentValueChangesMedicationForm(
                this.formState.medicationRequest,
                medication,
                null
              )
            );
            this.formState.loading = true;
            this._formStateService.clearList(medication);
          }),
          map(_ => {
            const ingredient = ingredientArray.getRawValue();
            for (const element of ingredient) {
              delete element['track-id'];
            }
            return {medicationKnowledge, form: null, ingredient};
          }),
          switchMap(value => this._cioDcSource.postMedicationKnowledgeDetailsByRouteCodeAndFormCodeAndIngredient(
            value.medicationKnowledge.id,
            value.medicationKnowledge.code,
            value.form,
            value.ingredient,
            null
          ))
        )
        .subscribe(value => {
          this.formState.loading = false;
          this._formStateService.buildList(medication.id, value);
        });
      formObj$
        .pipe(
          takeUntil(this._unsubscribeTrigger$),
          tap(form => {
            this._formStateService.dispatchIntent(
              new MedicationFormIntentValueChangesMedicationForm(
                this.formState.medicationRequest,
                medication,
                form
              )
            );
            this.formState.loading = true;
            this._formStateService.clearList(medication);
          }),
          map(form => {
            const ingredient = ingredientArray.getRawValue();
            for (const element of ingredient) {
              delete element['track-id'];
            }
            return {medicationKnowledge, form, ingredient};
          }),
          switchMap(value => this._cioDcSource.postMedicationKnowledgeDetailsByRouteCodeAndFormCodeAndIngredient(
            value.medicationKnowledge.id,
            value.medicationKnowledge.code,
            value.form,
            value.ingredient,
            null
          ))
        )
        .subscribe(value => {
          this.formState.loading = false;
          this._formStateService.buildList(medication.id, value);
        });
    }
    else {
      formString$
        .pipe(
          takeUntil(this._unsubscribeTrigger$),
          debounceTime(500),
          distinctUntilChanged(),
          tap(_ => {
            this.formState.loading = true;
            this.formState.formMap.get(medication.id).length = 0;
          }),
          // TODO add method to find into good form valueset
          switchMap(value => value)
        )
        .subscribe(value => {
          const bundle = value as Bundle;
          if (bundle.total > 0) {
            const formArray = this.formState.formMap.get(medication.id);
            for (const entry of bundle.entry) {
              formArray.push(entry);
            }
          }
          this.formState.loading = false;
        });
      formObj$
        .pipe(
          takeUntil(this._unsubscribeTrigger$)
        )
        .subscribe(form =>
          this._formStateService.dispatchIntent(
            new MedicationFormIntentValueChangesMedicationForm(
              this.formState.medicationRequest,
              medication,
              form
            )
          )
        );
    }

    const ingredientArray = medicationGroup.get('ingredient') as FormArray;
    for (const ingredient of medication.ingredient) {
      if (ingredient.itemCodeableConcept) {
        this.addIngredientCodeableConcept(medicationKnowledge, medication, medicationGroup, ingredient, ingredientArray);
      }
      else if (ingredient.itemReference) {
        this.addIngredientReference(medication, ingredient, ingredientArray);
      }
    }

    for (const ingredient of medication.ingredient) {
      if (ingredient.itemReference != null) {
        const mId = ingredient.itemReference.reference.substring(1);
        const mIndex = medications.findIndex((value) => {
          return value.id === mId;
        });
        if (mIndex > -1) {
          this.addMedication(medications[mIndex], medicationFormArray, medications);
        }
      }
    }
  }

  private addIngredientCodeableConcept(medicationKnowledge: MedicationKnowledge, medication: Medication, medicationGroup: FormGroup,
                                       ingredient: MedicationIngredient, ingredientArray: FormArray): void {
    const ingredientGroup = this.fb.group({
      'track-id': Utils.randomString(16),
      itemCodeableConcept: ingredient.itemCodeableConcept,
      strength: ingredient.strength
    });
    ingredientArray.push(ingredientGroup);

    const strengthString$ = ingredientGroup.get('strength').valueChanges
      .pipe(
        filter(value => typeof value === 'string')
      );
    const strengthObj$ = ingredientGroup.get('strength').valueChanges
      .pipe(
        filter(value => value instanceof Object)
      );
    strengthString$
      .pipe(
        takeUntil(this._unsubscribeTrigger$),
        tap(_ => {
          ingredientGroup.get('strength').setValue(null, {emitEvent: false});
          const itemCodeableConcept = ingredientGroup.get('itemCodeableConcept').value;
          this._formStateService.dispatchIntent(
            new MedicationFormIntentValueChangesMedicationIngredientStrength(
              this.formState.medicationRequest,
              medication,
              itemCodeableConcept,
              null
            )
          );
          this.formState.loading = true;
          this._formStateService.clearList(medication);
        }),
        map(_ => {
          const itemCodeableConcept = ingredientGroup.get('itemCodeableConcept').value;
          const nIngredient = medication.ingredient.findIndex(
            value => value.itemCodeableConcept === itemCodeableConcept
          );
          medication.ingredient[nIngredient].strength = null;
          const form = medicationGroup.get('form').value;
          return {medicationKnowledge, form, ingredient: medication.ingredient};
        }),
        switchMap(value => this._cioDcSource.postMedicationKnowledgeDetailsByRouteCodeAndFormCodeAndIngredient(
          value.medicationKnowledge.id,
          value.medicationKnowledge.code,
          value.form,
          value.ingredient,
          null
        ))
      ).subscribe(value => {
      this.formState.loading = false;
      this._formStateService.buildList(medication.id, value);
    });
    strengthObj$
      .pipe(
        takeUntil(this._unsubscribeTrigger$),
        tap(strength => {
          const itemCodeableConcept = ingredientGroup.get('itemCodeableConcept').value;
          this._formStateService.dispatchIntent(
            new MedicationFormIntentValueChangesMedicationIngredientStrength(
              this.formState.medicationRequest,
              medication,
              itemCodeableConcept,
              strength
            )
          );
          this.formState.loading = true;
          this._formStateService.clearList(medication);
        }),
        map(strength => {
          const itemCodeableConcept = ingredientGroup.get('itemCodeableConcept').value;
          const nIngredient = medication.ingredient.findIndex(
            value => value.itemCodeableConcept === itemCodeableConcept
          );
          medication.ingredient[nIngredient].strength = strength;
          const form = medicationGroup.get('form').value;
          return {medicationKnowledge, form, ingredient: medication.ingredient};
        }),
        switchMap(value => this._cioDcSource.postMedicationKnowledgeDetailsByRouteCodeAndFormCodeAndIngredient(
          value.medicationKnowledge.id,
          value.medicationKnowledge.code,
          value.form,
          value.ingredient,
          null
        ))
      ).subscribe(value => {
      this.formState.loading = false;
      this._formStateService.buildList(medication.id, value);
    });
  }

  private addIngredientReference(medication: Medication, ingredient: MedicationIngredient,
                                 ingredientArray: FormArray): void {
    const ingredientGroup = this.fb.group({
      'track-id': Utils.randomString(16),
      itemReference: ingredient.itemReference,
      strength: this.fb.group({
        numerator: this.fb.group({
          value: ingredient.strength?.numerator?.value,
          unit: {
            code: ingredient.strength?.numerator?.code,
            display: ingredient.strength?.numerator?.unit,
            system: ingredient.strength?.numerator?.system
          }
        })
      })
    });
    ingredientArray.push(ingredientGroup);

    ingredientGroup.get(['strength', 'numerator', 'value']).valueChanges
      .pipe(
        takeUntil(this._unsubscribeTrigger$),
        debounceTime(500),
        distinctUntilChanged()
      )
      .subscribe(strengthValue => {
        const itemReference = ingredientGroup.get('itemReference').value;
        this._formStateService.dispatchIntent(
          new MedicationFormIntentValueChangesMedicationIngredientStrengthValue(
            this.formState.medicationRequest,
            medication,
            itemReference,
            strengthValue
          )
        );
      });
    const strengthNumeratorUnitString$ = ingredientGroup.get(['strength', 'numerator', 'unit']).valueChanges
      .pipe(
        filter(predicate => typeof predicate === 'string')
      );
    const strengthNumeratorUnitObj$ = ingredientGroup.get(['strength', 'numerator', 'unit']).valueChanges
      .pipe(
        filter(value => value instanceof Object)
      );
    strengthNumeratorUnitString$
      .pipe(
        takeUntil(this._unsubscribeTrigger$),
        debounceTime(500),
        distinctUntilChanged(),
        tap(_ => {
          this.formState.loading = true;
          this.formState.doseAndRateUnitArray.length = 0;
        }),
        // TODO add method to find into good form valueset
        switchMap(value => value)
      )
      .subscribe(value => {
        const bundle = value as Bundle;
        if (bundle.total > 0) {
          for (const entry of bundle.entry) {
            this.formState.doseAndRateUnitArray.push(entry);
          }
        }
        this.formState.loading = false;
      });
    strengthNumeratorUnitObj$
      .pipe(
        takeUntil(this._unsubscribeTrigger$),
      )
      .subscribe(unitValue => {
        const itemReference = ingredientGroup.get('itemReference').value;
        this._formStateService.dispatchIntent(
          new MedicationFormIntentValueChangesMedicationIngredientStrengthUnit(
            this.formState.medicationRequest,
            medication,
            itemReference,
            unitValue
          )
        );
      });
  }
}
