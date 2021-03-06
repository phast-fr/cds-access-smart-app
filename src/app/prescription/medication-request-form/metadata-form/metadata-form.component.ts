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
import {AbstractControl, FormBuilder, FormControl, FormGroup} from '@angular/forms';
import {BehaviorSubject, Observable, Subject} from 'rxjs';
import {filter, takeUntil, tap} from 'rxjs/operators';

import {IRender} from '../../../common/cds-access/models/state.model';
import {MedicationRequestFormState} from '../medication-request-form.state';
import {FhirLabelProviderFactory} from '../../../common/fhir/providers/fhir.label.provider.factory';
import {MedicationRequestFormViewModel} from '../medication-request-form.view-model';
import {
  MedicationFormIntentValueChangesTreatmentIntent
} from '../medication-request-form.intent';
import {code, CodeableConcept, MedicationRequest, ValueSetContains} from 'phast-fhir-ts';
import {FhirTypeGuard} from '../../../common/fhir/utils/fhir.type.guard';

@Component({
  selector: 'app-metadata-form',
  templateUrl: './metadata-form.component.html',
  styleUrls: ['./metadata-form.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MetadataFormComponent implements OnInit, OnDestroy, IRender<MedicationRequestFormState> {

  private readonly _unsubscribeTrigger$: Subject<void>;

  private readonly _metadataGroup$: BehaviorSubject<FormGroup | boolean>;

  constructor(
      private _fb: FormBuilder,
      private _labelProviderFactory: FhirLabelProviderFactory,
      private _viewModel: MedicationRequestFormViewModel
  ) {
    this._unsubscribeTrigger$ = new Subject<void>();
    this._metadataGroup$ = new BehaviorSubject<FormGroup | boolean>(false);
  }

  public get metadataGroup$(): Observable<FormGroup | boolean> {
    return this._metadataGroup$.asObservable();
  }

  public get metadataGroup(): FormGroup | null {
    if (this._metadataGroup$.value) {
      return this._metadataGroup$.value as FormGroup;
    }
    return null;
  }

  public get treatmentIntentList(): Array<ValueSetContains> | undefined {
    return this._viewModel.treatmentIntent;
  }

  public toFormControl(control: AbstractControl): FormControl {
    return control as FormControl;
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

    this._metadataGroup$.complete();
  }

  public render(state: MedicationRequestFormState): void {
    const medicationRequest = state.bundle?.entry?.filter(entry => FhirTypeGuard.isMedicationRequest(entry.resource))
        .map(entry => entry.resource as MedicationRequest)
        .reduce((_, current: MedicationRequest) => current);
    switch (state.type) {
      case 'AddMedication':
        if (medicationRequest) {
          this._metadataGroup$.next(
            this.addMedication(medicationRequest)
          );
        }
        break;
      case 'RemoveMedication':
        if (medicationRequest && this.metadataGroup) {
          this._metadataGroup$.next(this.metadataGroup);
        }
        else {
          this._metadataGroup$.next(false);
        }
        break;
      case 'AddMedicationRequest':
        this._metadataGroup$.next(false);
        break;
    }
  }

  public trackByValueSetContains(_: number, valueSetContains: ValueSetContains): code | undefined {
    return valueSetContains.code;
  }

  public displayFnValueSetContains(valueSetContains: ValueSetContains): string | undefined {
    const provider = this._labelProviderFactory.getProvider('fhir.ValueSetContains');
    if (provider) {
      return provider.getText(valueSetContains);
    }
    return undefined;
  }

  private addMedication(medicationRequest: MedicationRequest): FormGroup {
    let treatmentIntent: CodeableConcept | undefined;
    if (medicationRequest.extension) {
      medicationRequest.extension.forEach(value => {
        if (value.url === 'http://interopsante.org/fhir/StructureDefinition/FrTreatmentIntent') {
          treatmentIntent = value.valueCodeableConcept;
        }
      });
    }
    const metadataGroup = this._fb.group({
      treatmentIntent: [treatmentIntent]
    });
    this.setUp(metadataGroup);
    return metadataGroup;
  }

  private setUp(metadataGroup: FormGroup): void {
    if (metadataGroup) {
      const treatmentIntent = metadataGroup.get('treatmentIntent');
      if (treatmentIntent) {
        const treatmentIntentValid$ = treatmentIntent.valueChanges
          .pipe(
            filter(predicate => {
              if (this._viewModel.treatmentIntent) {
                return this._viewModel.treatmentIntent.findIndex(value => value.code === predicate.code) > -1;
              }
              return false;
            })
          );
        const treatmentIntentNotValid$ = treatmentIntent.valueChanges
          .pipe(
            filter(predicate => {
              if (this._viewModel.treatmentIntent) {
                return this._viewModel.treatmentIntent.findIndex(
                  value => value.code === predicate.code
                ) === -1;
              }
              return false;
            })
          );

        treatmentIntentValid$
          .pipe(
            takeUntil(this._unsubscribeTrigger$),
            tap(value => treatmentIntent
              .setValue(value, {emitEvent: false}))
          )
          .subscribe({
            next: value => {
              if (this._viewModel.bundle) {
                this._viewModel.dispatchIntent(
                  new MedicationFormIntentValueChangesTreatmentIntent(
                    this._viewModel.bundle,
                    value
                  )
                );
              }
            },
            error: err => console.error('error', err)
          });
        treatmentIntentNotValid$
          .pipe(
            takeUntil(this._unsubscribeTrigger$),
            tap(() => treatmentIntent
              .setValue(null, {emitEvent: false}))
          )
          .subscribe({
            next: () => {
              if (this._viewModel.bundle) {
                this._viewModel.dispatchIntent(
                  new MedicationFormIntentValueChangesTreatmentIntent(
                    this._viewModel.bundle,
                    null
                  )
                );
              }
            },
            error: err => console.error('error', err)
          });
      }
    }
  }
}
