import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormControl } from '@angular/forms';
import { Observable, Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, takeUntil } from 'rxjs/operators';

import { MedicationRequestFormService } from '../medication-request-form.service';
import {
  MedicationFormIntentValueChangesDispenseRequest
} from '../medication-request-form.intent';
import { MedicationRequestFormState } from '../medication-request-form.state';

@Component({
  selector: 'app-dispense-request-form',
  templateUrl: './dispense-request-form.component.html',
  styleUrls: ['./dispense-request-form.component.css']
})
export class DispenseRequestFormComponent implements OnInit, OnDestroy {

  private unsubscribeTrigger$ = new Subject<void>();

  dispenseRequest = this.fb.group({
    validityPeriod: this.fb.group({
      start: [undefined],
      end: [undefined]
    }),
    expectedSupplyDuration: this.fb.group({
      value: [undefined]
    })
  });

  constructor(
    private _formStateService: MedicationRequestFormService,
    private fb: FormBuilder) { }

  public get formState(): MedicationRequestFormState {
    return this._formStateService.formState;
  }

  public get dispenseRequestValidityPeriodStart(): FormControl {
    return this.dispenseRequest.get(['validityPeriod', 'start']) as FormControl;
  }

  public get dispenseRequestValidityPeriodEnd(): FormControl {
    return this.dispenseRequest.get(['validityPeriod', 'end']) as FormControl;
  }

  public get dispenseRequestExpectedSupplyDurationValue(): FormControl {
    return this.dispenseRequest.get(['expectedSupplyDuration', 'value']) as FormControl;
  }

  ngOnInit(): void {
    this.setUpOnChange();
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

  private setUpOnChange(): void {
    this.dispenseRequest.valueChanges
      .pipe(
        takeUntil(this.unsubscribeTrigger$),
        debounceTime(500),
        distinctUntilChanged()
      ).subscribe(changes => this._formStateService.dispatchIntent(
        new MedicationFormIntentValueChangesDispenseRequest(changes)
    ));
  }

  private render(formState: MedicationRequestFormState): void {
    const options = {emitEvent: false};
    switch (formState.type) {
      case 'AddMedication':
        this.dispenseRequestValidityPeriodStart.setValue(
          this.formState.medicationRequest.dispenseRequest.validityPeriod.start, options
        );
        this.dispenseRequestValidityPeriodEnd.setValue(
          this.formState.medicationRequest.dispenseRequest.validityPeriod.end, options
        );
        this.dispenseRequestExpectedSupplyDurationValue.setValue(
          this.formState.medicationRequest.dispenseRequest.expectedSupplyDuration.value, options
        );
        break;
      case 'AddMedicationRequest':
        this.dispenseRequestValidityPeriodStart.reset(undefined, options);
        this.dispenseRequestValidityPeriodEnd.reset(undefined, options);
        this.dispenseRequestExpectedSupplyDurationValue.reset(undefined, options);
        break;
    }
  }
}
