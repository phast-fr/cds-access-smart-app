import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormArray, FormBuilder } from '@angular/forms';
import { Observable, Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, filter, takeUntil, tap } from 'rxjs/operators';

import { Utils } from '../../../common/utils';
import { MedicationRequestFormService } from '../medication-request-form.service';
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
import { FhirCioDcService } from '../../../common/services/fhir.cio.dc.service';
import { FhirLabelProviderFactory } from '../../../common/fhir/fhir.label.provider.factory';
import { fhir } from '../../../common/fhir/fhir.types';
import CodeableConcept = fhir.CodeableConcept;
import Coding = fhir.Coding;
import Quantity = fhir.Quantity;
import Medication = fhir.Medication;
import MedicationKnowledge = fhir.MedicationKnowledge;

@Component({
  selector: 'app-dosage-instruction-form',
  templateUrl: './dosage-instruction-form.component.html',
  styleUrls: ['./dosage-instruction-form.component.css']
})
export class DosageInstructionFormComponent implements OnInit, OnDestroy {

  private _unsubscribeTrigger$ = new Subject<void>();

  private _labelProviderFactory = new FhirLabelProviderFactory();

  dosageInstruction = this.fb.array([]);

  constructor(private _cioDcSource: FhirCioDcService,
              private _formStateService: MedicationRequestFormService,
              private fb: FormBuilder) { }

  public get formState(): MedicationRequestFormState {
    return this._formStateService.formState;
  }

  public get labelProviderFactory(): FhirLabelProviderFactory {
    return this._labelProviderFactory;
  }

  public get doseAndRateUnitArray(): Array<Coding> {
    if (this.formState.medicationRequest.contained.length > 1) {
      return this.formState.doseAndRateUnitMap.get(
        this.formState.medicationRequest.contained[1].id);
    }
    return this.formState.doseAndRateUnitMap.get(
      this.formState.medicationRequest.contained[0].id);
  }

  ngOnInit(): void {
    this.subscribeUI(this._formStateService.formStateObservable);
  }

  ngOnDestroy(): void {
    this._unsubscribeTrigger$.next();
    this._unsubscribeTrigger$.complete();
  }

  subscribeUI(state$: Observable<MedicationRequestFormState>): void {
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

  onAddDosageInstruction(): void {
    this._formStateService.dispatchIntent(new MedicationFormIntentAddDosageInstruction(this.formState.medicationRequest));
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
    return this._labelProviderFactory.getProvider('fhir.CodeableConcept').getText(codeableConcept);
  }

  trackByCoding(_, coding: Coding): string {
    return coding.code;
  }

  displayFnCoding(coding: Coding): string | null {
    return this._labelProviderFactory.getProvider('fhir.Coding').getText(coding);
  }

  private render(formState: MedicationRequestFormState): void {
    switch (formState.type) {
      case 'AddDosageInstruction':
        this.addDosageInstruction(
          this.dosageInstruction
        );
        break;
      case 'RemoveDosageInstruction':
        this.dosageInstruction.removeAt(formState.nDosage);
        break;
      case 'AddTimeOfDay':
        const addTimeOfDay = this.dosageInstruction.at(formState.nDosage).get(['timing', 'repeat', 'timeOfDay']) as FormArray;
        this.addTimeOfDay(formState.nDosage, addTimeOfDay);
        break;
      case 'RemoveTimeOfDay':
        const removeTimeOfDay = this.dosageInstruction.at(formState.nDosage).get(['timing', 'repeat', 'timeOfDay']) as FormArray;
        removeTimeOfDay.removeAt(formState.index);
        break;
      case 'AddDoseAndRate':
        const addDoseAndRate = this.dosageInstruction.at(formState.nDosage).get('doseAndRate') as FormArray;
        const doseQuantity = formState.medicationRequest.dosageInstruction[formState.nDosage]
          .doseAndRate[addDoseAndRate.length].doseQuantity;
        this.addDoseAndRate(
          formState.nDosage,
          doseQuantity,
          addDoseAndRate
        );
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

  private addDosageInstruction(dosageInstruction: FormArray): void {
    const dosageInstructionGroup = this.fb.group({
      'track-id': Utils.randomString(16),
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
        tap(_ => dosageInstructionGroup.get('route').setValue(null, {emitEvent: false}))
      )
      .subscribe(_ => {
        const medication = this.formState.medicationRequest.contained[0] as Medication;
        const medicationKnowledge = this.medicationKnowledgeMap(medication);
        this._formStateService.dispatchIntent(
          new MedicationFormIntentValueChangesDosageInstructionRoute(
            this.formState.medicationRequest,
            nDosage,
            null,
            medicationKnowledge,
            medication
          )
        );
      });
    routeObj$
      .pipe(
        takeUntil(this._unsubscribeTrigger$)
      )
      .subscribe(value => {
        const medication = this.formState.medicationRequest.contained[0] as Medication;
        const medicationKnowledge = this.medicationKnowledgeMap(medication);
        this._formStateService.dispatchIntent(
          new MedicationFormIntentValueChangesDosageInstructionRoute(
            this.formState.medicationRequest,
            nDosage,
            value,
            medicationKnowledge,
            medication
          )
        );
      });
    dosageInstructionGroup.get(['timing', 'repeat', 'duration']).valueChanges
      .pipe(
        takeUntil(this._unsubscribeTrigger$)
      )
      .subscribe(durationValue => this._formStateService.dispatchIntent(
        new MedicationFormIntentValueChangesDosageInstructionDurationValue(
          this.formState.medicationRequest,
          nDosage,
          durationValue
        )
      ));
    const durationUnitValid$ = dosageInstructionGroup.get(['timing', 'repeat', 'durationUnit']).valueChanges
      .pipe(
        filter(predicate => this.formState.durationUnitArray.findIndex(
          value => value === predicate
        ) > -1)
      );
    const durationUnitNotValid$ = dosageInstructionGroup.get(['timing', 'repeat', 'durationUnit']).valueChanges
      .pipe(
        filter(predicate => this.formState.durationUnitArray.findIndex(
          value => value === predicate
        ) === -1)
      );

    durationUnitValid$
      .pipe(
        takeUntil(this._unsubscribeTrigger$)
      )
      .subscribe(durationUnit => this._formStateService.dispatchIntent(
        new MedicationFormIntentValueChangesDosageInstructionDurationUnit(
          this.formState.medicationRequest,
          nDosage,
          durationUnit
        )
      ));
    durationUnitNotValid$
      .pipe(
        takeUntil(this._unsubscribeTrigger$)
      )
      .subscribe(_ =>
        dosageInstructionGroup.get(['timing', 'repeat', 'durationUnit']).setValue(null, {emitEvent: false})
    );
  }

  private addTimeOfDay(nDosage: number, timeOfDay: FormArray): void {
    const nTimeOfDay = timeOfDay.length;
    const timeOfDayControl = this.fb.control(undefined);
    timeOfDay.push(timeOfDayControl);
    timeOfDayControl.valueChanges
      .pipe(
        takeUntil(this._unsubscribeTrigger$),
        debounceTime(500),
        distinctUntilChanged()
      )
      .subscribe(timeOfDayValue =>
        this._formStateService.dispatchIntent(
          new MedicationFormIntentValueChangesDosageInstructionTimeOfDayValue(
            this.formState.medicationRequest,
            nDosage,
            nTimeOfDay,
            timeOfDayValue
          )
        )
      );
  }

  private addDoseAndRate(nDosage: number, doseQuantity: Quantity, doseAndRate: FormArray): void {
    const doseAndRateGroup = this.fb.group({
      doseQuantity: this.fb.group({
        value: [doseQuantity.value],
        unit: [{
          code: doseQuantity.code,
          display: doseQuantity.unit,
          system: doseQuantity.system
        }]
      }),
    });
    const nDoseAndRate = doseAndRate.length;
    doseAndRate.push(doseAndRateGroup);
    doseAndRateGroup.get(['doseQuantity', 'value']).valueChanges
      .pipe(
        takeUntil(this._unsubscribeTrigger$),
        debounceTime(500),
        distinctUntilChanged()
      )
      .subscribe(doseQuantityValue =>
        this._formStateService.dispatchIntent(
          new MedicationFormIntentValueChangesDosageInstructionDoseQuantityValue(
            this.formState.medicationRequest,
            nDosage,
            nDoseAndRate,
            doseQuantityValue
          )
        )
      );
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
        debounceTime(500),
        distinctUntilChanged(),
      )
      .subscribe(_ => {
        this._formStateService.dispatchIntent(
          new MedicationFormIntentValueChangesDosageInstructionDoseQuantityUnit(
            this.formState.medicationRequest,
            nDosage,
            nDoseAndRate,
            null
          )
        );
      });
    doseQuantityUnitObj$
      .pipe(
        takeUntil(this._unsubscribeTrigger$),
      )
      .subscribe(doseQuantityUnit =>
        this._formStateService.dispatchIntent(
          new MedicationFormIntentValueChangesDosageInstructionDoseQuantityUnit(
            this.formState.medicationRequest,
            nDosage,
            nDoseAndRate,
            doseQuantityUnit
          )
        )
      );
  }

  private medicationKnowledgeMap(medication: Medication): MedicationKnowledge {
    if (this.formState.medicationKnowledgeMap.has(medication.id)) {
      return this.formState.medicationKnowledgeMap.get(medication.id);
    }
    const medicationId = medication.ingredient[0].itemReference.reference.substring(1);
    return this.formState.medicationKnowledgeMap.get(medicationId);
  }
}
