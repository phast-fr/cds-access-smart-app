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

  public get isLoadingList$(): Observable<boolean> {
    return this._viewModel.isLoadingCIOList$;
  }

  public get formList(): Array<CodeableConcept> {
    const map = this._viewModel.formMap.get(this._viewModel.medication.id);
    const input = Array.from(map.values());
    const comparator = (a: CodeableConcept, b: CodeableConcept) => {
      return a.text === b.text;
    };
    return Utils.intersect<CodeableConcept>(input[0], input, comparator);
  }

  public strengthList(itemCodeableConcept: id): Array<Ratio> {
    const map = this._viewModel.strengthMap.get(itemCodeableConcept);
    const input = Array.from(map.values());
    const comparator = (a: Ratio, b: Ratio) => {
      return a.numerator.value === b.numerator.value;
    };
    return Utils.intersect<Ratio>(input[0], input, comparator);
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
          this.addMedication(0, state.medicationRequest.contained[0])
        );
        break;
      case 'RemoveMedication':
        this._medicationGroup$.next(false);
        break;
      case 'ValueChangesMedication':
      case 'ValueChangesDosageInstruction':
        this._medicationGroup$.next(
          this.updateMedication(0, state.medicationRequest.contained[0])
        );
        break;
      case 'AddMedicationRequest':
        this._medicationGroup$.next(false);
        break;
    }
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

  public doseAndRateUnitList(reference: Reference): Array<Coding> {
    const map = this._viewModel.doseAndRateUnitMap.get(reference.reference.substring(1));
    const input = Array.from(map.values());
    const comparator = (a: Coding, b: Coding) => {
      return a.code === b.code && a.system === b.system;
    };
    return Utils.intersect<Coding>(input[0], input, comparator);
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

  private addMedication(nMedication: number, medication: Medication): FormGroup {
    const medicationGroup = this._fb.group({
      'track-id': Utils.randomString(16),
      medication: [medication],
      ingredient: this._fb.array([]),
      form: [medication.form]
    });
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
        tap(() => medicationGroup.get('form').reset(null, {emitEvent: false}))
      )
      .subscribe({
        next: () => {
          this._viewModel.dispatchIntent(
            new MedicationFormIntentValueChangesMedicationForm(
              this._viewModel.medicationRequest,
              medication,
              null
            )
          );
        },
        error: err => console.error('error', err)
      });
    formObj$
      .pipe(
        takeUntil(this._unsubscribeTrigger$),
        distinctUntilChanged<CodeableConcept>((prev, curr) => prev.text === curr.text),
        tap(value => medicationGroup.get('form').setValue(value, {emitEvent: false}))
      )
      .subscribe({
        next: value => this._viewModel.dispatchIntent(
          new MedicationFormIntentValueChangesMedicationForm(
            this._viewModel.medicationRequest,
            medication,
            value
          )
        ),
        error: err => console.error('error', err)
      });

    const ingredientArray = medicationGroup.get('ingredient') as FormArray;
    for (const ingredient of medication.ingredient) {
      if (ingredient.itemCodeableConcept) {
        ingredientArray.push(this.addIngredientCodeableConcept(nMedication, medication, ingredient));
      }
      else if (ingredient.itemReference) {
        ingredientArray.push(this.addIngredientReference(medication, ingredient));
      }
    }

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

    return medicationGroup;
  }

  private updateMedication(nMedication: number, medication: Medication): FormGroup | boolean {
    if (this._medicationGroup$.value) {
      const medicationGroup = this._medicationGroup$.value as FormGroup;
      if (medication?.form) {
        medicationGroup.get('form').setValue(medication.form, {emitEvent: false});
      }
      else {
        medicationGroup.get('form').reset(undefined, {emitEvent: false});
      }

      const ingredientArray = medicationGroup.get('ingredient') as FormArray;
      let nIngredient = 0;
      for (const item of medication.ingredient) {
        if (item.itemCodeableConcept) {
          if (item?.strength) {
            ingredientArray.at(nIngredient).get('strength').setValue(item.strength, {emitEvent: false});
          }
          else {
            ingredientArray.at(nIngredient).get('strength').reset(undefined, {emitEvent: false});
          }
        }
        nIngredient++;
      }

      return medicationGroup;
    }
    return false;
  }

  private medicationKnowledgeMap(medication: Medication): MedicationKnowledge {
    if (this._viewModel.medicationKnowledgeMap.has(medication.id)) {
      return this._viewModel.medicationKnowledgeMap.get(medication.id);
    }
    const medicationId = medication.ingredient[0].itemReference.reference.substring(1);
    return this._viewModel.medicationKnowledgeMap.get(medicationId);
  }

  private addIngredientCodeableConcept(nMedication: number, medication: Medication,
                                       ingredient: MedicationIngredient): FormGroup {
    const ingredientGroup = this._fb.group({
      'track-id': Utils.randomString(16),
      itemCodeableConcept: ingredient.itemCodeableConcept,
      strength: ingredient.strength
    });

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
        tap(() => ingredientGroup.get('strength').reset(null, {emitEvent: false}))
      )
      .subscribe({
        next: () => {
          const itemCodeableConcept = ingredientGroup.get('itemCodeableConcept').value;
          const form = this.form(nMedication);

          this._viewModel.dispatchIntent(
            new MedicationFormIntentValueChangesMedicationIngredientStrength(
              this._viewModel.medicationRequest,
              medication,
              itemCodeableConcept,
              null
            )
          );
        },
        error: err => console.error('error', err)
      });
    strengthObj$
      .pipe(
        takeUntil(this._unsubscribeTrigger$),
        distinctUntilChanged<Ratio>((prev, curr) => prev.numerator.value === curr.numerator.value),
        tap(value => ingredientGroup.get('strength').setValue(value, {emitEvent: false}))
      )
      .subscribe({
        next: value => {
          const itemCodeableConcept = ingredientGroup.get('itemCodeableConcept').value;
          const form = this.form(nMedication);

          this._viewModel.dispatchIntent(
            new MedicationFormIntentValueChangesMedicationIngredientStrength(
              this._viewModel.medicationRequest,
              medication,
              itemCodeableConcept,
              value
            )
          );
        },
        error: err => console.error('error', err)
      });
    return ingredientGroup;
  }

  private addIngredientReference(medication: Medication, ingredient: MedicationIngredient): FormGroup {
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
        tap(() => ingredientGroup.get(['strength', 'numerator', 'unit']).reset(null, {emitEvent: false}))
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
        distinctUntilChanged<Coding>((prev, cur) => prev.code === cur.code),
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
    return ingredientGroup;
  }

  private form(nMedication: number): CodeableConcept | undefined {
    if (this._viewModel.medicationRequest) {
      const medication = this._viewModel.medicationRequest.contained[nMedication] as Medication;
      return medication?.form;
    }
    return undefined;
  }

  private onLoadedList(): void {
    if (this._medicationGroup$.value) {
      const medicationGroup = this._medicationGroup$.value as FormGroup;
      if (this.formList.length === 0) {
        medicationGroup.get('form').disable();
      }
      else {
        medicationGroup.get('form').enable();
      }

      const ingredientFormArray = medicationGroup.get('ingredient') as FormArray;
      this._viewModel.medicationRequest.contained.forEach((value) => {
        const medication = value as Medication;
        medication.ingredient.forEach((ingredient, nIngredient) => {
          if (ingredient.itemCodeableConcept && this.strengthList(ingredient.itemCodeableConcept.text).length === 0) {
            ingredientFormArray.at(nIngredient).disable();
          }
          else if (ingredient.itemCodeableConcept) {
            ingredientFormArray.at(nIngredient).enable();
          }
        });
      });
    }
  }
}
