import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormControl } from '@angular/forms';
import { Observable, Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, filter, switchMap, takeUntil, tap } from 'rxjs/operators';

import { MedicationRequestFormService } from './medication-request-form.service';
import {
  MedicationFormIntentAddMedication,
  MedicationFormIntentAddMedicationRequest, MedicationFormIntentCdsHelp
} from './medication-request-form.intent';
import { MedicationRequestFormState } from './medication-request-form.state';
import { FhirCioDcService } from '../../common/services/fhir.cio.dc.service';
import { FhirLabelProviderFactory } from '../../common/fhir/fhir.label.provider.factory';
import { FhirTypeGuard } from '../../common/fhir/fhir.type.guard';
import { fhir } from '../../common/fhir/fhir.types';
import MedicationKnowledge = fhir.MedicationKnowledge;
import Bundle = fhir.Bundle;

@Component({
  selector: 'app-medication-request-form',
  templateUrl: './medication-request-form.component.html',
  styleUrls: ['./medication-request-form.component.css']
})
export class MedicationRequestFormComponent implements OnInit, OnDestroy {

  private _unsubscribeTrigger$ = new Subject<void>();

  private _labelProviderFactory = new FhirLabelProviderFactory();

  // TODO share medicationRequestGroup
  medicationRequestGroup = this.fb.group({
    medicationKnowledge: [undefined]
  });

  private _medicationKnowledgeArray = new Array<MedicationKnowledge>();

  isMedicationAddable = false;

  constructor(private _cioDcSource: FhirCioDcService,
              private _formStateService: MedicationRequestFormService,
              private fb: FormBuilder) { }

  public debug(object: any): void {
    console.log(object);
  }

  public get medicationKnowledge(): FormControl {
    return this.medicationRequestGroup.get('medicationKnowledge') as FormControl;
  }

  public get medicationKnowledgeArray(): Array<MedicationKnowledge> {
    return this._medicationKnowledgeArray;
  }

  public get formState(): MedicationRequestFormState {
    return this._formStateService.formState;
  }

  public get labelProviderFactory(): FhirLabelProviderFactory {
    return this._labelProviderFactory;
  }

  ngOnInit(): void {
    this.setUpOnChange();
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

  trackByMedicationKnowledge(_, medicationKnowledge: MedicationKnowledge): string {
    return medicationKnowledge.code.text;
  }

  displayFnMedicationKnowledge(medicationKnowledge: MedicationKnowledge): string | null {
    if (medicationKnowledge == null) { return null; }
    return this._labelProviderFactory.getProvider(medicationKnowledge).getText(medicationKnowledge);
  }

  onAddMedication(): void {
    const medicationKnowledge = this.medicationKnowledge.value;
    const medicationId = this._formStateService.nextMedicationId();

    this._formStateService.dispatchIntent(
      new MedicationFormIntentAddMedication(this.formState.medicationRequest, medicationKnowledge, medicationId)
    );
    this.medicationKnowledge.reset(null, {emitEvent: false});
    this.isMedicationAddable = false;
  }

  onAddMedicationRequest(): void {
    this._formStateService.dispatchIntent(
      new MedicationFormIntentAddMedicationRequest(this.formState.medicationRequest)
    );
  }

  onCDSHelp(): void {
    this._formStateService.dispatchIntent(
      new MedicationFormIntentCdsHelp(this.formState.medicationRequest)
    );
  }

  private setUpOnChange(): void {
    const medicationKnowledgeControlString$ = this.medicationKnowledge.valueChanges
      .pipe(
        filter(value => typeof value === 'string')
      );
    medicationKnowledgeControlString$
      .pipe(
        takeUntil(this._unsubscribeTrigger$),
        debounceTime(500),
        distinctUntilChanged(),
        tap(
        () => {
          this._medicationKnowledgeArray.length = 0;
          this.formState.loading = true;
        }),
        switchMap(value => this._cioDcSource.searchMedicationKnowledgeDC(value))
      ).subscribe(
      response => {
        const bundle = response as Bundle;
        if (bundle.total > 0) {
          for (const entry of bundle.entry) {
            if (FhirTypeGuard.isMedicationKnowledge(entry.resource)) {
              this._medicationKnowledgeArray.push(entry.resource);
            }
          }
        }
        this.formState.loading = false;
      });

    const medicationKnowledgeControlFhir$ = this.medicationKnowledge.valueChanges
      .pipe(
        filter(value => FhirTypeGuard.isMedicationKnowledge(value))
      );
    medicationKnowledgeControlFhir$
      .pipe(
        takeUntil(this._unsubscribeTrigger$)
      )
      .subscribe(() => this.isMedicationAddable = true);
  }

  private render(formState: MedicationRequestFormState): void {
    switch (formState.type) {
      case 'AddMedicationRequest':
        this.medicationKnowledge.reset(undefined, {emitEvent: false});
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
}
