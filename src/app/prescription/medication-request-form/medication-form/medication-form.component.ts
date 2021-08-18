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

import {IRender} from '../../../common/cds-access/models/state.model';
import {MedicationRequestFormViewModel} from '../medication-request-form-view-model';
import {
  MedicationFormIntentRemoveIngredient,
  MedicationFormIntentRemoveMedication,
  MedicationFormIntentValueChangesMedicationForm,
  MedicationFormIntentValueChangesMedicationIngredientStrength,
  MedicationFormIntentValueChangesMedicationIngredientStrengthUnit,
  MedicationFormIntentValueChangesMedicationIngredientStrengthValue
} from '../medication-request-form.intent';
import {MedicationRequestFormState} from '../medication-request-form.state';
import {Utils} from '../../../common/cds-access/utils/utils';
import {FhirLabelProviderFactory} from '../../../common/fhir/providers/fhir.label.provider.factory';
import {
  CodeableConcept,
  Coding, id,
  Medication,
  MedicationIngredient,
  MedicationKnowledge,
  Ratio,
  Reference
} from 'phast-fhir-ts';

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

  public get isLoading$(): Observable<boolean> {
    return this._viewModel.isLoading$;
  }

  public get formMap(): Array<CodeableConcept> {
    if (this._viewModel.medicationRequest.contained.length > 1) {
      return this._viewModel.formMap.get(this._viewModel.medicationRequest.contained[1].id);
    }
    return this._viewModel.formMap.get(this._viewModel.medicationRequest.contained[0].id);
  }

  public get strengthMap(): Map<id, Array<Ratio>> {
    return this._viewModel.strengthMap;
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
        const medication = state.medicationRequest.contained[0] as Medication;
        const medicationGroup = this._fb.group({
          'track-id': Utils.randomString(16),
          medication: [medication],
          ingredient: this._fb.array([]),
          form: [medication.form]
        });
        this.addMedication(
          medication,
          medicationGroup
        );
        this._medicationGroup$.next(medicationGroup);
        break;
      case 'RemoveMedication':
        this._medicationGroup$.next(false);
        break;
      case 'AddMedicationRequest':
        this._medicationGroup$.next(false);
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

  public trackByCodeableConcept(_, codeableConcept: CodeableConcept): string {
    return codeableConcept.text;
  }

  public displayFnCodeableConcept(codeableConcept: CodeableConcept): string | null {
    return this._labelProviderFactory.getProvider('fhir.CodeableConcept').getText(codeableConcept);
  }

  public trackByCoding(_, coding: Coding): string {
    return coding.code;
  }

  public displayFnCoding(coding: Coding): string | null {
    return this._labelProviderFactory.getProvider('fhir.Coding').getText(coding);
  }

  public trackByRatio(_, ratio: Ratio): string {
    return ratio.numerator.code;
  }

  public displayFnRatio(ratio: Ratio): string | null {
    return this._labelProviderFactory.getProvider('fhir.Ratio').getText(ratio);
  }

  public trackByControl(_, ac: AbstractControl): string {
    return ac['track-id'];
  }

  public doseAndRateUnitMap(reference: Reference): Array<Coding> {
    return this._viewModel.doseAndRateUnitMap.get(reference.reference.substring(1));
  }

  public onRemoveMedication(nMedication: number): void {
    this._viewModel.dispatchIntent(
      new MedicationFormIntentRemoveMedication(this._viewModel.medicationRequest, nMedication)
    );
  }

  public onRemoveIngredient(nIngredient: number): void {
    this._viewModel.dispatchIntent(
      new MedicationFormIntentRemoveIngredient(this._viewModel.medicationRequest, nIngredient)
    );
  }

  private addMedication(medication: Medication, medicationGroup: FormGroup): void {
    const medicationKnowledge = this.medicationKnowledgeMap(medication);
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
        tap(() => medicationGroup.get('form').setValue(null, {emitEvent: false}))
      )
      .subscribe({
        next: () => {
          const intendedRoute = this.intendedRoute();
          this._viewModel.dispatchIntent(
            new MedicationFormIntentValueChangesMedicationForm(
              this._viewModel.medicationRequest,
              medication,
              null,
              medicationKnowledge,
              intendedRoute
            )
          );
        },
        error: err => console.error('error', err)
      });
    formObj$
      .pipe(
        takeUntil(this._unsubscribeTrigger$),
        tap(value => medicationGroup.get('form').setValue(value, {emitEvent: false}))
      )
      .subscribe({
        next: value => {
          const intendedRoute = this.intendedRoute();
          this._viewModel.dispatchIntent(
            new MedicationFormIntentValueChangesMedicationForm(
              this._viewModel.medicationRequest,
              medication,
              value,
              medicationKnowledge,
              intendedRoute
            )
          );
        },
        error: err => console.error('error', err)
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

    /*for (const ingredient of medication.ingredient) {
      if (ingredient.itemReference) {
        const mId = ingredient.itemReference.reference.substring(1);
        const mIndex = medications.findIndex((value) => {
          return value.id === mId;
        });
        if (mIndex > -1) {
          this.addMedication(medications[mIndex], medicationGroup, medications);
        }
      }
    }*/
  }

  private medicationKnowledgeMap(medication: Medication): MedicationKnowledge {
    if (this._viewModel.medicationKnowledgeMap.has(medication.id)) {
      return this._viewModel.medicationKnowledgeMap.get(medication.id);
    }
    const medicationId = medication.ingredient[0].itemReference.reference.substring(1);
    return this._viewModel.medicationKnowledgeMap.get(medicationId);
  }

  private addIngredientCodeableConcept(medicationKnowledge: MedicationKnowledge, medication: Medication, medicationGroup: FormGroup,
                                       ingredient: MedicationIngredient, ingredientArray: FormArray): void {
    const ingredientGroup = this._fb.group({
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
        tap(() => ingredientGroup.get('strength').setValue(null, {emitEvent: false}))
      )
      .subscribe({
        next: () => {
          const itemCodeableConcept = ingredientGroup.get('itemCodeableConcept').value;
          const form = medicationGroup.get('form').value;
          const intendedRoute = this.intendedRoute();

          this._viewModel.dispatchIntent(
            new MedicationFormIntentValueChangesMedicationIngredientStrength(
              this._viewModel.medicationRequest,
              medication,
              itemCodeableConcept,
              null,
              medicationKnowledge,
              form,
              intendedRoute
            )
          );
        },
        error: err => console.error('error', err)
      });
    strengthObj$
      .pipe(
        takeUntil(this._unsubscribeTrigger$),
        tap(value => ingredientGroup.get('strength').setValue(value, {emitEvent: false}))
      )
      .subscribe({
        next: value => {
          const itemCodeableConcept = ingredientGroup.get('itemCodeableConcept').value;
          const form = medicationGroup.get('form').value;
          const intendedRoute = this.intendedRoute();

          this._viewModel.dispatchIntent(
            new MedicationFormIntentValueChangesMedicationIngredientStrength(
              this._viewModel.medicationRequest,
              medication,
              itemCodeableConcept,
              value,
              medicationKnowledge,
              form,
              intendedRoute
            )
          );
        },
        error: err => console.error('error', err)
      });
  }

  private addIngredientReference(medication: Medication,
                                 ingredient: MedicationIngredient, ingredientArray: FormArray): void {
    const ingredientGroup = this._fb.group({
      'track-id': Utils.randomString(16),
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
    ingredientArray.push(ingredientGroup);

    ingredientGroup.get(['strength', 'numerator', 'value']).valueChanges
      .pipe(
        takeUntil(this._unsubscribeTrigger$),
        debounceTime(500),
        distinctUntilChanged(),
        tap(value => ingredientGroup.get(['strength', 'numerator', 'value']).setValue(value, {emitEvent: false}))
      )
      .subscribe({
        next: strengthValue => {
          const itemReference = ingredientGroup.get('itemReference').value;
          this._viewModel.dispatchIntent(
            new MedicationFormIntentValueChangesMedicationIngredientStrengthValue(
              this._viewModel.medicationRequest,
              medication,
              itemReference,
              strengthValue
            )
          );
        },
        error: err => console.error('error', err)
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
        tap(() => ingredientGroup.get(['strength', 'numerator', 'unit']).setValue(null, {emitEvent: false}))
      )
      .subscribe({
        next: () => {
          const itemReference = ingredientGroup.get('itemReference').value;
          this._viewModel.dispatchIntent(
            new MedicationFormIntentValueChangesMedicationIngredientStrengthUnit(
              this._viewModel.medicationRequest,
              medication,
              itemReference,
              null
            )
          );
        },
        error: err => console.error('error', err)
      });
    strengthNumeratorUnitObj$
      .pipe(
        takeUntil(this._unsubscribeTrigger$),
        tap(value => ingredientGroup.get(['strength', 'numerator', 'unit']).setValue(value, {emitEvent: false}))
      )
      .subscribe({
        next: strengthUnit => {
          const itemReference = ingredientGroup.get('itemReference').value;
          this._viewModel.dispatchIntent(
            new MedicationFormIntentValueChangesMedicationIngredientStrengthUnit(
              this._viewModel.medicationRequest,
              medication,
              itemReference,
              strengthUnit
            )
          );
        },
        error: err => console.error('error', err)
      });
  }

  private intendedRoute(): CodeableConcept | undefined {
    if (this._viewModel.medicationRequest.dosageInstruction
      && this._viewModel.medicationRequest.dosageInstruction.length > 0) {
      return this._viewModel.medicationRequest.dosageInstruction[0].route;
    }
    return undefined;
  }
}
