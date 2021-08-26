import {ChangeDetectionStrategy, Component, OnDestroy, OnInit} from '@angular/core';
import {AbstractControl, FormBuilder, FormControl, FormGroup} from '@angular/forms';
import {BehaviorSubject, Observable, Subject} from 'rxjs';
import {filter, takeUntil, tap} from 'rxjs/operators';

import {IRender} from '../../../common/cds-access/models/state.model';
import {MedicationRequestFormState} from '../medication-request-form.state';
import {FhirLabelProviderFactory} from '../../../common/fhir/providers/fhir.label.provider.factory';
import {MedicationRequestFormViewModel} from '../medication-request-form-view-model';
import {
  MedicationFormIntentValueChangesTreatmentIntent
} from '../medication-request-form.intent';
import {CodeableConcept, MedicationRequest, ValueSetContains} from 'phast-fhir-ts';

@Component({
  selector: 'app-metadata-form',
  templateUrl: './metadata-form.component.html',
  styleUrls: ['./metadata-form.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MetadataFormComponent implements OnInit, OnDestroy, IRender<MedicationRequestFormState> {

  private readonly _unsubscribeTrigger$: Subject<void>;

  private readonly _metadataGroup$: BehaviorSubject<FormGroup | boolean>;

  constructor(private _fb: FormBuilder,
              private _labelProviderFactory: FhirLabelProviderFactory,
              private _viewModel: MedicationRequestFormViewModel) {
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

  public get treatmentIntentList(): Array<CodeableConcept> {
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
    switch (state.type) {
      case 'AddMedication':
        this._metadataGroup$.next(
          this.addMedication(state.medicationRequest)
        );
        break;
      case 'AddMedicationRequest':
        this._metadataGroup$.next(false);
        break;
    }
  }

  public trackByValueSetContains(_, valueSetContains: ValueSetContains): string {
    return valueSetContains.code;
  }

  public displayFnValueSetContains(valueSetContains: ValueSetContains): string | null {
    return this._labelProviderFactory.getProvider('fhir.ValueSetContains').getText(valueSetContains);
  }

  private addMedication(medicationRequest: MedicationRequest): FormGroup {
    let treatmentIntent: CodeableConcept;
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
    const treatmentIntentValid$ = metadataGroup.get('treatmentIntent').valueChanges
      .pipe(
        filter(predicate => this._viewModel.treatmentIntent.findIndex(
          value => value.code === predicate.code
        ) > -1)
      );
    const treatmentIntentNotValid$ = metadataGroup.get('treatmentIntent').valueChanges
      .pipe(
        filter(predicate => this._viewModel.treatmentIntent.findIndex(
          value => value.code === predicate.code
        ) === -1)
      );

    treatmentIntentValid$
      .pipe(
        takeUntil(this._unsubscribeTrigger$),
        tap(value => metadataGroup.get('treatmentIntent')
          .setValue(value, {emitEvent: false}))
      )
      .subscribe({
        next: value => this._viewModel.dispatchIntent(
          new MedicationFormIntentValueChangesTreatmentIntent(
            this._viewModel.medicationRequest,
            value
          )
        ),
        error: err => console.error('error', err)
      });
    treatmentIntentNotValid$
      .pipe(
        takeUntil(this._unsubscribeTrigger$),
        tap(() => metadataGroup.get('treatmentIntent')
          .setValue(null, {emitEvent: false}))
      )
      .subscribe({
        next: () => this._viewModel.dispatchIntent(
          new MedicationFormIntentValueChangesTreatmentIntent(
            this._viewModel.medicationRequest,
            null
          )
        ),
        error: err => console.error('error', err)
      });
  }
}
