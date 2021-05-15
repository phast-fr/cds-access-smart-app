import { Component, OnDestroy, OnInit } from '@angular/core';
import { AbstractControl, FormArray, FormBuilder } from '@angular/forms';
import { merge, Observable, of, Subject } from 'rxjs';
import { catchError, debounceTime, distinctUntilChanged, filter, map, switchMap, takeUntil, tap } from 'rxjs/operators';

import { MedicationRequestFormService } from '../medication-request-form.service';
import { MedicationRequestFormState } from '../medication-request-form.state';
import {
  MedicationFormIntentAddDosageInstruction,
  MedicationFormIntentAddDoseAndRate,
  MedicationFormIntentAddTimeOfDay,
  MedicationFormIntentRemoveDosageInstruction,
  MedicationFormIntentRemoveDoseAndRate,
  MedicationFormIntentRemoveTimeOfDay,
  MedicationFormIntentValueChangesDosageInstruction
} from '../medication-request-form.intent';
import { FhirCioDcService } from '../../../common/services/fhir.cio.dc.service';
import { FhirLabelProviderFactory } from '../../../common/fhir/fhir.label.provider.factory';
import { fhir } from '../../../common/fhir/fhir.types';
import Medication = fhir.Medication;
import Parameters = fhir.Parameters;
import CodeableConcept = fhir.CodeableConcept;
import Coding = fhir.Coding;

@Component({
  selector: 'app-dosage-instruction-form',
  templateUrl: './dosage-instruction-form.component.html',
  styleUrls: ['./dosage-instruction-form.component.css']
})
export class DosageInstructionFormComponent implements OnInit, OnDestroy {

  private unsubscribeTrigger$ = new Subject<void>();

  private _unsubscribeTriggerDosageInstruction$ = new Subject<void>();

  private _labelProviderFactory = new FhirLabelProviderFactory();

  dosageInstruction = this.fb.array([]);

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

  ngOnInit(): void {
    this.subscribeUI(this._formStateService.formStateObservable);
  }

  ngOnDestroy(): void {
    this._unsubscribeTriggerDosageInstruction$.next();
    this._unsubscribeTriggerDosageInstruction$.complete();
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

  onAddDosageInstruction(): void {
    this._formStateService.dispatchIntent(new MedicationFormIntentAddDosageInstruction());
  }

  onRemoveDosageInstruction(nDosage: number): void {
    this._formStateService.dispatchIntent(new MedicationFormIntentRemoveDosageInstruction(nDosage));
  }

  onAddTimeOfDay(nDosage: number): void {
    this._formStateService.dispatchIntent(new MedicationFormIntentAddTimeOfDay(nDosage));
  }

  onRemoveTimeOfDay(nDosage: number, index: number): void {
    this._formStateService.dispatchIntent(new MedicationFormIntentRemoveTimeOfDay(nDosage, index));
  }

  onAddDoseAndRate(nDosage: number): void {
    this._formStateService.dispatchIntent(new MedicationFormIntentAddDoseAndRate(nDosage));
  }

  onRemoveDoseAndRate(nDosage: number, index: number): void {
    this._formStateService.dispatchIntent(new MedicationFormIntentRemoveDoseAndRate(nDosage, index));
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

  private render(formState: MedicationRequestFormState): void {
    switch (formState.type) {
      case 'AddDosageInstruction':
        this.addDosageInstruction(
          formState.medicationRequest.contained[formState.medicationRequest.contained.length - 1] as Medication,
          this.dosageInstruction
        );
        break;
      case 'RemoveDosageInstruction':
        this.dosageInstruction.removeAt(formState.nDosage);
        break;
      case 'AddTimeOfDay':
        const addTimeOfDay = this.dosageInstruction.at(formState.nDosage).get(['timing', 'repeat', 'timeOfDay']) as FormArray;
        addTimeOfDay.push(this.fb.control(undefined));
        break;
      case 'RemoveTimeOfDay':
        const removeTimeOfDay = this.dosageInstruction.at(formState.nDosage).get(['timing', 'repeat', 'timeOfDay']) as FormArray;
        removeTimeOfDay.removeAt(formState.index);
        break;
      case 'AddDoseAndRate':
        const addDoseAndRate = this.dosageInstruction.at(formState.nDosage).get('doseAndRate') as FormArray;
        const doseQuantity = formState.medicationRequest.dosageInstruction[formState.nDosage]
          .doseAndRate[addDoseAndRate.length].doseQuantity;
        const doseAndRateGroup = this.fb.group({
          doseRange: [undefined],
          doseQuantity: this.fb.group({
            value: [doseQuantity.value],
            unit: [{
              code: doseQuantity.code,
              display: doseQuantity.unit,
              system: doseQuantity.system
            }]
          }),
          rateRatio: [undefined],
          rateRange: [undefined],
          rateQuantity: [undefined]
        });
        addDoseAndRate.push(doseAndRateGroup);
        break;
      case 'RemoveDoseAndRate':
        const removeDoseAndRate = this.dosageInstruction.at(formState.nDosage).get('doseAndRate') as FormArray;
        removeDoseAndRate.removeAt(formState.index);
        break;
      case 'AddMedicationRequest':
        this.dosageInstruction.clear();
        break;
    }
  }

  private addDosageInstruction(medication: Medication, dosageInstruction: FormArray): void {
    const dosageInstructionGroup = this.fb.group({
      route: [undefined],
      timing: this.fb.group({
        repeat: this.fb.group({
          duration: [undefined], // How long when it happens
          durationUnit: [undefined], // s | min | h | d | wk | mo | a - unit of time (UCUM)
          timeOfDay: this.fb.array([]) // Time of day for action
        })
      }),
      doseAndRate: this.fb.array([])
    });
    dosageInstruction.push(dosageInstructionGroup);
    this._unsubscribeTriggerDosageInstruction$.next();
    merge(...dosageInstruction.controls.map(
      (control: AbstractControl, index: number) =>
        control.valueChanges
          .pipe(
            takeUntil(this._unsubscribeTriggerDosageInstruction$),
            debounceTime(500),
            distinctUntilChanged(),
            map(value => ({ dosageIndex: index, value }))
          )
      )
    ).subscribe(changes => this._formStateService.dispatchIntent(
      new MedicationFormIntentValueChangesDosageInstruction(changes.dosageIndex, changes.value)
    ));

    const routeControl = dosageInstructionGroup.get('route');
    const routeValueString$ = routeControl.valueChanges
      .pipe(
        filter(value => typeof value === 'string')
      );
    routeValueString$
      .pipe(
        takeUntil(this._unsubscribeTriggerDosageInstruction$),
        tap(
          () => {
            this.formState.loading = true;
            this._formStateService.clearList(medication);
          }),
        switchMap(_ =>
          this._cioDcSource.postMedicationKnowledgeDetailsByRouteCodeAndFormCodeAndIngredient(
            medication.id, medication.code,
            medication.form,
            medication.ingredient,
            null)
        ),
        catchError(err => {
          console.log('Error: ', err);
          return of({parameter: []} as Parameters);
        })
      ).subscribe(parameters => this._formStateService.buildList(medication.id, parameters));

    const routeValueCodeableConcept$ = routeControl.valueChanges
      .pipe(
        filter(value => value.hasOwnProperty('text'))
      );
    routeValueCodeableConcept$
      .pipe(
        takeUntil(this._unsubscribeTriggerDosageInstruction$),
        tap(
          () => {
            this.formState.loading = true;
            this._formStateService.clearList(medication);
          }),
        switchMap(value =>
          this._cioDcSource.postMedicationKnowledgeDetailsByRouteCodeAndFormCodeAndIngredient(
            medication.id, medication.code,
            medication.form,
            medication.ingredient,
            value)
        ),
        catchError(err => {
          console.log('Error: ', err);
          return of({parameter: []} as Parameters);
        })
      ).subscribe(parameters => this._formStateService.buildList(medication.id, parameters));
  }
}
