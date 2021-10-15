/*
 * MIT License
 *
 * Copyright (c) 2021 PHAST
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */
import {ChangeDetectionStrategy, Component, OnDestroy, OnInit} from '@angular/core';
import {FormBuilder, FormControl, FormGroup, Validators} from '@angular/forms';
import {BehaviorSubject, Observable, Subject} from 'rxjs';
import {debounceTime, distinctUntilChanged, filter, takeUntil} from 'rxjs/operators';

import {IRender} from '../../../common/cds-access/models/state.model';
import { MedicationRequestFormViewModel } from '../medication-request-form.view-model';
import {
  MedicationFormIntentValueChangesDispenseRequest
} from '../medication-request-form.intent';
import { MedicationRequestFormState } from '../medication-request-form.state';
import {MedicationRequestDispenseRequest} from 'phast-fhir-ts';
import {DateTime} from 'luxon';
import {environment} from '../../../../environments/environment';

@Component({
  selector: 'app-dispense-request-form',
  templateUrl: './dispense-request-form.component.html',
  styleUrls: ['./dispense-request-form.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DispenseRequestFormComponent implements OnInit, OnDestroy, IRender<MedicationRequestFormState | boolean> {

  private readonly _unsubscribeTrigger$: Subject<void>;

  private readonly _dispenseRequestGroup$: BehaviorSubject<FormGroup | boolean>;

  constructor(private _fb: FormBuilder,
              private _viewModel: MedicationRequestFormViewModel) {
    this._unsubscribeTrigger$ = new Subject<void>();
    this._dispenseRequestGroup$ = new BehaviorSubject<FormGroup | boolean>(false);
  }

  public get dispenseRequestGroup$(): Observable<FormGroup | boolean> {
    return this._dispenseRequestGroup$.asObservable();
  }

  public get dispenseRequestGroup(): FormGroup | undefined {
    if (this._dispenseRequestGroup$.value) {
      return this._dispenseRequestGroup$.value as FormGroup;
    }
    return undefined;
  }

  public get dispenseRequestValidityPeriodStart(): FormControl | undefined {
    if (this.dispenseRequestGroup) {
      return this.dispenseRequestGroup.get(['validityPeriod', 'start']) as FormControl;
    }
    return undefined;
  }

  public get dispenseRequestValidityPeriodEnd(): FormControl | undefined {
    if (this.dispenseRequestGroup) {
      return this.dispenseRequestGroup.get(['validityPeriod', 'end']) as FormControl;
    }
    return undefined;
  }

  public get dispenseRequestExpectedSupplyDurationValue(): FormControl | undefined {
    if (this.dispenseRequestGroup) {
      return this.dispenseRequestGroup.get(['expectedSupplyDuration', 'value']) as FormControl;
    }
    return undefined;
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
        }
      );
  }

  public ngOnDestroy(): void {
    this._unsubscribeTrigger$.next();
    this._unsubscribeTrigger$.complete();

    this._dispenseRequestGroup$.complete();
  }

  public render(state: MedicationRequestFormState): void {
    switch (state.type) {
      case 'AddMedication':
        if (state.medicationRequest?.dispenseRequest) {
          this._dispenseRequestGroup$.next(
            this.addMedication(state.medicationRequest.dispenseRequest)
          );
        }
        break;
      case 'RemoveMedication':
        if (state.medicationRequest && this.dispenseRequestGroup) {
          this._dispenseRequestGroup$.next(this.dispenseRequestGroup);
        }
        else {
          this._dispenseRequestGroup$.next(false);
        }
        break;
      case 'AddMedicationRequest':
        this._dispenseRequestGroup$.next(false);
        break;
    }
  }

  private addMedication(dispenseRequest: MedicationRequestDispenseRequest): FormGroup {
    const options = {emitEvent: false};
    const dispenseGroup = this._fb.group({
      validityPeriod: this._fb.group({
        start: [(dispenseRequest.validityPeriod?.start) ?
          DateTime.fromFormat(dispenseRequest.validityPeriod.start, environment.fhir_date_format)
            .toFormat(environment.display_date_format) : undefined,
          Validators.pattern( /\d{2}\/\d{2}\/\d{4} \d{2}:\d{2}/ )],
        end: [dispenseRequest.validityPeriod?.end]
      }),
      expectedSupplyDuration: this._fb.group({
        value: [dispenseRequest.expectedSupplyDuration?.value]
      })
    });
    dispenseGroup.valueChanges
      .pipe(
        takeUntil(this._unsubscribeTrigger$),
        debounceTime(500),
        distinctUntilChanged()
      ).subscribe({
      next: changes => {
        if (this.dispenseRequestValidityPeriodStart) {
          this.dispenseRequestValidityPeriodStart.setValue(
            changes.validityPeriod.start, options
          );
        }

        if (this.dispenseRequestValidityPeriodEnd) {
          this.dispenseRequestValidityPeriodEnd.setValue(
            changes.validityPeriod.end, options
          );
        }

        if (this.dispenseRequestExpectedSupplyDurationValue) {
          this.dispenseRequestExpectedSupplyDurationValue.setValue(
            changes.expectedSupplyDuration.value, options
          );
        }

        if (this._viewModel.medicationRequest) {
          this._viewModel.dispatchIntent(
            new MedicationFormIntentValueChangesDispenseRequest(
              this._viewModel.medicationRequest,
              changes
            )
          );
        }
      },
      error: err => console.error('error', err)
    });
    return dispenseGroup;
  }
}
