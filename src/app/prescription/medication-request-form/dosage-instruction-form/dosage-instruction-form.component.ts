/**
 * @license
 * Copyright PHAST SARL All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://cds-access.phast.fr/license
 */
import {ChangeDetectionStrategy, Component, OnDestroy, OnInit} from '@angular/core';
import {AbstractControl, FormArray, FormBuilder, FormControl, Validators} from '@angular/forms';
import {BehaviorSubject, Observable, Subject} from 'rxjs';
import { debounceTime, distinctUntilChanged, filter, takeUntil, tap } from 'rxjs/operators';

import {IRender} from '../../../common/cds-access/models/state.model';
import { Utils } from '../../../common/cds-access/utils/utils';
import { FhirLabelProviderFactory } from '../../../common/fhir/providers/fhir.label.provider.factory';
import { MedicationRequestFormViewModel } from '../medication-request-form-view-model';
import { MedicationRequestFormState } from '../medication-request-form.state';
import {
  MedicationFormIntentAddDosageInstruction,
  MedicationFormIntentAddDoseAndRate,
  MedicationFormIntentAddTimeOfDay,
  MedicationFormIntentRemoveDosageInstruction,
  MedicationFormIntentRemoveDoseAndRate,
  MedicationFormIntentRemoveTimeOfDay,
  MedicationFormIntentValueChangesDosageInstructionDoseQuantityValue,
  MedicationFormIntentValueChangesDosageInstructionDoseQuantityUnit,
  MedicationFormIntentValueChangesDosageInstructionDurationValue,
  MedicationFormIntentValueChangesDosageInstructionDurationUnit,
  MedicationFormIntentValueChangesDosageInstructionRoute,
  MedicationFormIntentValueChangesDosageInstructionTimeOfDayValue,
} from '../medication-request-form.intent';
import {CodeableConcept, Coding, Medication, MedicationKnowledge, UnitsOfTime} from 'phast-fhir-ts';

@Component({
  selector: 'app-dosage-instruction-form',
  templateUrl: './dosage-instruction-form.component.html',
  styleUrls: ['./dosage-instruction-form.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DosageInstructionFormComponent implements OnInit, OnDestroy, IRender<MedicationRequestFormState | boolean> {

  private readonly _unsubscribeTrigger$: Subject<void>;

  private readonly _dosageInstruction$: BehaviorSubject<FormArray | boolean>;

  constructor(private _viewModel: MedicationRequestFormViewModel,
              private _labelProviderFactory: FhirLabelProviderFactory,
              private _fb: FormBuilder) {
    this._unsubscribeTrigger$ = new Subject<void>();
    this._dosageInstruction$ = new BehaviorSubject<FormArray | boolean>(false);
  }

  public toFormControl(control: AbstractControl): FormControl {
    return control as FormControl;
  }

  public toFormArray(control: AbstractControl): FormArray {
    return control as FormArray;
  }

  public get dosageInstruction$(): Observable<FormArray | boolean> {
    return this._dosageInstruction$.asObservable();
  }

  public get dosageInstruction(): FormArray | null {
    if (this._dosageInstruction$.value) {
      return this._dosageInstruction$.value as FormArray;
    }
    return null;
  }

  public get isLoading$(): Observable<boolean> {
    return this._viewModel.isLoading$;
  }

  public get routeArray(): Array<CodeableConcept> {
    return this._viewModel.routeArray;
  }

  public get durationUnitArray(): Array<UnitsOfTime> {
    return this._viewModel.durationUnitArray;
  }

  public get doseAndRateUnitArray(): Array<Coding> {
    if (this._viewModel.medicationRequest.contained.length > 1) {
      return this._viewModel.doseAndRateUnitMap.get(
        this._viewModel.medicationRequest.contained[1].id);
    }
    return this._viewModel.doseAndRateUnitMap.get(
      this._viewModel.medicationRequest.contained[0].id);
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

    this._dosageInstruction$.complete();
  }

  public render(state: MedicationRequestFormState): void {
    const dosageInstruction = this._dosageInstruction$.value as FormArray;
    switch (state.type) {
      case 'AddMedication':
        this._dosageInstruction$.next(this._fb.array([], this.formArrayMinLength(1)));
        break;
      case 'AddDosageInstruction':
        this.addDosageInstruction(dosageInstruction);
        this._dosageInstruction$.next(dosageInstruction);
        break;
      case 'RemoveDosageInstruction':
        dosageInstruction.removeAt(state.nDosage);
        this._dosageInstruction$.next(dosageInstruction);
        break;
      case 'AddTimeOfDay':
        const addTimeOfDay = dosageInstruction.at(state.nDosage).get(['timing', 'repeat', 'timeOfDay']) as FormArray;
        this.addTimeOfDay(state.nDosage, addTimeOfDay);
        this._dosageInstruction$.next(dosageInstruction);
        break;
      case 'RemoveTimeOfDay':
        const removeTimeOfDay = dosageInstruction.at(state.nDosage).get(['timing', 'repeat', 'timeOfDay']) as FormArray;
        removeTimeOfDay.removeAt(state.index);
        this._dosageInstruction$.next(dosageInstruction);
        break;
      case 'AddDoseAndRate':
        const addDoseAndRate = dosageInstruction.at(state.nDosage).get('doseAndRate') as FormArray;
        this.addDoseAndRate(
          state.nDosage,
          addDoseAndRate
        );
        this._dosageInstruction$.next(dosageInstruction);
        break;
      case 'RemoveDoseAndRate':
        const removeDoseAndRate = dosageInstruction.at(state.nDosage).get('doseAndRate') as FormArray;
        removeDoseAndRate.removeAt(state.index);
        this._dosageInstruction$.next(dosageInstruction);
        break;
      case 'AddMedicationRequest':
        this._dosageInstruction$.next(false);
        break;
      default:
        this._dosageInstruction$.next(dosageInstruction);
        break;
    }
  }

  public onAddDosageInstruction(): void {
    this._viewModel.dispatchIntent(
      new MedicationFormIntentAddDosageInstruction(this._viewModel.medicationRequest)
    );
  }

  public onRemoveDosageInstruction(nDosage: number): void {
    const medication = this._viewModel.medicationRequest.contained[0] as Medication;
    const medicationKnowledge = this.medicationKnowledgeMap(medication);

    this._viewModel.dispatchIntent(
      new MedicationFormIntentRemoveDosageInstruction(this._viewModel.medicationRequest, nDosage, medicationKnowledge, medication)
    );
  }

  public onAddTimeOfDay(nDosage: number): void {
    this._viewModel.dispatchIntent(new MedicationFormIntentAddTimeOfDay(nDosage));
  }

  public onRemoveTimeOfDay(nDosage: number, index: number): void {
    this._viewModel.dispatchIntent(
      new MedicationFormIntentRemoveTimeOfDay(this._viewModel.medicationRequest, nDosage, index)
    );
  }

  public onAddDoseAndRate(nDosage: number): void {
    this._viewModel.dispatchIntent(new MedicationFormIntentAddDoseAndRate(nDosage));
  }

  public onRemoveDoseAndRate(nDosage: number, index: number): void {
    this._viewModel.dispatchIntent(
      new MedicationFormIntentRemoveDoseAndRate(this._viewModel.medicationRequest, nDosage, index)
    );
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

  public trackByIndex(index: number): number {
    return index;
  }

  private addDosageInstruction(dosageInstruction: FormArray): void {
    const dosageInstructionGroup = this._fb.group({
      'track-id': Utils.randomString(16),
      route: [undefined, [Validators.required]],
      timing: this._fb.group({
        repeat: this._fb.group({
          duration: [undefined], // How long when it happens
          durationUnit: [undefined], // s | min | h | d | wk | mo | a - unit of time (UCUM)
          timeOfDay: this._fb.array([]) // Time of day for action
        })
      }),
      doseAndRate: this._fb.array([])
    });
    const nDosage = dosageInstruction.length;
    dosageInstruction.push(dosageInstructionGroup);

    const routeString$ = dosageInstructionGroup.get('route').valueChanges
      .pipe(
        filter(value => typeof value === 'string')
      );
    const routeObj$ = dosageInstructionGroup.get('route').valueChanges
      .pipe(
        filter(value => value instanceof Object)
      );
    routeString$
      .pipe(
        takeUntil(this._unsubscribeTrigger$),
        tap(() => dosageInstructionGroup.get('route').setValue(null, {emitEvent: false}))
      )
      .subscribe({
        next: () => {
          const medication = this._viewModel.medicationRequest.contained[0] as Medication;
          const medicationKnowledge = this.medicationKnowledgeMap(medication);
          this._viewModel.dispatchIntent(
            new MedicationFormIntentValueChangesDosageInstructionRoute(
              this._viewModel.medicationRequest,
              nDosage,
              null,
              medicationKnowledge,
              medication
            )
          );
        },
        error: err => console.error('error', err)
      });
    routeObj$
      .pipe(
        takeUntil(this._unsubscribeTrigger$),
        tap(value => dosageInstructionGroup.get('route').setValue(value, {emitEvent: false}))
      )
      .subscribe({
        next: value => {
          const medication = this._viewModel.medicationRequest.contained[0] as Medication;
          const medicationKnowledge = this.medicationKnowledgeMap(medication);
          this._viewModel.dispatchIntent(
            new MedicationFormIntentValueChangesDosageInstructionRoute(
              this._viewModel.medicationRequest,
              nDosage,
              value,
              medicationKnowledge,
              medication
            )
          );
        },
        error: err => console.error('error', err)
      });
    dosageInstructionGroup.get(['timing', 'repeat', 'duration']).valueChanges
      .pipe(
        takeUntil(this._unsubscribeTrigger$),
        tap(value => dosageInstructionGroup.get(['timing', 'repeat', 'duration']).setValue(value, {emitEvent: false}))
      )
      .subscribe({
        next: value => this._viewModel.dispatchIntent(
          new MedicationFormIntentValueChangesDosageInstructionDurationValue(
            this._viewModel.medicationRequest,
            nDosage,
            value
          )
        ),
        error: err => console.error('error', err)
      });
    const durationUnitValid$ = dosageInstructionGroup.get(['timing', 'repeat', 'durationUnit']).valueChanges
      .pipe(
        filter(predicate => this._viewModel.durationUnitArray.findIndex(
          value => value === predicate
        ) > -1)
      );
    const durationUnitNotValid$ = dosageInstructionGroup.get(['timing', 'repeat', 'durationUnit']).valueChanges
      .pipe(
        filter(predicate => this._viewModel.durationUnitArray.findIndex(
          value => value === predicate
        ) === -1)
      );

    durationUnitValid$
      .pipe(
        takeUntil(this._unsubscribeTrigger$),
        tap(value => dosageInstructionGroup.get(['timing', 'repeat', 'durationUnit'])
          .setValue(value, {emitEvent: false}))
      )
      .subscribe({
        next: value => this._viewModel.dispatchIntent(
          new MedicationFormIntentValueChangesDosageInstructionDurationUnit(
            this._viewModel.medicationRequest,
            nDosage,
            value
          )
        ),
        error: err => console.error('error', err)
      });
    durationUnitNotValid$
      .pipe(
        takeUntil(this._unsubscribeTrigger$),
        tap(() => dosageInstructionGroup.get(['timing', 'repeat', 'durationUnit'])
          .setValue(null, {emitEvent: false}))
      )
      .subscribe({
        next: () => this._viewModel.dispatchIntent(
          new MedicationFormIntentValueChangesDosageInstructionDurationUnit(
            this._viewModel.medicationRequest,
            nDosage,
            null
          )
        ),
        error: err => console.error('error', err)
      });
  }

  private addTimeOfDay(nDosage: number, timeOfDay: FormArray): void {
    const nTimeOfDay = timeOfDay.length;
    const timeOfDayControl = this._fb.control(undefined);
    timeOfDay.push(timeOfDayControl);
    timeOfDayControl.valueChanges
      .pipe(
        takeUntil(this._unsubscribeTrigger$),
        debounceTime(500),
        distinctUntilChanged(),
        tap(value => timeOfDayControl.setValue(value, {emitEvent: false}))
      )
      .subscribe({
        next: value => this._viewModel.dispatchIntent(
          new MedicationFormIntentValueChangesDosageInstructionTimeOfDayValue(
            this._viewModel.medicationRequest,
            nDosage,
            nTimeOfDay,
            value
          )
        ),
        error: err => console.error('error', err)
      });
  }

  private addDoseAndRate(nDosage: number, doseAndRate: FormArray): void {
    const doseAndRateGroup = this._fb.group({
      doseQuantity: this._fb.group({
        value: [null],
        unit: [null]
      }),
    });
    const nDoseAndRate = doseAndRate.length;
    doseAndRate.push(doseAndRateGroup);
    doseAndRateGroup.get(['doseQuantity', 'value']).valueChanges
      .pipe(
        takeUntil(this._unsubscribeTrigger$),
        debounceTime(500),
        distinctUntilChanged(),
        tap(value => doseAndRateGroup.get(['doseQuantity', 'value']).setValue(value, {emitEvent: false}))
      )
      .subscribe({
        next: value => this._viewModel.dispatchIntent(
          new MedicationFormIntentValueChangesDosageInstructionDoseQuantityValue(
            this._viewModel.medicationRequest,
            nDosage,
            nDoseAndRate,
            value
          )
        ),
        error: err => console.error('error', err)
      });
    const doseQuantityUnitString$ = doseAndRateGroup.get(['doseQuantity', 'unit']).valueChanges
      .pipe(
        filter(value => typeof value === 'string')
      );
    const doseQuantityUnitObj$ = doseAndRateGroup.get(['doseQuantity', 'unit']).valueChanges
      .pipe(
        filter(value => value instanceof Object)
      );
    doseQuantityUnitString$
      .pipe(
        takeUntil(this._unsubscribeTrigger$),
        tap(() => doseAndRateGroup.get(['doseQuantity', 'unit']).setValue(null, {emitEvent: false}))
      )
      .subscribe({
        next: () => this._viewModel.dispatchIntent(
          new MedicationFormIntentValueChangesDosageInstructionDoseQuantityUnit(
            this._viewModel.medicationRequest,
            nDosage,
            nDoseAndRate,
            null
          )
        ),
        error: err => console.error('error', err)
      });
    doseQuantityUnitObj$
      .pipe(
        takeUntil(this._unsubscribeTrigger$),
        tap(value => doseAndRateGroup.get(['doseQuantity', 'unit']).setValue(value, {emitEvent: false}))
      )
      .subscribe({
        next: value => this._viewModel.dispatchIntent(
          new MedicationFormIntentValueChangesDosageInstructionDoseQuantityUnit(
            this._viewModel.medicationRequest,
            nDosage,
            nDoseAndRate,
            value
          )
        ),
        error: err => console.error('error', err)
      });
  }

  private medicationKnowledgeMap(medication: Medication): MedicationKnowledge {
    if (this._viewModel.medicationKnowledgeMap.has(medication.id)) {
      return this._viewModel.medicationKnowledgeMap.get(medication.id);
    }
    const medicationId = medication.ingredient[0].itemReference.reference.substring(1);
    return this._viewModel.medicationKnowledgeMap.get(medicationId);
  }

  private formArrayMinLength = (min: number) => {
    return (c: AbstractControl): {[key: string]: any} => {
      if (c.value.length >= min) { return null; }
      return {formArrayMinLength: true};
    };
  }
}
