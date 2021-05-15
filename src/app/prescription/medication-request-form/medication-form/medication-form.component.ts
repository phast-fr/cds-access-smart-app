import { Component, OnDestroy, OnInit } from '@angular/core';
import { AbstractControl, FormArray, FormBuilder, FormControl, FormGroup, ValidatorFn } from '@angular/forms';
import { Observable, of, Subject } from 'rxjs';
import { catchError, filter, switchMap, takeUntil, tap } from 'rxjs/operators';

import { MedicationRequestFormService } from '../medication-request-form.service';
import {
  MedicationFormIntentDetailsMedication, MedicationFormIntentRemoveMedication
} from '../medication-request-form.intent';
import { MedicationRequestFormState } from '../medication-request-form.state';
import { FhirCioDcService } from '../../../common/services/fhir.cio.dc.service';
import { FhirLabelProviderFactory } from '../../../common/fhir/fhir.label.provider.factory';
import { fhir } from '../../../common/fhir/fhir.types';
import Medication = fhir.Medication;
import Coding = fhir.Coding;
import Ratio = fhir.Ratio;
import id = fhir.id;
import Parameters = fhir.Parameters;
import CodeableConcept = fhir.CodeableConcept;
import MedicationIngredient = fhir.MedicationIngredient;

@Component({
  selector: 'app-medication-form',
  templateUrl: './medication-form.component.html',
  styleUrls: ['./medication-form.component.css']
})
export class MedicationFormComponent implements OnInit, OnDestroy {

  private unsubscribeTrigger$ = new Subject<void>();

  private _labelProviderFactory = new FhirLabelProviderFactory();

  medication = this.fb.array([]);

  constructor(
    private _cioDcSource: FhirCioDcService,
    private _formStateService: MedicationRequestFormService,
    private fb: FormBuilder) { }

  static codingSelected(mySet: Set<Coding>): ValidatorFn {
    return (c: AbstractControl): { [key: string]: boolean } | null => {
      const selectedValue = c.value;
      if (selectedValue == null || '' === selectedValue) {
        return null;
      }
      const pickedOrNot = Array.from(mySet).filter(
        (alias) => alias.code === selectedValue.code
      );
      if (pickedOrNot.length > 0) {
        // everything's fine. return no error. therefore it's null.
        return null;
      }
      else {
        // there's no matching selectedvalue selected. so return match error.
        return { match: true };
      }
    };
  }

  static ratioSelected(mySet: Set<Ratio>): ValidatorFn {
    return (c: AbstractControl): { [key: string]: boolean } | null => {
      const selectedValue = c.value;
      if (selectedValue == null || '' === selectedValue) {
        return null;
      }
      const pickedOrNot = Array.from(mySet).filter(
        (alias) => alias.numerator.code === selectedValue.numerator.code
      );
      if (pickedOrNot.length > 0) {
        // everything's fine. return no error. therefore it's null.
        return null;
      }
      else {
        // there's no matching selectedvalue selected. so return match error.
        return { match: true };
      }
    };
  }

  public debug(object: any): void {
    console.log(object);
  }

  public get formState(): MedicationRequestFormState {
    return this._formStateService.formState;
  }

  public get labelProviderFactory(): FhirLabelProviderFactory {
    return this._labelProviderFactory;
  }

  public getIngredient(medicationGroup: AbstractControl): FormArray {
    return medicationGroup.get('ingredient') as FormArray;
  }

  public getFormControlByGroup(medicationGroup: AbstractControl): FormControl {
    return medicationGroup.get('form') as FormControl;
  }

  public getFormControlByMkId(mkId: id): FormControl {
    const medicationGroup = this.findFormGroup(mkId, this.medication.controls, 'medication');
    return medicationGroup.get('form') as FormControl;
  }

  public getStrengthControlByIngredient(
    ingredient: MedicationIngredient[],
    itemCodeableConcept: CodeableConcept,
    strength: Ratio): MedicationIngredient[] {
    for (const element of ingredient) {
      if (element.itemCodeableConcept == null
        || element.itemCodeableConcept.text !== itemCodeableConcept.text) {
        continue;
      }
      element.strength = strength;
    }
    return ingredient;
  }

  ngOnInit(): void {
    this.subscribeUI(this._formStateService.formStateObservable);
  }

  ngOnDestroy(): void {
    this.unsubscribeTrigger$.next();
    this.unsubscribeTrigger$.complete();
  }

  subscribeUI(state$: Observable<MedicationRequestFormState>): void {
    state$
      .pipe(
        takeUntil(this.unsubscribeTrigger$)
      )
      .subscribe(
      formState => {
        this.render(formState);
      }
    );
  }

  trackByCodeableConcept(_, codeableConcept: CodeableConcept): string {
    return codeableConcept.text;
  }

  displayFnCodeableConcept(codeableConcept: CodeableConcept): string | null {
    if (codeableConcept == null) { return null; }
    return this._labelProviderFactory.getProvider('fhir.CodeableConcept').getText(codeableConcept);
  }

  trackByCoding(_, coding: Coding): string {
    return coding.code;
  }

  displayFnCoding(coding: Coding): string | null {
    if (coding == null) { return null; }
    return this._labelProviderFactory.getProvider('fhir.Coding').getText(coding);
  }

  trackByRatio(_, ratio: Ratio): string {
    return ratio.numerator.code;
  }

  displayFnRatio(ratio: Ratio): string | null {
    if (ratio == null) { return null; }
    return this._labelProviderFactory.getProvider('fhir.Ratio').getText(ratio);
  }

  onRemoveMedication(nMedication: number): void {
    this._formStateService.dispatchIntent(new MedicationFormIntentRemoveMedication(nMedication));
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
        for (const index of formState.medicationArray) {
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

  private addMedication(medicationRoot: Medication, medicationFormArray: FormArray,
                        medications: Array<Medication>): void {
    const medicationGroup = this.fb.group({
      medication: [medicationRoot],
      ingredient: this.fb.array([]),
      form: [medicationRoot.form]
    });
    medicationFormArray.push(medicationGroup);
    const ingredientArray = medicationGroup.get('ingredient') as FormArray;
    for (const ingredient of medicationRoot.ingredient) {
      if (ingredient.itemCodeableConcept != null) {
        const ingredientGroup = this.fb.group({
          itemCodeableConcept: [ingredient.itemCodeableConcept],
          strength: [ingredient.strength]
        });
        ingredientArray.push(ingredientGroup);
        const strengthControl = ingredientGroup.get('strength');
        const strengthValueString$ = strengthControl.valueChanges
          .pipe(
            filter(value => typeof value === 'string')
          );
        strengthValueString$
          .pipe(
            takeUntil(this.unsubscribeTrigger$),
            tap(
              () => {
                this.formState.loading = true;
                this._formStateService.clearList(medicationRoot);
              }
            ),
            switchMap(_ =>
              this._cioDcSource.postMedicationKnowledgeDetailsByRouteCodeAndFormCodeAndIngredient(
                medicationRoot.id,
                medicationRoot.code,
                medicationRoot.form,
                this.getStrengthControlByIngredient(medicationRoot.ingredient, ingredient.itemCodeableConcept, null),
                null
              )
            ),
            catchError(err => {
              console.log('Error: ', err);
              return of({parameter: []} as Parameters);
            })
          ).subscribe(parameters => this._formStateService.buildList(medicationRoot.id, parameters));
        strengthValueString$
          .pipe(
            takeUntil(this.unsubscribeTrigger$)
          ).subscribe(
          _ =>
            this._formStateService.dispatchIntent(
              new MedicationFormIntentDetailsMedication(
                medicationRoot.id,
                medicationRoot.form,
                this.getStrengthControlByIngredient(medicationRoot.ingredient, ingredient.itemCodeableConcept, null),
                null
              )
            )
        );

        const strengthValueRatio$ = strengthControl.valueChanges
          .pipe(
            filter(value => value.hasOwnProperty('numerator'))
          );
        strengthValueRatio$
          .pipe(
            takeUntil(this.unsubscribeTrigger$),
            tap(
              () => {
                this.formState.loading = true;
                this._formStateService.clearList(medicationRoot);
              }
            ),
            switchMap(value =>
              this._cioDcSource.postMedicationKnowledgeDetailsByRouteCodeAndFormCodeAndIngredient(
                medicationRoot.id,
                medicationRoot.code,
                medicationRoot.form,
                this.getStrengthControlByIngredient(medicationRoot.ingredient, ingredient.itemCodeableConcept, value),
                null
              )
            ),
            catchError(err => {
              console.log('Error: ', err);
              return of({parameter: []} as Parameters);
            })
          ).subscribe(parameters => this._formStateService.buildList(medicationRoot.id, parameters));
        strengthValueRatio$
          .pipe(
            takeUntil(this.unsubscribeTrigger$)
          ).subscribe(
          value =>
            this._formStateService.dispatchIntent(
              new MedicationFormIntentDetailsMedication(
                medicationRoot.id,
                medicationRoot.form,
                this.getStrengthControlByIngredient(medicationRoot.ingredient, ingredient.itemCodeableConcept, value),
                null
              )
            )
        );
      }
      else if (ingredient.itemReference != null) {
        const ingredientGroup = this.fb.group({
          itemReference: [ingredient.itemReference],
          strength: this.fb.group({
            numeratorValue: [undefined],
            numeratorUnit: [{
              code: undefined,
              display: undefined,
              system: undefined
            }]
          })
        });
        ingredientArray.push(ingredientGroup);
      }
    }

    const formControl = this.getFormControlByGroup(medicationGroup);
    const formValueString$ = formControl.valueChanges
      .pipe(
        filter(value => typeof value === 'string')
      );
    formValueString$
      .pipe(
        takeUntil(this.unsubscribeTrigger$),
        tap(
          () => {
            this.formState.loading = true;
            this._formStateService.clearList(medicationRoot);
          }),
        switchMap(_ =>
          this._cioDcSource.postMedicationKnowledgeDetailsByRouteCodeAndFormCodeAndIngredient(
            medicationRoot.id, medicationRoot.code,
            null,
            medicationRoot.ingredient,
            null
          )
        ),
        catchError(err => {
          console.log('Error: ', err);
          return of({parameter: []} as Parameters);
        })
      ).subscribe(parameters => this._formStateService.buildList(medicationRoot.id, parameters));
    formValueString$
      .pipe(
        takeUntil(this.unsubscribeTrigger$)
      ).subscribe(
      _ =>
        this._formStateService.dispatchIntent(
          new MedicationFormIntentDetailsMedication(
            medicationRoot.id,
            null,
            medicationRoot.ingredient,
            null
          )
        )
    );

    const formValueCodeableConcept$ = formControl.valueChanges
      .pipe(
        filter(value => value.hasOwnProperty('text'))
      );
    formValueCodeableConcept$
      .pipe(
        takeUntil(this.unsubscribeTrigger$),
        tap(
          () => {
            this.formState.loading = true;
            this._formStateService.clearList(medicationRoot);
          }),
        switchMap(value =>
          this._cioDcSource.postMedicationKnowledgeDetailsByRouteCodeAndFormCodeAndIngredient(
            medicationRoot.id,
            medicationRoot.code,
            value,
            medicationRoot.ingredient,
            null
          )
        ),
        catchError(err => {
          console.log('Error: ', err);
          return of({parameter: []} as Parameters);
        })
      ).subscribe(parameters => this._formStateService.buildList(medicationRoot.id, parameters));
    formValueCodeableConcept$
      .pipe(
        takeUntil(this.unsubscribeTrigger$)
      ).subscribe(
      value =>
        this._formStateService.dispatchIntent(
          new MedicationFormIntentDetailsMedication(
            medicationRoot.id,
            value,
            medicationRoot.ingredient,
            null
          )
        )
    );

    for (const ingredient of medicationRoot.ingredient) {
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

  private findFormGroup(resourceId: id, controls: AbstractControl[], path: string | (string | number)[]): FormGroup | null {
    const nIndex = controls.findIndex(
      (_medicationGroup: AbstractControl, _) => {
        const medicationControl = _medicationGroup.get(path);
        return medicationControl.value != null && medicationControl.value.id === resourceId;
      }
    );

    if (nIndex === -1) {
      console.log('Error: cannot find route control');
      return null;
    }
    return controls[nIndex] as FormGroup;
  }
}
