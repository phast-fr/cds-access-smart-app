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
    switch (state.type) {
      case 'AddMedication':
        if (state.medicationRequest) {
          this._metadataGroup$.next(
            this.addMedication(state.medicationRequest)
          );
        }
        break;
      case 'RemoveMedication':
        if (state.medicationRequest && this.metadataGroup) {
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
              if (this._viewModel.medicationRequest) {
                this._viewModel.dispatchIntent(
                  new MedicationFormIntentValueChangesTreatmentIntent(
                    this._viewModel.medicationRequest,
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
              if (this._viewModel.medicationRequest) {
                this._viewModel.dispatchIntent(
                  new MedicationFormIntentValueChangesTreatmentIntent(
                    this._viewModel.medicationRequest,
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
