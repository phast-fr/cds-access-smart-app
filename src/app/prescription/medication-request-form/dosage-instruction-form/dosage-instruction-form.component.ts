/**
 * @license
 * Copyright PHAST SARL All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://cds-access.phast.fr/license
 */
import {DateTime} from 'luxon';
import {ChangeDetectionStrategy, Component, OnDestroy, OnInit} from '@angular/core';
import {AbstractControl, FormArray, FormBuilder, FormControl, FormGroup, Validators} from '@angular/forms';
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
import {CodeableConcept, code, Coding, Dosage, UnitsOfTime, ValueSetContains} from 'phast-fhir-ts';

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

  public get isLoadingList$(): Observable<boolean> {
    return this._viewModel.isLoadingCIOList$;
  }

  public routeArray(nDosage: number): Array<CodeableConcept> {
    return this._viewModel.routeMap.get(nDosage);
  }

  public get durationUnitArray(): Array<ValueSetContains> {
    return this._viewModel.durationUnitArray;
  }

  public get whenArray(): Array<ValueSetContains> {
    return this._viewModel.whenArray;
  }

  public doseAndRateUnitArray(nDosage: number): Array<Coding> {
    return this._viewModel.doseAndRateUnitMap.get(this._viewModel.medication.id).get(nDosage);
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
        this._dosageInstruction$.next(
          this._fb.array([
            this.addDosageInstruction(
              state.medicationRequest.dosageInstruction[0],
              0
            )
          ], this.formArrayMinLength(1)));
        break;
      case 'RemoveMedication':
        if (state.medicationRequest) {
          this._dosageInstruction$.next(this.dosageInstruction);
        }
        else {
          this._dosageInstruction$.next(false);
        }
        break;
      case 'AddDosageInstruction':
        this.dosageInstruction?.push(
          this.addDosageInstruction(
            state.medicationRequest.dosageInstruction[state.nDosage],
            state.nDosage
          )
        );
        this._dosageInstruction$.next(this.dosageInstruction);
        break;
      case 'RemoveDosageInstruction':
        this.dosageInstruction?.removeAt(state.nDosage);
        this._dosageInstruction$.next(this.dosageInstruction);
        break;
      case 'AddTimeOfDay':
        const addTimeOfDay = this.dosageInstruction?.at(state.nDosage).get(['timing', 'repeat', 'timeOfDay']) as FormArray;
        addTimeOfDay.push(this.addTimeOfDay(state.nDosage, addTimeOfDay.length));
        this._dosageInstruction$.next(this.dosageInstruction);
        break;
      case 'RemoveTimeOfDay':
        const removeTimeOfDay = this.dosageInstruction?.at(state.nDosage).get(['timing', 'repeat', 'timeOfDay']) as FormArray;
        removeTimeOfDay.removeAt(state.index);
        this._dosageInstruction$.next(this.dosageInstruction);
        break;
      case 'AddWhen':
        const addWhen = this.dosageInstruction?.at(state.nDosage).get(['timing', 'repeat', 'when']) as FormArray;
        addWhen.push(this.addWhen(state.nDosage, addWhen.length));
        this._dosageInstruction$.next(this.dosageInstruction);
        break;
      case 'RemoveWhen':
        const removeWhen = this.dosageInstruction?.at(state.nDosage).get(['timing', 'repeat', 'when']) as FormArray;
        removeWhen.removeAt(state.index);
        this._dosageInstruction$.next(this.dosageInstruction);
        break;
      case 'AddDoseAndRate':
        const addDoseAndRate = this.dosageInstruction?.at(state.nDosage).get('doseAndRate') as FormArray;
        addDoseAndRate.push(
          this.addDoseAndRate(
            state.nDosage,
            addDoseAndRate.length
          )
        );
        this._dosageInstruction$.next(this.dosageInstruction);
        break;
      case 'RemoveDoseAndRate':
        const removeDoseAndRate = this.dosageInstruction?.at(state.nDosage).get('doseAndRate') as FormArray;
        removeDoseAndRate.removeAt(state.index);
        this._dosageInstruction$.next(this.dosageInstruction);
        break;
      case 'ValueChangesDosageInstruction':
        this.updateDosageInstruction(
          state.medicationRequest.dosageInstruction[state.nDosage],
          this.dosageInstruction?.at(state.nDosage) as FormGroup
        );
        this._dosageInstruction$.next(this.dosageInstruction);
        break;
      case 'ValueChangesMedication':
        if (state.medicationRequest.dosageInstruction) {
          state.medicationRequest.dosageInstruction.forEach((dosage, nDosage) => {
            this.updateDosageInstruction(
              dosage,
              this.dosageInstruction?.at(nDosage) as FormGroup
            );
          });
        }
        this._dosageInstruction$.next(this.dosageInstruction);
        break;
      case 'AddMedicationRequest':
        this._dosageInstruction$.next(false);
        break;
    }
  }

  public onAddDosageInstruction(): void {
    this._viewModel.dispatchIntent(
      new MedicationFormIntentAddDosageInstruction(this._viewModel.medicationRequest)
    );
  }

  public onRemoveDosageInstruction(nDosage: number): void {
    this._viewModel.dispatchIntent(
      new MedicationFormIntentRemoveDosageInstruction(this._viewModel.medicationRequest, nDosage)
    );
  }

  public onAddTimeOfDay(nDosage: number): void {
    this._viewModel.dispatchIntent(new MedicationFormIntentAddTimeOfDay(nDosage));
  }

  public onRemoveTimeOfDay(nDosage: number, nTimeOfDay: number): void {
    this._viewModel.dispatchIntent(
      new MedicationFormIntentRemoveTimeOfDay(this._viewModel.medicationRequest, nDosage, nTimeOfDay)
    );
  }

  public onAddWhen(nDosage: number): void {
    this._viewModel.dispatchIntent(new MedicationFormIntentAddWhen(nDosage));
  }

  public onRemoveWhen(nDosage: number, nWhen: number): void {
    this._viewModel.dispatchIntent(
      new MedicationFormIntentRemoveWhen(this._viewModel.medicationRequest, nDosage, nWhen)
    );
  }

  public onAddDoseAndRate(nDosage: number): void {
    this._viewModel.dispatchIntent(new MedicationFormIntentAddDoseAndRate(nDosage));
  }

  public onRemoveDoseAndRate(nDosage: number, nDoseAndRate: number): void {
    this._viewModel.dispatchIntent(
      new MedicationFormIntentRemoveDoseAndRate(this._viewModel.medicationRequest, nDosage, nDoseAndRate)
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

  public trackByValueSetContains(_, valueSetContains: ValueSetContains): string {
    return valueSetContains.code;
  }

  public displayFnValueSetContains(valueSetContains: ValueSetContains): string | null {
    return this._labelProviderFactory.getProvider('fhir.ValueSetContains').getText(valueSetContains);
  }

  public trackByIndex(index: number): number {
    return index;
  }

  public dayOfWeekLabel(dayOfWeek: code): string {
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
      'track-id': Utils.randomString(16),
      route: [dosage?.route, [Validators.required]],
      timing: this._fb.group({
        repeat: this._fb.group({
          boundsMode: ['duration'],
          boundsDuration: this._fb.group({
            value: [dosage?.timing?.repeat?.boundsDuration?.value, Validators.pattern( /\d/ )],
            unit: [undefined],
          }),
          boundsPeriod: this._fb.group({
            start: [(dosage?.timing?.repeat?.boundsPeriod?.start) ?
              DateTime.fromISO(dosage?.timing?.repeat?.boundsPeriod?.start).toFormat('dd/MM/yyyy') : undefined,
              Validators.pattern( /\d{2}\/\d{2}\/\d{4}/ )],
            end: [(dosage?.timing?.repeat?.boundsPeriod?.end) ?
              DateTime.fromISO(dosage?.timing?.repeat?.boundsPeriod?.end).toFormat('dd/MM/yyyy') : undefined,
              Validators.pattern( /\d{2}\/\d{2}\/\d{4}/ )]
          }),
          duration: [dosage?.timing?.repeat?.duration], // How long when it happens
          durationUnit: [undefined],
          frequency: [dosage?.timing?.repeat?.frequency, Validators.pattern( /\d/ )],
          period: [dosage?.timing?.repeat?.period],
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
          offset: [dosage?.timing?.repeat?.offset, Validators.pattern( /\d/ )]
        })
      }),
      doseAndRate: this._fb.array([])
    });

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
        tap(() => dosageInstructionGroup.get('route').reset(null, {emitEvent: false}))
      )
      .subscribe({
        next: () => {
          const medication = this._viewModel.medication;
          this._viewModel.dispatchIntent(
            new MedicationFormIntentValueChangesDosageInstructionRoute(
              this._viewModel.medicationRequest,
              nDosage,
              null,
              medication
            )
          );
        },
        error: err => console.error('error', err)
      });
    routeObj$
      .pipe(
        takeUntil(this._unsubscribeTrigger$),
        distinctUntilChanged<CodeableConcept>((prev, cur) => prev.text === cur.text)
      )
      .subscribe({
        next: value => this._viewModel.dispatchIntent(
          new MedicationFormIntentValueChangesDosageInstructionRoute(
            this._viewModel.medicationRequest,
            nDosage,
            value,
            this._viewModel.medication
          )
        ),
        error: err => console.error('error', err)
      });

    dosageInstructionGroup.get(['timing', 'repeat', 'boundsDuration', 'value']).valueChanges
      .pipe(
        debounceTime(500),
        distinctUntilChanged(),
        filter(() => dosageInstructionGroup.get(['timing', 'repeat', 'boundsDuration', 'value']).valid)
      )
      .subscribe({
        next: value => this._viewModel.dispatchIntent(
          new MedicationFormIntentValueChangesDosageInstructionBoundsDurationValue(
            this._viewModel.medicationRequest,
            nDosage,
            value
          )
        ),
        error: err => console.error('error', err)
      });

    const boundsDurationUnitValid$ = dosageInstructionGroup.get(['timing', 'repeat', 'boundsDuration', 'unit']).valueChanges
      .pipe(
        filter(predicate => this._viewModel.durationUnitArray.findIndex(
          value => value.code === predicate.code
        ) > -1)
      );
    const boundsDurationUnitNotValid$ = dosageInstructionGroup.get(['timing', 'repeat', 'boundsDuration', 'unit']).valueChanges
      .pipe(
        filter(predicate => this._viewModel.durationUnitArray.findIndex(
          value => value.code === predicate.code
        ) === -1)
      );

    boundsDurationUnitValid$
      .pipe(
        takeUntil(this._unsubscribeTrigger$)
      )
      .subscribe({
        next: value => this._viewModel.dispatchIntent(
          new MedicationFormIntentValueChangesDosageInstructionBoundsDurationUnit(
            this._viewModel.medicationRequest,
            nDosage,
            value
          )
        ),
        error: err => console.error('error', err)
      });
    boundsDurationUnitNotValid$
      .pipe(
        takeUntil(this._unsubscribeTrigger$)
      )
      .subscribe({
        next: () => this._viewModel.dispatchIntent(
          new MedicationFormIntentValueChangesDosageInstructionBoundsDurationUnit(
            this._viewModel.medicationRequest,
            nDosage,
            null
          )
        ),
        error: err => console.error('error', err)
      });

    dosageInstructionGroup.get(['timing', 'repeat', 'boundsPeriod', 'start']).valueChanges
      .pipe(
        takeUntil(this._unsubscribeTrigger$),
        debounceTime(500),
        distinctUntilChanged(),
        filter(() => dosageInstructionGroup.get(['timing', 'repeat', 'boundsPeriod', 'start']).valid)
      )
      .subscribe({
        next: value => this._viewModel.dispatchIntent(
          new MedicationFormIntentValueChangesDosageInstructionBoundsPeriodStart(
            this._viewModel.medicationRequest,
            nDosage,
            value
          )
        ),
        error: err => console.error('error', err)
      });

    dosageInstructionGroup.get(['timing', 'repeat', 'boundsPeriod', 'end']).valueChanges
      .pipe(
        takeUntil(this._unsubscribeTrigger$),
        debounceTime(500),
        distinctUntilChanged(),
        filter(() => dosageInstructionGroup.get(['timing', 'repeat', 'boundsPeriod', 'end']).valid)
      )
      .subscribe({
        next: value => this._viewModel.dispatchIntent(
          new MedicationFormIntentValueChangesDosageInstructionBoundsPeriodEnd(
            this._viewModel.medicationRequest,
            nDosage,
            value
          )
        ),
        error: err => console.error('error', err)
      });

    dosageInstructionGroup.get(['timing', 'repeat', 'duration']).valueChanges
      .pipe(
        takeUntil(this._unsubscribeTrigger$)
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
          value => value.code === predicate.code
        ) > -1)
      );
    const durationUnitNotValid$ = dosageInstructionGroup.get(['timing', 'repeat', 'durationUnit']).valueChanges
      .pipe(
        filter(predicate => this._viewModel.durationUnitArray.findIndex(
          value => value.code === predicate.code
        ) === -1)
      );

    durationUnitValid$
      .pipe(
        takeUntil(this._unsubscribeTrigger$)
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
          .reset(null, {emitEvent: false}))
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

    dosageInstructionGroup.get(['timing', 'repeat', 'frequency']).valueChanges
      .pipe(
        takeUntil(this._unsubscribeTrigger$)
      )
      .subscribe({
        next: value => this._viewModel.dispatchIntent(
          new MedicationFormIntentValueChangesDosageInstructionFrequencyValue(
            this._viewModel.medicationRequest,
            nDosage,
            value
          )
        ),
        error: err => console.error('error', err)
      });

    dosageInstructionGroup.get(['timing', 'repeat', 'period']).valueChanges
      .pipe(
        takeUntil(this._unsubscribeTrigger$)
      )
      .subscribe({
        next: value => this._viewModel.dispatchIntent(
          new MedicationFormIntentValueChangesDosageInstructionPeriodValue(
            this._viewModel.medicationRequest,
            nDosage,
            value
          )
        ),
        error: err => console.error('error', err)
      });
    const periodUnitValid$ = dosageInstructionGroup.get(['timing', 'repeat', 'periodUnit']).valueChanges
      .pipe(
        filter(predicate => this._viewModel.durationUnitArray.findIndex(
          value => value.code === predicate.code
        ) > -1)
      );
    const periodUnitNotValid$ = dosageInstructionGroup.get(['timing', 'repeat', 'periodUnit']).valueChanges
      .pipe(
        filter(predicate => this._viewModel.durationUnitArray.findIndex(
          value => value.code === predicate.code
        ) === -1)
      );

    periodUnitValid$
      .pipe(
        takeUntil(this._unsubscribeTrigger$)
      )
      .subscribe({
        next: value => this._viewModel.dispatchIntent(
          new MedicationFormIntentValueChangesDosageInstructionPeriodUnit(
            this._viewModel.medicationRequest,
            nDosage,
            value
          )
        ),
        error: err => console.error('error', err)
      });
    periodUnitNotValid$
      .pipe(
        takeUntil(this._unsubscribeTrigger$),
        tap(() => dosageInstructionGroup.get(['timing', 'repeat', 'periodUnit'])
          .reset(null, {emitEvent: false}))
      )
      .subscribe({
        next: () => this._viewModel.dispatchIntent(
          new MedicationFormIntentValueChangesDosageInstructionPeriodUnit(
            this._viewModel.medicationRequest,
            nDosage,
            null
          )
        ),
        error: err => console.error('error', err)
      });

    dosageInstructionGroup.get(['timing', 'repeat', 'dayOfWeek']).valueChanges
      .pipe(
        takeUntil(this._unsubscribeTrigger$)
      )
      .subscribe({
        next: dayOfWeekValues => this._viewModel.dispatchIntent(
          new MedicationFormIntentValueChangesDosageInstructionDayOfWeek(
            this._viewModel.medicationRequest,
            nDosage,
            dayOfWeekValues
          )
        ),
        error: err => console.error('error', err)
        });

    dosageInstructionGroup.get(['timing', 'repeat', 'offset']).valueChanges
      .pipe(
        takeUntil(this._unsubscribeTrigger$)
      )
      .subscribe({
        next: value => this._viewModel.dispatchIntent(
          new MedicationFormIntentValueChangesDosageInstructionOffsetValue(
            this._viewModel.medicationRequest,
            nDosage,
            value
          )
        ),
        error: err => console.error('error', err)
      });

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
        filter(() => timeOfDayControl.valid)
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
        next: () => this._viewModel.dispatchIntent(
          new MedicationFormIntentValueChangesDosageInstructionWhenValue(
            this._viewModel.medicationRequest,
            nDosage,
            nWhen,
            null
          )
        ),
        error: err => console.error('error', err)
      });
    whenObj$
      .pipe(
        takeUntil(this._unsubscribeTrigger$)
      )
      .subscribe({
        next: value => this._viewModel.dispatchIntent(
          new MedicationFormIntentValueChangesDosageInstructionWhenValue(
            this._viewModel.medicationRequest,
            nDosage,
            nWhen,
            value
          )
        ),
        error: err => console.error('error', err)
      });

    return whenControl;
  }

  private addDoseAndRate(nDosage: number, nDoseAndRate: number): FormGroup {
    const options = {emitEvent: false};
    const doseAndRateGroup = this._fb.group({
      doseQuantity: this._fb.group({
        value: [undefined, Validators.pattern( /\d/ )],
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

    doseAndRateGroup.get(['doseQuantity', 'value']).valueChanges
      .pipe(
        takeUntil(this._unsubscribeTrigger$),
        debounceTime(500),
        distinctUntilChanged()
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
        tap(() => doseAndRateGroup.get(['doseQuantity', 'unit']).reset(undefined, options))
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
        takeUntil(this._unsubscribeTrigger$)
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

    doseAndRateGroup.get(['rateRatio', 'numerator', 'value']).valueChanges
      .pipe(
        takeUntil(this._unsubscribeTrigger$),
        debounceTime(500),
        distinctUntilChanged()
      )
      .subscribe({
        next: value => this._viewModel.dispatchIntent(
          new MedicationFormIntentValueChangesDosageInstructionRateRatioNumeratorValue(
            this._viewModel.medicationRequest,
            nDosage,
            nDoseAndRate,
            value
          )
        ),
        error: err => console.error('error', err)
      });
    const rateRatioNumeratorUnitString$ = doseAndRateGroup.get(['rateRatio', 'numerator', 'unit']).valueChanges
      .pipe(
        filter(value => typeof value === 'string')
      );
    const rateRatioNumeratorUnitObj$ = doseAndRateGroup.get(['rateRatio', 'numerator', 'unit']).valueChanges
      .pipe(
        filter(value => value instanceof Object)
      );
    rateRatioNumeratorUnitString$
      .pipe(
        takeUntil(this._unsubscribeTrigger$),
        tap(() => doseAndRateGroup.get(['rateRatio', 'numerator', 'unit']).reset(undefined, options))
      )
      .subscribe({
        next: () => this._viewModel.dispatchIntent(
          new MedicationFormIntentValueChangesDosageInstructionRateRatioNumeratorUnit(
            this._viewModel.medicationRequest,
            nDosage,
            nDoseAndRate,
            null
          )
        ),
        error: err => console.error('error', err)
      });
    rateRatioNumeratorUnitObj$
      .pipe(
        takeUntil(this._unsubscribeTrigger$)
      )
      .subscribe({
        next: value => this._viewModel.dispatchIntent(
          new MedicationFormIntentValueChangesDosageInstructionRateRatioNumeratorUnit(
            this._viewModel.medicationRequest,
            nDosage,
            nDoseAndRate,
            value
          )
        ),
        error: err => console.error('error', err)
      });

    doseAndRateGroup.get(['rateRatio', 'denominator', 'value']).valueChanges
      .pipe(
        takeUntil(this._unsubscribeTrigger$),
        debounceTime(500),
        distinctUntilChanged()
      )
      .subscribe({
        next: value => this._viewModel.dispatchIntent(
          new MedicationFormIntentValueChangesDosageInstructionRateRatioDenominatorValue(
            this._viewModel.medicationRequest,
            nDosage,
            nDoseAndRate,
            value
          )
        ),
        error: err => console.error('error', err)
      });
    const rateRatioDenominatorUnitString$ = doseAndRateGroup.get(['rateRatio', 'denominator', 'unit']).valueChanges
      .pipe(
        filter(value => typeof value === 'string')
      );
    const rateRatioDenominatorUnitObj$ = doseAndRateGroup.get(['rateRatio', 'denominator', 'unit']).valueChanges
      .pipe(
        filter(value => value instanceof Object)
      );
    rateRatioDenominatorUnitString$
      .pipe(
        takeUntil(this._unsubscribeTrigger$),
        tap(() => doseAndRateGroup.get(['rateRatio', 'denominator', 'unit']).reset(undefined, options))
      )
      .subscribe({
        next: () => this._viewModel.dispatchIntent(
          new MedicationFormIntentValueChangesDosageInstructionRateRatioDenominatorUnit(
            this._viewModel.medicationRequest,
            nDosage,
            nDoseAndRate,
            null
          )
        ),
        error: err => console.error('error', err)
      });
    rateRatioDenominatorUnitObj$
      .pipe(
        takeUntil(this._unsubscribeTrigger$)
      )
      .subscribe({
        next: value => this._viewModel.dispatchIntent(
          new MedicationFormIntentValueChangesDosageInstructionRateRatioDenominatorUnit(
            this._viewModel.medicationRequest,
            nDosage,
            nDoseAndRate,
            value
          )
        ),
        error: err => console.error('error', err)
      });
    return doseAndRateGroup;
  }

  private updateDosageInstruction(dosage: Dosage, dosageInstructionGroup: FormGroup): void {
    const options = {emitEvent: false};
    if (dosage?.route) {
      dosageInstructionGroup.get('route').setValue(dosage.route, options);
    }
    else {
      dosageInstructionGroup.get('route').reset(undefined, options);
    }

    if (dosage.timing.repeat.boundsDuration) {
      dosageInstructionGroup.get(['timing', 'repeat', 'boundsDuration', 'value'])
        .setValue(dosage.timing.repeat.boundsDuration?.value, options);
      dosageInstructionGroup.get(['timing', 'repeat', 'boundsDuration', 'unit'])
        .setValue(this.boundsDurationUnit(dosage.timing.repeat.boundsDuration?.code), options);
    }

    if (dosage.timing.repeat.boundsPeriod) {
      dosageInstructionGroup.get(['timing', 'repeat', 'boundsPeriod', 'start'])
        .setValue((dosage.timing.repeat.boundsPeriod?.start) ?
          DateTime.fromISO(dosage.timing.repeat.boundsPeriod?.start).toFormat('dd/MM/yyyy') : undefined, options);
      dosageInstructionGroup.get(['timing', 'repeat', 'boundsPeriod', 'end'])
        .setValue((dosage.timing.repeat.boundsPeriod?.end) ?
          DateTime.fromISO(dosage.timing.repeat.boundsPeriod?.end).toFormat('dd/MM/yyyy') : undefined, options);
    }
  }

  private formArrayMinLength = (min: number) => {
    return (c: AbstractControl): {[key: string]: boolean} => {
      if (c.value.length >= min) { return null; }
      return {formArrayMinLength: true};
    };
  }

  private boundsDurationUnit(boundsDurationUnitCode: code): ValueSetContains | undefined {
    const boundsDurationUnitIndex = this.durationUnitArray.findIndex(
      value => value.code === boundsDurationUnitCode
    );
    if (boundsDurationUnitIndex > -1) {
      return this.durationUnitArray[boundsDurationUnitIndex];
    }
    return undefined;
  }

  private durationUnit(durationUnitCode: UnitsOfTime): ValueSetContains | undefined {
    const durationUnitIndex = this.durationUnitArray.findIndex(
      value => value.code === durationUnitCode
    );
    if (durationUnitIndex > -1) {
      return this.durationUnitArray[durationUnitIndex];
    }
    return undefined;
  }

  private periodUnit(periodUnitCode: UnitsOfTime): ValueSetContains | undefined {
    const periodUnitIndex = this.durationUnitArray.findIndex(
      value => value.code === periodUnitCode
    );
    if (periodUnitIndex > -1) {
      return this.durationUnitArray[periodUnitIndex];
    }
    return undefined;
  }

  private onLoadedList(): void {
    if (this._dosageInstruction$.value) {
      const dosageInstruction = this._dosageInstruction$.value as FormArray;
      dosageInstruction.controls.forEach((dosageInstructionGroup, nDosage) => {
        if (this.routeArray(nDosage).length === 1) {
          dosageInstructionGroup.get('route').setValue(this.routeArray(nDosage)[0]);
        }
      });
    }
  }

  private onLoadedTIOList(dosageInstructionGroup: FormGroup, dosage: Dosage): void {
    const options = {emitEvent: false};
    dosageInstructionGroup.get(['timing', 'repeat', 'boundsDuration', 'unit'])
      .setValue(this.boundsDurationUnit(dosage?.timing?.repeat?.boundsDuration?.code), options);
    dosageInstructionGroup.get(['timing', 'repeat', 'durationUnit'])
      .setValue(this.durationUnit(dosage?.timing?.repeat?.durationUnit), options);
    dosageInstructionGroup.get(['timing', 'repeat', 'periodUnit'])
      .setValue(this.durationUnit(dosage?.timing?.repeat?.periodUnit), options);
  }
}
