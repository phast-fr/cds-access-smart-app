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
import {AbstractControl, FormArray, FormBuilder, FormControl, FormGroup, Validators} from '@angular/forms';
import {BehaviorSubject, Observable, Subject} from 'rxjs';
import {debounceTime, distinctUntilChanged, filter, takeUntil, tap} from 'rxjs/operators';

import {DateTime} from 'luxon';
import {nanoid} from 'nanoid';
import {CodeableConcept, code, Coding, Dosage, UnitsOfTime, ValueSetContains} from 'phast-fhir-ts';

import {IRender} from '../../../common/cds-access/models/state.model';
import { FhirLabelProviderFactory } from '../../../common/fhir/providers/fhir.label.provider.factory';
import { MedicationRequestFormViewModel } from '../medication-request-form.view-model';
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
  MedicationFormIntentValueChangesDosageInstructionBoundsDurationValue,
  MedicationFormIntentValueChangesDosageInstructionBoundsDurationUnit,
  MedicationFormIntentValueChangesDosageInstructionBoundsPeriodStart,
  MedicationFormIntentValueChangesDosageInstructionBoundsPeriodEnd,
  MedicationFormIntentValueChangesDosageInstructionDayOfWeek,
  MedicationFormIntentValueChangesDosageInstructionFrequencyValue,
  MedicationFormIntentValueChangesDosageInstructionPeriodUnit,
  MedicationFormIntentValueChangesDosageInstructionPeriodValue,
  MedicationFormIntentValueChangesDosageInstructionWhenValue,
  MedicationFormIntentAddWhen,
  MedicationFormIntentRemoveWhen,
  MedicationFormIntentValueChangesDosageInstructionOffsetValue,
  MedicationFormIntentValueChangesDosageInstructionRateRatioNumeratorUnit,
  MedicationFormIntentValueChangesDosageInstructionRateRatioNumeratorValue,
  MedicationFormIntentValueChangesDosageInstructionRateRatioDenominatorValue,
  MedicationFormIntentValueChangesDosageInstructionRateRatioDenominatorUnit,
} from '../medication-request-form.intent';

import {environment} from '../../../../environments/environment';

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

  public get dosageInstruction(): FormArray | undefined {
    if (this._dosageInstruction$.value) {
      return this._dosageInstruction$.value as FormArray;
    }
    return undefined;
  }

  public get isLoadingList$(): Observable<boolean> {
    return this._viewModel.isLoadingCIOList$;
  }

  public routeArray(nDosage: number): Array<CodeableConcept> | undefined {
    return this._viewModel.routeMap?.get(nDosage);
  }

  public get durationUnitArray(): Array<ValueSetContains> | undefined {
    return this._viewModel.durationUnitArray;
  }

  public get whenArray(): Array<ValueSetContains> | undefined {
    return this._viewModel.whenArray;
  }

  public doseAndRateUnitArray(nDosage: number): Array<Coding> | undefined {
    if (this._viewModel.medication?.id && this._viewModel.doseAndRateUnitMap) {
      const doseAndRateUnitForMed = this._viewModel.doseAndRateUnitMap.get(this._viewModel.medication.id);
      if (doseAndRateUnitForMed) {
        return doseAndRateUnitForMed.get(nDosage);
      }
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
      });
  }

  public ngOnDestroy(): void {
    this._unsubscribeTrigger$.next();
    this._unsubscribeTrigger$.complete();

    this._dosageInstruction$.complete();
  }

  public render(state: MedicationRequestFormState): void {
    switch (state.type) {
      case 'AddMedication':
        if (state.medicationRequest?.dosageInstruction) {
          this._dosageInstruction$.next(
            this._fb.array([
              this.addDosageInstruction(
                state.medicationRequest.dosageInstruction[0],
                0
              )
            ], this.formArrayMinLength(1)));
        }
        break;
      case 'RemoveMedication':
        if (state.medicationRequest && this.dosageInstruction) {
          this._dosageInstruction$.next(this.dosageInstruction);
        }
        else {
          this._dosageInstruction$.next(false);
        }
        break;
      case 'AddDosageInstruction':
        if (state.nDosage && state.medicationRequest?.dosageInstruction) {
          this.dosageInstruction?.push(
            this.addDosageInstruction(
              state.medicationRequest.dosageInstruction[state.nDosage],
              state.nDosage
            )
          );
        }
        if (this.dosageInstruction) {
          this._dosageInstruction$.next(this.dosageInstruction);
        }
        else {
          this._dosageInstruction$.next(false);
        }
        break;
      case 'RemoveDosageInstruction':
        if (state.nDosage) {
          this.dosageInstruction?.removeAt(state.nDosage);
        }
        if (this.dosageInstruction) {
          this._dosageInstruction$.next(this.dosageInstruction);
        }
        else {
          this._dosageInstruction$.next(false);
        }
        break;
      case 'AddTimeOfDay':
        if (typeof state.nDosage === 'number') {
          const addTimeOfDay = this.dosageInstruction?.at(state.nDosage).get(['timing', 'repeat', 'timeOfDay']) as FormArray;
          addTimeOfDay.push(this.addTimeOfDay(state.nDosage, addTimeOfDay.length));
        }
        if (this.dosageInstruction) {
          this._dosageInstruction$.next(this.dosageInstruction);
        }
        else {
          this._dosageInstruction$.next(false);
        }
        break;
      case 'RemoveTimeOfDay':
        if (typeof state.nDosage === 'number' && typeof state.index === 'number') {
          const removeTimeOfDay = this.dosageInstruction?.at(state.nDosage).get(['timing', 'repeat', 'timeOfDay']) as FormArray;
          removeTimeOfDay.removeAt(state.index);
        }
        if (this.dosageInstruction) {
          this._dosageInstruction$.next(this.dosageInstruction);
        }
        else {
          this._dosageInstruction$.next(false);
        }
        break;
      case 'AddWhen':
        if (typeof state.nDosage === 'number') {
          const addWhen = this.dosageInstruction?.at(state.nDosage).get(['timing', 'repeat', 'when']) as FormArray;
          addWhen.push(this.addWhen(state.nDosage, addWhen.length));
        }
        if (this.dosageInstruction) {
          this._dosageInstruction$.next(this.dosageInstruction);
        }
        else {
          this._dosageInstruction$.next(false);
        }
        break;
      case 'RemoveWhen':
        if (typeof state.nDosage === 'number' && typeof state.index === 'number') {
          const removeWhen = this.dosageInstruction?.at(state.nDosage).get(['timing', 'repeat', 'when']) as FormArray;
          removeWhen.removeAt(state.index);
        }
        if (this.dosageInstruction) {
          this._dosageInstruction$.next(this.dosageInstruction);
        }
        else {
          this._dosageInstruction$.next(false);
        }
        break;
      case 'AddDoseAndRate':
        if (typeof state.nDosage === 'number') {
          const addDoseAndRate = this.dosageInstruction?.at(state.nDosage).get('doseAndRate') as FormArray;
          addDoseAndRate.push(
            this.addDoseAndRate(
              state.nDosage,
              addDoseAndRate.length
            )
          );
        }
        if (this.dosageInstruction) {
          this._dosageInstruction$.next(this.dosageInstruction);
        }
        else {
          this._dosageInstruction$.next(false);
        }
        break;
      case 'RemoveDoseAndRate':
        if (typeof state.nDosage === 'number' && typeof state.index === 'number') {
          const removeDoseAndRate = this.dosageInstruction?.at(state.nDosage).get('doseAndRate') as FormArray;
          removeDoseAndRate.removeAt(state.index);
        }
        if (this.dosageInstruction) {
          this._dosageInstruction$.next(this.dosageInstruction);
        }
        else {
          this._dosageInstruction$.next(false);
        }
        break;
      case 'ValueChangesDosageInstruction':
        if (typeof state.nDosage === 'number' && state.medicationRequest?.dosageInstruction) {
          this.updateDosageInstruction(
            state.medicationRequest.dosageInstruction[state.nDosage],
            this.dosageInstruction?.at(state.nDosage) as FormGroup
          );
        }
        if (this.dosageInstruction) {
          this._dosageInstruction$.next(this.dosageInstruction);
        }
        else {
          this._dosageInstruction$.next(false);
        }
        break;
      case 'ValueChangesMedication':
        if (state.medicationRequest?.dosageInstruction) {
          state.medicationRequest.dosageInstruction.forEach((dosage: Dosage, nDosage: number) => {
            this.updateDosageInstruction(
              dosage,
              this.dosageInstruction?.at(nDosage) as FormGroup
            );
          });
        }
        if (this.dosageInstruction) {
          this._dosageInstruction$.next(this.dosageInstruction);
        }
        else {
          this._dosageInstruction$.next(false);
        }
        break;
      case 'AddMedicationRequest':
        this._dosageInstruction$.next(false);
        break;
    }
  }

  public onAddDosageInstruction(): void {
    if (this._viewModel.medicationRequest) {
      this._viewModel.dispatchIntent(
        new MedicationFormIntentAddDosageInstruction(this._viewModel.medicationRequest)
      );
    }
  }

  public onRemoveDosageInstruction(nDosage: number): void {
    if (this._viewModel.medicationRequest) {
      this._viewModel.dispatchIntent(
        new MedicationFormIntentRemoveDosageInstruction(this._viewModel.medicationRequest, nDosage)
      );
    }
  }

  public onAddTimeOfDay(nDosage: number): void {
    this._viewModel.dispatchIntent(new MedicationFormIntentAddTimeOfDay(nDosage));
  }

  public onRemoveTimeOfDay(nDosage: number, nTimeOfDay: number): void {
    if (this._viewModel.medicationRequest) {
      this._viewModel.dispatchIntent(
        new MedicationFormIntentRemoveTimeOfDay(this._viewModel.medicationRequest, nDosage, nTimeOfDay)
      );
    }
  }

  public onAddWhen(nDosage: number): void {
    this._viewModel.dispatchIntent(new MedicationFormIntentAddWhen(nDosage));
  }

  public onRemoveWhen(nDosage: number, nWhen: number): void {
    if (this._viewModel.medicationRequest) {
      this._viewModel.dispatchIntent(
        new MedicationFormIntentRemoveWhen(this._viewModel.medicationRequest, nDosage, nWhen)
      );
    }
  }

  public onAddDoseAndRate(nDosage: number): void {
    this._viewModel.dispatchIntent(new MedicationFormIntentAddDoseAndRate(nDosage));
  }

  public onRemoveDoseAndRate(nDosage: number, nDoseAndRate: number): void {
    if (this._viewModel.medicationRequest) {
      this._viewModel.dispatchIntent(
        new MedicationFormIntentRemoveDoseAndRate(this._viewModel.medicationRequest, nDosage, nDoseAndRate)
      );
    }
  }

  public trackByCodeableConcept(_: number, codeableConcept: CodeableConcept): string | undefined {
    return codeableConcept.text;
  }

  public displayFnCodeableConcept(codeableConcept: CodeableConcept): string | undefined {
    return this._labelProviderFactory.getProvider('fhir.CodeableConcept')?.getText(codeableConcept);
  }

  public trackByCoding(_: number, coding: Coding): string | undefined {
    return coding.code;
  }

  public displayFnCoding(coding: Coding): string | undefined {
    return this._labelProviderFactory.getProvider('fhir.Coding')?.getText(coding);
  }

  public trackByValueSetContains(_: number, valueSetContains: ValueSetContains): string | undefined {
    return valueSetContains.code;
  }

  public displayFnValueSetContains(valueSetContains: ValueSetContains): string | undefined {
    return this._labelProviderFactory.getProvider('fhir.ValueSetContains')?.getText(valueSetContains);
  }

  public trackByIndex(index: number): number {
    return index;
  }

  public dayOfWeekLabel(dayOfWeek: code): string | undefined {
    switch (dayOfWeek) {
      case 'mon':
        return 'lundi';
      case 'tue':
        return 'mardi';
      case 'wed':
        return 'mercredi';
      case 'thu':
        return 'jeudi';
      case 'fri':
        return 'vendredi';
      case 'sat':
        return 'samedi';
      case 'sun':
        return 'dimanche';
    }
  }

  private addDosageInstruction(dosage: Dosage, nDosage: number): FormGroup {
    const dosageInstructionGroup = this._fb.group({
      'track-id': nanoid(16),
      route: [dosage.route, [Validators.required]],
      timing: this._fb.group({
        repeat: this._fb.group({
          boundsMode: ['duration'],
          boundsDuration: this._fb.group({
            value: [dosage.timing?.repeat?.boundsDuration?.value, Validators.pattern( /\d/ )],
            unit: [undefined],
          }),
          boundsPeriod: this._fb.group({
            start: [(dosage.timing?.repeat?.boundsPeriod?.start) ?
              DateTime.fromFormat(dosage.timing?.repeat?.boundsPeriod?.start, environment.fhir_date_format)
                .toFormat(environment.display_date_format) : undefined,
              Validators.pattern( /\d{2}\/\d{2}\/\d{4} \d{2}:\d{2}/ )],
            end: [(dosage.timing?.repeat?.boundsPeriod?.end) ?
              DateTime.fromFormat(dosage.timing?.repeat?.boundsPeriod?.end, environment.fhir_date_format)
                .toFormat(environment.display_date_format) : undefined,
              Validators.pattern( /\d{2}\/\d{2}\/\d{4} \d{2}:\d{2}/ )]
          }),
          duration: [dosage.timing?.repeat?.duration], // How long when it happens
          durationUnit: [undefined],
          frequency: [dosage.timing?.repeat?.frequency, Validators.pattern( /\d/ )],
          period: [dosage.timing?.repeat?.period],
          periodUnit: [undefined],
          timeOfDay: this._fb.array([]), // Time of day for action
          dayOfWeek: this._fb.array([
            this._fb.group({
              name: ['mon'],
              checked: [false]
            }),
            this._fb.group({
              name: ['tue'],
              checked: [false]
            }),
            this._fb.group({
              name: ['wed'],
              checked: [false]
            }),
            this._fb.group({
              name: ['thu'],
              checked: [false]
            }),
            this._fb.group({
              name: ['fri'],
              checked: [false]
            }),
            this._fb.group({
              name: ['sat'],
              checked: [false]
            }),
            this._fb.group({
              name: ['sun'],
              checked: [false]
            })
          ]),
          when: this._fb.array([]),
          offset: [dosage.timing?.repeat?.offset, Validators.pattern( /\d/ )]
        })
      }),
      doseAndRate: this._fb.array([], Validators.required)
    });

    const routeControl = dosageInstructionGroup.get('route');
    if (routeControl) {
      const routeObj$ = routeControl.valueChanges
        .pipe(
          filter(value => value instanceof Object)
        );

      const routeString$ = routeControl.valueChanges
        .pipe(
          filter(value => typeof value === 'string')
        );

      routeString$
        .pipe(
          takeUntil(this._unsubscribeTrigger$),
          tap(() => routeControl.reset(undefined, {emitEvent: false}))
        )
        .subscribe({
          next: () => {
            if (this._viewModel.medicationRequest && this._viewModel.medication) {
              this._viewModel.dispatchIntent(
                new MedicationFormIntentValueChangesDosageInstructionRoute(
                  this._viewModel.medicationRequest,
                  nDosage,
                  null,
                  this._viewModel.medication
                )
              );
            }
          },
          error: err => console.error('error', err)
        });
      routeObj$
        .pipe(
          takeUntil(this._unsubscribeTrigger$)
        )
        .subscribe({
          next: value => {
            if (this._viewModel.medicationRequest && this._viewModel.medication) {
              this._viewModel.dispatchIntent(
                new MedicationFormIntentValueChangesDosageInstructionRoute(
                  this._viewModel.medicationRequest,
                  nDosage,
                  value,
                  this._viewModel.medication
                )
              );
            }
          },
          error: err => console.error('error', err)
        });
    }

    const boundsDurationValue = dosageInstructionGroup.get(['timing', 'repeat', 'boundsDuration', 'value']);
    if (boundsDurationValue) {
      boundsDurationValue.valueChanges
        .pipe(
          debounceTime(500),
          distinctUntilChanged(),
          filter(() => boundsDurationValue.valid)
        )
        .subscribe({
          next: value => {
            if (this._viewModel.medicationRequest) {
              this._viewModel.dispatchIntent(
                new MedicationFormIntentValueChangesDosageInstructionBoundsDurationValue(
                  this._viewModel.medicationRequest,
                  nDosage,
                  value
                )
              );
            }
          },
          error: err => console.error('error', err)
        });
    }

    const boundsDurationUnitControl = dosageInstructionGroup.get(['timing', 'repeat', 'boundsDuration', 'unit']);
    if (boundsDurationUnitControl) {
      const boundsDurationUnitValid$ = boundsDurationUnitControl.valueChanges
        .pipe(
          filter(predicate => !!this._viewModel.durationUnitArray && this._viewModel.durationUnitArray.findIndex(
            value => value.code === predicate.code
          ) > -1)
        );
      const boundsDurationUnitNotValid$ = boundsDurationUnitControl.valueChanges
        .pipe(
          filter(predicate => !!this._viewModel.durationUnitArray && this._viewModel.durationUnitArray.findIndex(
            value => value.code === predicate.code
          ) === -1)
        );

      boundsDurationUnitValid$
        .pipe(
          takeUntil(this._unsubscribeTrigger$)
        )
        .subscribe({
          next: value => {
            if (this._viewModel.medicationRequest) {
              this._viewModel.dispatchIntent(
                new MedicationFormIntentValueChangesDosageInstructionBoundsDurationUnit(
                  this._viewModel.medicationRequest,
                  nDosage,
                  value
                )
              );
            }
          },
          error: err => console.error('error', err)
        });
      boundsDurationUnitNotValid$
        .pipe(
          takeUntil(this._unsubscribeTrigger$)
        )
        .subscribe({
          next: () => {
            if (this._viewModel.medicationRequest) {
              this._viewModel.dispatchIntent(
                new MedicationFormIntentValueChangesDosageInstructionBoundsDurationUnit(
                  this._viewModel.medicationRequest,
                  nDosage,
                  null
                )
              );
            }
          },
          error: err => console.error('error', err)
        });
    }

    const boundsPeriodStartControl = dosageInstructionGroup.get(['timing', 'repeat', 'boundsPeriod', 'start']);
    if (boundsPeriodStartControl) {
      boundsPeriodStartControl.valueChanges
        .pipe(
          takeUntil(this._unsubscribeTrigger$),
          debounceTime(500),
          distinctUntilChanged(),
          filter(() => boundsPeriodStartControl.valid)
        )
        .subscribe({
          next: value => {
            if (this._viewModel.medicationRequest) {
              this._viewModel.dispatchIntent(
                new MedicationFormIntentValueChangesDosageInstructionBoundsPeriodStart(
                  this._viewModel.medicationRequest,
                  nDosage,
                  value
                )
              );
            }
          },
          error: err => console.error('error', err)
        });
    }

    const boundsPeriodEndControl = dosageInstructionGroup.get(['timing', 'repeat', 'boundsPeriod', 'end']);
    if (boundsPeriodEndControl) {
      boundsPeriodEndControl.valueChanges
        .pipe(
          takeUntil(this._unsubscribeTrigger$),
          debounceTime(500),
          distinctUntilChanged(),
          filter(() => boundsPeriodEndControl.valid)
        )
        .subscribe({
          next: value => {
            if (this._viewModel.medicationRequest) {
              this._viewModel.dispatchIntent(
                new MedicationFormIntentValueChangesDosageInstructionBoundsPeriodEnd(
                  this._viewModel.medicationRequest,
                  nDosage,
                  value
                )
              );
            }
          },
          error: err => console.error('error', err)
        });
    }

    const durationControl = dosageInstructionGroup.get(['timing', 'repeat', 'duration']);
    if (durationControl) {
      durationControl.valueChanges
        .pipe(
          takeUntil(this._unsubscribeTrigger$)
        )
        .subscribe({
          next: value => {
            if (this._viewModel.medicationRequest) {
              this._viewModel.dispatchIntent(
                new MedicationFormIntentValueChangesDosageInstructionDurationValue(
                  this._viewModel.medicationRequest,
                  nDosage,
                  value
                )
              );
            }
          },
          error: err => console.error('error', err)
        });
    }

    const durationUnitControl = dosageInstructionGroup.get(['timing', 'repeat', 'durationUnit']);
    if (durationUnitControl) {
      const durationUnitValid$ = durationUnitControl.valueChanges
        .pipe(
          filter(predicate => !!this._viewModel.durationUnitArray && this._viewModel.durationUnitArray.findIndex(
            value => value.code === predicate.code
          ) > -1)
        );
      const durationUnitNotValid$ = durationUnitControl.valueChanges
        .pipe(
          filter(predicate => !!this._viewModel.durationUnitArray && this._viewModel.durationUnitArray.findIndex(
            value => value.code === predicate.code
          ) === -1)
        );

      durationUnitValid$
        .pipe(
          takeUntil(this._unsubscribeTrigger$)
        )
        .subscribe({
          next: value => {
            if (this._viewModel.medicationRequest) {
              this._viewModel.dispatchIntent(
                new MedicationFormIntentValueChangesDosageInstructionDurationUnit(
                  this._viewModel.medicationRequest,
                  nDosage,
                  value
                )
              );
            }
          },
          error: err => console.error('error', err)
        });
      durationUnitNotValid$
        .pipe(
          takeUntil(this._unsubscribeTrigger$),
          tap(() => durationUnitControl.reset(null, {emitEvent: false}))
        )
        .subscribe({
          next: () => {
            if (this._viewModel.medicationRequest) {
              this._viewModel.dispatchIntent(
                new MedicationFormIntentValueChangesDosageInstructionDurationUnit(
                  this._viewModel.medicationRequest,
                  nDosage,
                  null
                )
              );
            }
          },
          error: err => console.error('error', err)
        });
    }

    const frequencyControl = dosageInstructionGroup.get(['timing', 'repeat', 'frequency']);
    if (frequencyControl) {
      frequencyControl.valueChanges
        .pipe(
          takeUntil(this._unsubscribeTrigger$)
        )
        .subscribe({
          next: value => {
            if (this._viewModel.medicationRequest) {
              this._viewModel.dispatchIntent(
                new MedicationFormIntentValueChangesDosageInstructionFrequencyValue(
                  this._viewModel.medicationRequest,
                  nDosage,
                  value
                )
              );
            }
          },
          error: err => console.error('error', err)
        });
    }

    const periodControl = dosageInstructionGroup.get(['timing', 'repeat', 'period']);
    if (periodControl) {
      periodControl.valueChanges
        .pipe(
          takeUntil(this._unsubscribeTrigger$)
        )
        .subscribe({
          next: value => {
            if (this._viewModel.medicationRequest) {
              this._viewModel.dispatchIntent(
                new MedicationFormIntentValueChangesDosageInstructionPeriodValue(
                  this._viewModel.medicationRequest,
                  nDosage,
                  value
                )
              );
            }
          },
          error: err => console.error('error', err)
        });
    }

    const periodUnit = dosageInstructionGroup.get(['timing', 'repeat', 'periodUnit']);
    if (periodUnit) {
      const periodUnitValid$ = periodUnit.valueChanges
        .pipe(
          filter(predicate => !!this._viewModel.durationUnitArray && this._viewModel.durationUnitArray.findIndex(
            value => value.code === predicate.code
          ) > -1)
        );
      const periodUnitNotValid$ = periodUnit.valueChanges
        .pipe(
          filter(predicate => !!this._viewModel.durationUnitArray && this._viewModel.durationUnitArray.findIndex(
            value => value.code === predicate.code
          ) === -1)
        );

      periodUnitValid$
        .pipe(
          takeUntil(this._unsubscribeTrigger$)
        )
        .subscribe({
          next: value => {
            if (this._viewModel.medicationRequest) {
              this._viewModel.dispatchIntent(
                new MedicationFormIntentValueChangesDosageInstructionPeriodUnit(
                  this._viewModel.medicationRequest,
                  nDosage,
                  value
                )
              );
            }
          },
          error: err => console.error('error', err)
        });
      periodUnitNotValid$
        .pipe(
          takeUntil(this._unsubscribeTrigger$),
          tap(() => periodUnit
            .reset(null, {emitEvent: false}))
        )
        .subscribe({
          next: () => {
            if (this._viewModel.medicationRequest) {
              this._viewModel.dispatchIntent(
                new MedicationFormIntentValueChangesDosageInstructionPeriodUnit(
                  this._viewModel.medicationRequest,
                  nDosage,
                  null
                )
              );
            }
          },
          error: err => console.error('error', err)
        });
    }

    const dayOfWeekControl = dosageInstructionGroup.get(['timing', 'repeat', 'dayOfWeek']);
    if (dayOfWeekControl) {
      dayOfWeekControl.valueChanges
        .pipe(
          takeUntil(this._unsubscribeTrigger$)
        )
        .subscribe({
          next: dayOfWeekValues => {
            if (this._viewModel.medicationRequest) {
              this._viewModel.dispatchIntent(
                new MedicationFormIntentValueChangesDosageInstructionDayOfWeek(
                  this._viewModel.medicationRequest,
                  nDosage,
                  dayOfWeekValues
                )
              );
            }
          },
          error: err => console.error('error', err)
        });
    }

    const offsetControl = dosageInstructionGroup.get(['timing', 'repeat', 'offset']);
    if (offsetControl) {
      offsetControl.valueChanges
        .pipe(
          takeUntil(this._unsubscribeTrigger$)
        )
        .subscribe({
          next: value => {
            if (this._viewModel.medicationRequest) {
              this._viewModel.dispatchIntent(
                new MedicationFormIntentValueChangesDosageInstructionOffsetValue(
                  this._viewModel.medicationRequest,
                  nDosage,
                  value
                )
              );
            }
          },
          error: err => console.error('error', err)
        });
    }

    this.isLoadingList$
      .pipe(
        takeUntil(this._unsubscribeTrigger$),
        filter(value => !value)
      )
      .subscribe({
        next: () => this.onLoadedList(),
        error: err => console.error('error', err)
      });

    this._viewModel.isLoadingTIOList$
      .pipe(
        takeUntil(this._unsubscribeTrigger$),
        filter(value => !value)
      )
      .subscribe({
          next: () => this.onLoadedTIOList(dosageInstructionGroup, dosage),
          error: err => console.error('error', err)
        }
      );

    return dosageInstructionGroup;
  }

  private addTimeOfDay(nDosage: number, nTimeOfDay: number): FormControl {
    const timeOfDayControl = this._fb.control(undefined, Validators.pattern( /\d{2}:\d{2}/ ));
    timeOfDayControl.valueChanges
      .pipe(
        takeUntil(this._unsubscribeTrigger$),
        debounceTime(500),
        distinctUntilChanged(),
        tap(() => {
          if (this.dosageInstruction) {
            this._dosageInstruction$.next(this.dosageInstruction);
          }
        }),
        filter(() => timeOfDayControl.valid)
      )
      .subscribe({
        next: value => {
          if (this._viewModel.medicationRequest) {
            this._viewModel.dispatchIntent(
              new MedicationFormIntentValueChangesDosageInstructionTimeOfDayValue(
                this._viewModel.medicationRequest,
                nDosage,
                nTimeOfDay,
                value
              )
            );
          }
        },
        error: err => console.error('error', err)
      });
    return timeOfDayControl;
  }

  private addWhen(nDosage: number, nWhen: number): FormControl {
    const whenControl = this._fb.control(undefined);
    const whenString$ = whenControl.valueChanges
      .pipe(
        filter(value => typeof value === 'string')
      );
    const whenObj$ = whenControl.valueChanges
      .pipe(
        filter(value => value instanceof Object)
      );

    whenString$
      .pipe(
        takeUntil(this._unsubscribeTrigger$)
      )
      .subscribe({
        next: () => {
          if (this._viewModel.medicationRequest) {
            this._viewModel.dispatchIntent(
              new MedicationFormIntentValueChangesDosageInstructionWhenValue(
                this._viewModel.medicationRequest,
                nDosage,
                nWhen,
                null
              )
            );
          }
        },
        error: err => console.error('error', err)
      });
    whenObj$
      .pipe(
        takeUntil(this._unsubscribeTrigger$)
      )
      .subscribe({
        next: value => {
          if (this._viewModel.medicationRequest) {
            this._viewModel.dispatchIntent(
              new MedicationFormIntentValueChangesDosageInstructionWhenValue(
                this._viewModel.medicationRequest,
                nDosage,
                nWhen,
                value
              )
            );
          }
        },
        error: err => console.error('error', err)
      });

    return whenControl;
  }

  private addDoseAndRate(nDosage: number, nDoseAndRate: number): FormGroup {
    const options = {emitEvent: false};
    const doseAndRateGroup = this._fb.group({
      doseQuantity: this._fb.group({
        value: [undefined, [Validators.required, Validators.pattern( /\d/ )]],
        unit: [undefined]
      }),
      rateRatio: this._fb.group({
        numerator: this._fb.group({
          value: [undefined, Validators.pattern( /\d/ )],
          unit: [undefined]
        }),
        denominator: this._fb.group({
          value: [undefined, Validators.pattern( /\d/ )],
          unit: [undefined]
        })
      })
    });

    const doseQuantityValueControl = doseAndRateGroup.get(['doseQuantity', 'value']);
    if (doseQuantityValueControl) {
      doseQuantityValueControl.valueChanges
        .pipe(
          takeUntil(this._unsubscribeTrigger$),
          debounceTime(500),
          distinctUntilChanged()
        )
        .subscribe({
          next: value => {
            if (this._viewModel.medicationRequest) {
              this._viewModel.dispatchIntent(
                new MedicationFormIntentValueChangesDosageInstructionDoseQuantityValue(
                  this._viewModel.medicationRequest,
                  nDosage,
                  nDoseAndRate,
                  value
                )
              );
            }
          },
          error: err => console.error('error', err)
        });
    }

    const doseQuantityUnitControl = doseAndRateGroup.get(['doseQuantity', 'unit']);
    if (doseQuantityUnitControl) {
      const doseQuantityUnitString$ = doseQuantityUnitControl.valueChanges
        .pipe(
          filter(value => typeof value === 'string')
        );
      const doseQuantityUnitObj$ = doseQuantityUnitControl.valueChanges
        .pipe(
          filter(value => value instanceof Object)
        );
      doseQuantityUnitString$
        .pipe(
          takeUntil(this._unsubscribeTrigger$),
          tap(() => doseQuantityUnitControl.reset(undefined, options))
        )
        .subscribe({
          next: () => {
            if (this._viewModel.medicationRequest) {
              this._viewModel.dispatchIntent(
                new MedicationFormIntentValueChangesDosageInstructionDoseQuantityUnit(
                  this._viewModel.medicationRequest,
                  nDosage,
                  nDoseAndRate,
                  null
                )
              );
            }
          },
          error: err => console.error('error', err)
        });
      doseQuantityUnitObj$
        .pipe(
          takeUntil(this._unsubscribeTrigger$)
        )
        .subscribe({
          next: value => {
            if (this._viewModel.medicationRequest) {
              this._viewModel.dispatchIntent(
                new MedicationFormIntentValueChangesDosageInstructionDoseQuantityUnit(
                  this._viewModel.medicationRequest,
                  nDosage,
                  nDoseAndRate,
                  value
                )
              );
            }
          },
          error: err => console.error('error', err)
        });
    }

    const rateRatioNumeratorValue = doseAndRateGroup.get(['rateRatio', 'numerator', 'value']);
    if (rateRatioNumeratorValue) {
      rateRatioNumeratorValue.valueChanges
        .pipe(
          takeUntil(this._unsubscribeTrigger$),
          debounceTime(500),
          distinctUntilChanged()
        )
        .subscribe({
          next: value => {
            if (this._viewModel.medicationRequest) {
              this._viewModel.dispatchIntent(
                new MedicationFormIntentValueChangesDosageInstructionRateRatioNumeratorValue(
                  this._viewModel.medicationRequest,
                  nDosage,
                  nDoseAndRate,
                  value
                )
              );
            }
          },
          error: err => console.error('error', err)
        });
    }

    const rateRatioNumeratorUnit = doseAndRateGroup.get(['rateRatio', 'numerator', 'unit']);
    if (rateRatioNumeratorUnit) {
      const rateRatioNumeratorUnitString$ = rateRatioNumeratorUnit.valueChanges
        .pipe(
          filter(value => typeof value === 'string')
        );
      const rateRatioNumeratorUnitObj$ = rateRatioNumeratorUnit.valueChanges
        .pipe(
          filter(value => value instanceof Object)
        );
      rateRatioNumeratorUnitString$
        .pipe(
          takeUntil(this._unsubscribeTrigger$),
          tap(() => rateRatioNumeratorUnit.reset(undefined, options))
        )
        .subscribe({
          next: () => {
            if (this._viewModel.medicationRequest) {
              this._viewModel.dispatchIntent(
                new MedicationFormIntentValueChangesDosageInstructionRateRatioNumeratorUnit(
                  this._viewModel.medicationRequest,
                  nDosage,
                  nDoseAndRate,
                  null
                )
              );
            }
          },
          error: err => console.error('error', err)
        });
      rateRatioNumeratorUnitObj$
        .pipe(
          takeUntil(this._unsubscribeTrigger$)
        )
        .subscribe({
          next: value => {
            if (this._viewModel.medicationRequest) {
              this._viewModel.dispatchIntent(
                new MedicationFormIntentValueChangesDosageInstructionRateRatioNumeratorUnit(
                  this._viewModel.medicationRequest,
                  nDosage,
                  nDoseAndRate,
                  value
                )
              );
            }
          },
          error: err => console.error('error', err)
        });
    }

    const rateRatioDenominatorValue = doseAndRateGroup.get(['rateRatio', 'denominator', 'value']);
    if (rateRatioDenominatorValue) {
      rateRatioDenominatorValue.valueChanges
        .pipe(
          takeUntil(this._unsubscribeTrigger$),
          debounceTime(500),
          distinctUntilChanged()
        )
        .subscribe({
          next: value => {
            if (this._viewModel.medicationRequest) {
              this._viewModel.dispatchIntent(
                new MedicationFormIntentValueChangesDosageInstructionRateRatioDenominatorValue(
                  this._viewModel.medicationRequest,
                  nDosage,
                  nDoseAndRate,
                  value
                )
              );
            }
          },
          error: err => console.error('error', err)
        });
    }

    const rateRatioDenominatorUnit = doseAndRateGroup.get(['rateRatio', 'denominator', 'unit']);
    if (rateRatioDenominatorUnit) {
      const rateRatioDenominatorUnitString$ = rateRatioDenominatorUnit.valueChanges
        .pipe(
          filter(value => typeof value === 'string')
        );
      const rateRatioDenominatorUnitObj$ = rateRatioDenominatorUnit.valueChanges
        .pipe(
          filter(value => value instanceof Object)
        );
      rateRatioDenominatorUnitString$
        .pipe(
          takeUntil(this._unsubscribeTrigger$),
          tap(() => rateRatioDenominatorUnit.reset(undefined, options))
        )
        .subscribe({
          next: () => {
            if (this._viewModel.medicationRequest) {
              this._viewModel.dispatchIntent(
                new MedicationFormIntentValueChangesDosageInstructionRateRatioDenominatorUnit(
                  this._viewModel.medicationRequest,
                  nDosage,
                  nDoseAndRate,
                  null
                )
              );
            }
          },
          error: err => console.error('error', err)
        });
      rateRatioDenominatorUnitObj$
        .pipe(
          takeUntil(this._unsubscribeTrigger$)
        )
        .subscribe({
          next: value => {
            if (this._viewModel.medicationRequest) {
              this._viewModel.dispatchIntent(
                new MedicationFormIntentValueChangesDosageInstructionRateRatioDenominatorUnit(
                  this._viewModel.medicationRequest,
                  nDosage,
                  nDoseAndRate,
                  value
                )
              );
            }
          },
          error: err => console.error('error', err)
        });
    }

    return doseAndRateGroup;
  }

  private updateDosageInstruction(dosage: Dosage, dosageInstructionGroup: FormGroup): void {
    const options = {emitEvent: false};

    const routeControl = dosageInstructionGroup.get('route');
    if (routeControl) {
      if (dosage?.route) {
        routeControl.setValue(dosage.route, options);
      }
      else {
        routeControl.reset(undefined, options);
      }
    }

    const boundsDurationValue = dosageInstructionGroup.get(['timing', 'repeat', 'boundsDuration', 'value']);
    const boundsDurationUnit = dosageInstructionGroup.get(['timing', 'repeat', 'boundsDuration', 'unit']);
    if (boundsDurationValue && boundsDurationUnit && dosage.timing?.repeat?.boundsDuration?.code) {
      boundsDurationValue
        .setValue(dosage.timing.repeat.boundsDuration?.value, options);
      boundsDurationUnit
        .setValue(this.boundsDurationUnit(dosage.timing.repeat.boundsDuration?.code), options);
    }

    const boundsPeriodStartControl = dosageInstructionGroup.get(['timing', 'repeat', 'boundsPeriod', 'start']);
    const boundsPeriodEndControl = dosageInstructionGroup.get(['timing', 'repeat', 'boundsPeriod', 'end']);
    if (boundsPeriodStartControl && boundsPeriodEndControl && dosage.timing?.repeat?.boundsPeriod) {
      boundsPeriodStartControl.setValue(
        (dosage.timing.repeat.boundsPeriod?.start) ?
          DateTime.fromFormat(dosage.timing?.repeat?.boundsPeriod?.start, environment.fhir_date_format)
            .toFormat(environment.display_date_format) : undefined, options);
      boundsPeriodEndControl.setValue(
        (dosage.timing.repeat.boundsPeriod?.end) ?
          DateTime.fromFormat(dosage.timing?.repeat?.boundsPeriod?.end, environment.fhir_date_format)
            .toFormat(environment.display_date_format) : undefined, options);
    }
  }

  private formArrayMinLength = (min: number) => {
    return (c: AbstractControl): { [p: string]: boolean } | null => {
      if (c.value.length >= min) { return null; }
      return {formArrayMinLength: true};
    };
  }

  private boundsDurationUnit(boundsDurationUnitCode: code): ValueSetContains | undefined {
    if (this.durationUnitArray) {
      return this.durationUnitArray.find(
        value => value.code === boundsDurationUnitCode
      );
    }
    return undefined;
  }

  private durationUnit(durationUnitCode: UnitsOfTime): ValueSetContains | undefined {
    if (this.durationUnitArray) {
      return this.durationUnitArray.find(
        value => value.code === durationUnitCode
      );
    }
    return undefined;
  }

  private periodUnit(periodUnitCode: UnitsOfTime): ValueSetContains | undefined {
    if (this.durationUnitArray) {
      return this.durationUnitArray.find(
        value => value.code === periodUnitCode
      );
    }
    return undefined;
  }

  private onLoadedList(): void {
    if (this._dosageInstruction$.value) {
      const dosageInstruction = this._dosageInstruction$.value as FormArray;
      dosageInstruction.controls.forEach((dosageInstructionGroup: AbstractControl, nDosage: number) => {
        const routes = this.routeArray(nDosage);
        if (routes && routes.length === 1) {
          const routeControl = dosageInstructionGroup.get('route');
          if (routeControl) {
            const cur = routeControl.value as CodeableConcept;
            if (cur?.text !== routes[0].text) {
              routeControl.setValue(routes[0]);
            }
          }
        }
      });
    }
  }

  private onLoadedTIOList(dosageInstructionGroup: FormGroup, dosage: Dosage): void {
    const options = {emitEvent: false};

    const boundsDurationUnit = dosageInstructionGroup.get(['timing', 'repeat', 'boundsDuration', 'unit']);
    if (boundsDurationUnit) {
      if (dosage.timing?.repeat?.boundsDuration?.code) {
        boundsDurationUnit.setValue(this.boundsDurationUnit(dosage.timing?.repeat?.boundsDuration?.code), options);
      }
      else {
        boundsDurationUnit.reset(undefined, options);
      }
    }

    const periodUnit = dosageInstructionGroup.get(['timing', 'repeat', 'periodUnit']);
    if (periodUnit) {
      if (dosage.timing?.repeat?.periodUnit) {
        periodUnit.setValue(this.durationUnit(dosage.timing?.repeat?.periodUnit), options);
      }
      else {
        periodUnit.reset(undefined, options);
      }
    }
  }
}
