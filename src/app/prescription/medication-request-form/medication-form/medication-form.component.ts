import { Component, OnDestroy, OnInit } from '@angular/core';
import { AbstractControl, FormArray, FormBuilder, FormControl, FormGroup } from '@angular/forms';
import { Observable, Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, filter, takeUntil, tap } from 'rxjs/operators';

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
import MedicationIngredient = fhir.MedicationIngredient;
import MedicationKnowledge = fhir.MedicationKnowledge;
import Reference = fhir.Reference;

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

  get formMap(): Array<CodeableConcept> {
    if (this.formState.medicationRequest.contained.length > 1) {
      return this.formState.formMap.get(this.formState.medicationRequest.contained[1].id);
    }
    return this.formState.formMap.get(this.formState.medicationRequest.contained[0].id);
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

  doseAndRateUnitMap(reference: Reference): Array<Coding> {
    return this.formState.doseAndRateUnitMap.get(reference.reference.substring(1));
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
    const medicationKnowledge = this.medicationKnowledgeMap(medication);
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

    formString$
      .pipe(
        takeUntil(this._unsubscribeTrigger$),
        tap(_ => {
          medicationGroup.get('form').setValue(null, {emitEvent: false});
        })
      )
      .subscribe(_ => {
        const intendedRoute = this.intendedRoute();
        this._formStateService.dispatchIntent(
          new MedicationFormIntentValueChangesMedicationForm(
            this.formState.medicationRequest,
            medication,
            null,
            medicationKnowledge,
            intendedRoute
          )
        );
      });
    formObj$
      .pipe(
        takeUntil(this._unsubscribeTrigger$)
      )
      .subscribe(value => {
        const intendedRoute = this.intendedRoute();
        this._formStateService.dispatchIntent(
          new MedicationFormIntentValueChangesMedicationForm(
            this.formState.medicationRequest,
            medication,
            value,
            medicationKnowledge,
            intendedRoute
          )
        );
      });

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

  private medicationKnowledgeMap(medication: Medication): MedicationKnowledge {
    if (this.formState.medicationKnowledgeMap.has(medication.id)) {
      return this.formState.medicationKnowledgeMap.get(medication.id);
    }
    const medicationId = medication.ingredient[0].itemReference.reference.substring(1);
    return this.formState.medicationKnowledgeMap.get(medicationId);
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
        takeUntil(this._unsubscribeTrigger$)
      )
      .subscribe(_ => {
        ingredientGroup.get('strength').setValue(null, {emitEvent: false});
        const itemCodeableConcept = ingredientGroup.get('itemCodeableConcept').value;
        const form = medicationGroup.get('form').value;
        const intendedRoute = this.intendedRoute();

        this._formStateService.dispatchIntent(
          new MedicationFormIntentValueChangesMedicationIngredientStrength(
            this.formState.medicationRequest,
            medication,
            itemCodeableConcept,
            null,
            medicationKnowledge,
            form,
            intendedRoute
          )
        );
      });
    strengthObj$
      .pipe(
        takeUntil(this._unsubscribeTrigger$)
      )
      .subscribe(value => {
        const itemCodeableConcept = ingredientGroup.get('itemCodeableConcept').value;
        const form = medicationGroup.get('form').value;
        const intendedRoute = this.intendedRoute();

        this._formStateService.dispatchIntent(
          new MedicationFormIntentValueChangesMedicationIngredientStrength(
            this.formState.medicationRequest,
            medication,
            itemCodeableConcept,
            value,
            medicationKnowledge,
            form,
            intendedRoute
          )
        );
      });
  }

  private addIngredientReference(medication: Medication,
                                 ingredient: MedicationIngredient, ingredientArray: FormArray): void {
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
        distinctUntilChanged()
      )
      .subscribe(_ => {
        ingredientGroup.get(['strength', 'numerator', 'unit']).setValue(null, {emitEvent: false});
        const itemReference = ingredientGroup.get('itemReference').value;
        this._formStateService.dispatchIntent(
          new MedicationFormIntentValueChangesMedicationIngredientStrengthUnit(
            this.formState.medicationRequest,
            medication,
            itemReference,
            null
          )
        );
      });
    strengthNumeratorUnitObj$
      .pipe(
        takeUntil(this._unsubscribeTrigger$)
      )
      .subscribe(strengthUnit => {
        const itemReference = ingredientGroup.get('itemReference').value;
        this._formStateService.dispatchIntent(
          new MedicationFormIntentValueChangesMedicationIngredientStrengthUnit(
            this.formState.medicationRequest,
            medication,
            itemReference,
            strengthUnit
          )
        );
      });
  }

  private intendedRoute(): CodeableConcept | undefined {
    if (this.formState.medicationRequest.dosageInstruction
      && this.formState.medicationRequest.dosageInstruction.length > 0) {
      return this.formState.medicationRequest.dosageInstruction[0].route;
    }
    return undefined;
  }
}
