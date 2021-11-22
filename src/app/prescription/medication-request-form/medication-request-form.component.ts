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

import {AfterViewInit, ChangeDetectionStrategy, Component, OnDestroy, OnInit, ViewChild} from '@angular/core';
import {AbstractControl, FormArray, FormBuilder, FormControl, FormGroup} from '@angular/forms';
import {BehaviorSubject, Observable, Subject, Subscription} from 'rxjs';
import {debounceTime, distinctUntilChanged, filter, map, switchMap, takeUntil, tap} from 'rxjs/operators';

import * as lodash from 'lodash';

import {
  MedicationFormIntentAddMedication,
  MedicationFormIntentAddMedicationRequest,
  MedicationFormIntentCdsHelp
} from './medication-request-form.intent';
import {MedicationRequestFormViewModel} from './medication-request-form.view-model';
import {MedicationRequestFormState} from './medication-request-form.state';
import {FhirTypeGuard} from '../../common/fhir/utils/fhir.type.guard';
import {Bundle, MedicationKnowledge, MedicationRequest, Patient, Practitioner} from 'phast-fhir-ts';
import {MatIconRegistry} from '@angular/material/icon';
import {DomSanitizer} from '@angular/platform-browser';
import {FhirLabelProviderFactory} from '../../common/fhir/providers/fhir.label.provider.factory';
import {PrescriptionStateService} from '../prescription-state.service';
import {IRender} from '../../common/cds-access/models/state.model';
import {StateService} from '../../common/cds-access/services/state.service';
import {StateModel} from '../../common/cds-access/models/core.model';
import {DosageInstructionFormComponent} from './dosage-instruction-form/dosage-instruction-form.component';
import {MedicationFormComponent} from './medication-form/medication-form.component';
import {DispenseRequestFormComponent} from './dispense-request-form/dispense-request-form.component';

const MEDICINES_ICON = '<svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">' +
  '<path fill-rule="evenodd" clip-rule="evenodd" d="M14.8106 10.013C14.8091 10.0148 14.8061 10.0186 14.8021 10.0252L8.01 21.1404C8.01052 21.1408 8.01104 21.1411 8.01156 21.1415C8.01351 21.1428 8.01659 21.1445 8.02192 21.1463C8.02695 21.1481 8.03827 21.1513 8.05824 21.1527L19.9246 21.9994C19.9446 22.0009 19.9568 21.9993 19.963 21.9981C19.9696 21.9969 19.9742 21.9952 19.9779 21.9934C19.9827 21.9912 19.9875 21.988 19.9918 21.9841L14.9361 10.0239C14.9342 10.0194 14.9326 10.0164 14.9316 10.0145C14.9257 10.0111 14.9077 10.0026 14.8779 10.0004C14.8449 9.99809 14.8228 10.0054 14.8156 10.0089L14.8132 10.0103C14.8131 10.0103 14.8121 10.0112 14.8106 10.013ZM16.7782 9.24516C16.1307 7.71335 13.9653 7.55884 13.0955 8.98238L6.29281 20.1148C5.50809 21.399 6.38547 23.0385 7.9159 23.1477L19.7823 23.9944C21.3127 24.1036 22.4261 22.6062 21.842 21.2243L16.7782 9.24516Z" fill="#333333"/>' +
  '<path fill-rule="evenodd" clip-rule="evenodd" d="M34 20C37.3137 20 40 17.3137 40 14C40 10.6863 37.3137 8 34 8C30.6863 8 28 10.6863 28 14C28 17.3137 30.6863 20 34 20ZM34 22C38.4183 22 42 18.4183 42 14C42 9.58172 38.4183 6 34 6C29.5817 6 26 9.58172 26 14C26 18.4183 29.5817 22 34 22Z" fill="#333333"/>' +
  '<path fill-rule="evenodd" clip-rule="evenodd" d="M38.2823 14.9846C38.1586 15.5229 37.6219 15.8589 37.0837 15.7351L30.468 14.2142C29.9298 14.0905 29.5938 13.5538 29.7175 13.0156C29.8413 12.4773 30.3779 12.1413 30.9161 12.2651L37.5318 13.786C38.07 13.9097 38.4061 14.4464 38.2823 14.9846Z" fill="#333333"/>' +
  '<path fill-rule="evenodd" clip-rule="evenodd" d="M31.1587 27.2961L20.283 32.3675C18.2808 33.3012 17.4146 35.6811 18.3482 37.6832C19.2819 39.6854 21.6618 40.5516 23.664 39.618L34.5396 34.5466C36.5418 33.613 37.408 31.233 36.4744 29.2309C35.5408 27.2287 33.1609 26.3625 31.1587 27.2961ZM19.4378 30.5549C16.4345 31.9554 15.1352 35.5252 16.5356 38.5285C17.9361 41.5317 21.5059 42.8311 24.5092 41.4306L35.3849 36.3592C38.3881 34.9588 39.6875 31.3889 38.287 28.3856C36.8866 25.3824 33.3167 24.0831 30.3135 25.4835L19.4378 30.5549Z" fill="#333333"/>' +
  '<path fill-rule="evenodd" clip-rule="evenodd" d="M24.7494 30.2858L20.283 32.3675C18.2808 33.3012 17.4146 35.6811 18.3482 37.6832C19.2819 39.6854 21.6618 40.5516 23.664 39.618L28.1304 37.5362L24.7494 30.2858ZM25.7168 27.6279L30.7882 38.5036L24.5092 41.4306C21.5059 42.8311 17.9361 41.5317 16.5356 38.5285C15.1352 35.5252 16.4345 31.9554 19.4378 30.5549L25.7168 27.6279Z" fill="#333333"/>' +
  '</svg>';

type ControlType = 'medication' | 'dosageInstruction' | 'dispenseRequest';

@Component({
  selector: 'app-medication-request-form',
  templateUrl: './medication-request-form.component.html',
  styleUrls: ['./medication-request-form.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MedicationRequestFormComponent implements OnInit, AfterViewInit, OnDestroy, IRender<MedicationRequestFormState> {

  private readonly _unsubscribeTrigger$: Subject<void>;

  private readonly _medicationRequestGroup$: BehaviorSubject<FormGroup>;

  private readonly _medicationKnowledgeArray: Array<MedicationKnowledge>;

  private readonly _loading$: BehaviorSubject<boolean>;

  private readonly _isMedicationAddable$: BehaviorSubject<boolean>;

  private readonly _isMedicationRequestAddable$: BehaviorSubject<boolean>;

  private readonly _formStatusListener$: Subscription;

  private readonly _subscriptionMap: Map<ControlType, Array<Subscription>>;

  @ViewChild(MedicationFormComponent)
  private _medicationForm?: MedicationFormComponent;

  @ViewChild(DosageInstructionFormComponent)
  private _dosageInstructionForm?: DosageInstructionFormComponent;

  @ViewChild(DispenseRequestFormComponent)
  private _dispenseRequestForm?: DispenseRequestFormComponent;

  constructor(private _iconRegistry: MatIconRegistry,
              private _sanitizer: DomSanitizer,
              private _fb: FormBuilder,
              private _labelProviderFactory: FhirLabelProviderFactory,
              private _stateService: StateService,
              private _prescriptionState: PrescriptionStateService,
              private _viewModel: MedicationRequestFormViewModel) {
    this._iconRegistry.addSvgIconLiteral('medicines', this._sanitizer.bypassSecurityTrustHtml(MEDICINES_ICON));
    this._unsubscribeTrigger$ = new Subject<void>();
    this._medicationKnowledgeArray = new Array<MedicationKnowledge>();
    this._loading$ = new BehaviorSubject<boolean>(false);
    this._isMedicationAddable$ = new BehaviorSubject<boolean>(false);
    this._isMedicationRequestAddable$ = new BehaviorSubject<boolean>(false);
    this._medicationRequestGroup$ = new BehaviorSubject<FormGroup>(this._fb.group({
      medicationKnowledge: [undefined],
      requestMode: ['dc']
    }));
    this._formStatusListener$ = new Subscription();
    this._subscriptionMap = new Map<ControlType, Array<Subscription>>();
  }

  public get isLoading$(): Observable<boolean> {
    return this._loading$.asObservable();
  }

  public get isMedicationAddable$(): Observable<boolean> {
    return this._isMedicationAddable$.asObservable();
  }

  public get isMedicationRequestAddable$(): Observable<boolean> {
    return this._isMedicationRequestAddable$.asObservable();
  }

  public get medicationRequestMode$(): Observable<string> {
    return this._prescriptionState.medicationRequestMode$;
  }

  public get onCDSHelp$(): Observable<boolean> {
    return this._prescriptionState.onCDSHelp$;
  }

  public get medicationRequest(): MedicationRequest | undefined {
    return this._viewModel.medicationRequest;
  }

  public get medicationKnowledgeArray(): Array<MedicationKnowledge> {
    return this._medicationKnowledgeArray;
  }

  public get medicationRequestGroup(): FormGroup {
    return this._medicationRequestGroup$.value;
  }

  public get medicationRequestGroup$(): Observable<FormGroup> {
    return this._medicationRequestGroup$.asObservable();
  }

  public ngOnInit(): void {
    this.setUpOnChange();
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

  public ngAfterViewInit(): void {
    if (this._medicationForm) {
      this._medicationForm.medicationGroup$
        .pipe(
            takeUntil(this._unsubscribeTrigger$),
            filter(medication => medication instanceof FormGroup),
            map(medication => medication as FormGroup)
        )
        .subscribe({
          next: (medication) => this.addFormGroupStatusListener('medication', medication),
          error: err => console.error('error', err)
        });
      this._medicationForm.medicationGroup$
          .pipe(
              takeUntil(this._unsubscribeTrigger$),
              filter(medication => medication === false)
          )
          .subscribe({
            next: () => this.removeFormGroupStatusListener('medication'),
            error: err => console.error('error', err)
          });
    }
    if (this._dosageInstructionForm) {
      this._dosageInstructionForm.dosageInstruction$
        .pipe(
            takeUntil(this._unsubscribeTrigger$),
            filter(dosageInstruction => dosageInstruction instanceof FormArray),
            map(dosageInstruction => dosageInstruction as FormArray)
        )
        .subscribe({
          next: (dosageInstruction) => this.addFormGroupStatusListener('dosageInstruction', dosageInstruction),
          error: err => console.error('error', err)
        });
      this._dosageInstructionForm.dosageInstruction$
          .pipe(
              takeUntil(this._unsubscribeTrigger$),
              filter(dosageInstruction => dosageInstruction === false)
          )
          .subscribe({
            next: () => this.removeFormGroupStatusListener('dosageInstruction'),
            error: err => console.error('error', err)
          });
    }
    if (this._dispenseRequestForm) {
      this._dispenseRequestForm.dispenseRequestGroup$
          .pipe(
              takeUntil(this._unsubscribeTrigger$),
              filter(dispenseRequest => dispenseRequest instanceof FormGroup),
              map(dispenseRequest => dispenseRequest as FormGroup)
          )
          .subscribe({
            next: (dispenseRequest) => this.addFormGroupStatusListener('dispenseRequest', dispenseRequest),
            error: err => console.error('error', err)
          });
      this._dispenseRequestForm.dispenseRequestGroup$
          .pipe(
              takeUntil(this._unsubscribeTrigger$),
              filter(dispenseRequest => dispenseRequest === false)
          )
          .subscribe({
            next: () => this.removeFormGroupStatusListener('dispenseRequest'),
            error: err => console.error('error', err)
          });
    }
  }

  public ngOnDestroy(): void {
    this._unsubscribeTrigger$.next();
    this._unsubscribeTrigger$.complete();

    this._loading$.complete();
    this._formStatusListener$.unsubscribe();
  }

  public render(state: MedicationRequestFormState): void {
    switch (state.type) {
      case 'AddMedication':
        this._prescriptionState.hasMedication = true;
        break;
      case 'RemoveMedication':
        this._prescriptionState.hasMedication = false;
        break;
      case 'AddMedicationRequest':
        const medicationKnowledgeControl = this.medicationRequestGroup.get('medicationKnowledge');
        if (medicationKnowledgeControl) {
          medicationKnowledgeControl.reset(undefined);
        }
        this._prescriptionState.hasMedication = false;
        break;
    }
  }

  public toFormControl(control: AbstractControl | null): FormControl | null {
    if (control) {
      return control as FormControl;
    }
    return null;
  }

  public trackById(_: number, medicationKnowledge: MedicationKnowledge): string | undefined {
    return medicationKnowledge?.id;
  }

  public displayFn(medicationKnowledge: MedicationKnowledge): string | undefined {
    return this._labelProviderFactory.getProvider(medicationKnowledge)?.getText(medicationKnowledge);
  }

  public onAddMedication(): void {
    const medicationKnowledgeControl = this.medicationRequestGroup.get('medicationKnowledge');
    if (medicationKnowledgeControl) {
      const medicationKnowledge = medicationKnowledgeControl.value;
      const medicationId = this._viewModel.nextMedicationId();

      let patient: Patient | undefined;
      let practitioner: Practitioner | undefined;
      if (this._stateService.state) {
        const state = this._stateService.state as StateModel;
        patient = state.patient;
        practitioner = state.practitioner;
      }

      if (patient && practitioner) {
        this._viewModel.dispatchIntent(
          new MedicationFormIntentAddMedication(
            this._viewModel.medicationRequest, medicationKnowledge, medicationId, patient, practitioner
          )
        );
      }
      medicationKnowledgeControl.reset(null);
    }
  }

  public onAddMedicationRequest(): void {
    const medicationRequest = lodash.cloneDeep(this._viewModel.medicationRequest);
    if (medicationRequest) {
      this._viewModel.dispatchIntent(
        new MedicationFormIntentAddMedicationRequest(medicationRequest)
      );
      this._prescriptionState.addMedicationRequest(medicationRequest);
    }
  }

  public onCDSHelp(): void {
    if (this._viewModel.medicationRequest) {
      this._prescriptionState.onCDSHelp = true;
      this._viewModel.dispatchIntent(
        new MedicationFormIntentCdsHelp(this._viewModel.medicationRequest)
      );
      this._prescriptionState.callCdsHooks(this._viewModel.medicationRequest);
    }
  }

  private setUpOnChange(): void {
    const medicationKnowledgeControl = this.medicationRequestGroup.get('medicationKnowledge');
    if (medicationKnowledgeControl) {
      const medicationKnowledgeControlNull$ = medicationKnowledgeControl.valueChanges
        .pipe(
          filter(value => value == null)
        );

      medicationKnowledgeControlNull$
        .pipe(
          takeUntil(this._unsubscribeTrigger$),
        )
        .subscribe({
          next: () => this.onReset(),
          error: err => console.error('error', err)
        });

      const medicationKnowledgeControlString$ = medicationKnowledgeControl.valueChanges
        .pipe(
          debounceTime(500),
          distinctUntilChanged(),
          filter(value => typeof value === 'string')
        );
      medicationKnowledgeControlString$
        .pipe(
          takeUntil(this._unsubscribeTrigger$),
          tap(
            () => {
              this._medicationKnowledgeArray.length = 0;
              this._loading$.next(true);
            }),
          switchMap(value => this._viewModel.searchMedicationKnowledge(
              value, this.medicationRequestGroup.get('requestMode')?.value
          )
            .pipe(
              tap(() => this._loading$.next(false))
            )),
          filter(value => FhirTypeGuard.isBundle(value)),
          map(bundle => bundle as Bundle),
          filter(bundle => !!(bundle?.total && bundle.total > 0))
        )
        .subscribe({
          next: (bundle: Bundle) => bundle.entry?.forEach(entry => {
            if (FhirTypeGuard.isMedicationKnowledge(entry.resource)) {
              this._medicationKnowledgeArray.push(entry.resource);
            }
          }),
          error: err => console.error('error', err),
        });

      const medicationKnowledgeControlFhir$ = medicationKnowledgeControl.valueChanges
        .pipe(
          filter(value => value instanceof Object && FhirTypeGuard.isMedicationKnowledge(value))
        );
      medicationKnowledgeControlFhir$
        .pipe(
          takeUntil(this._unsubscribeTrigger$)
        )
        .subscribe({
          next: () => this._isMedicationAddable$.next(true),
          error: err => console.error('error', err)
        });
    }

    const requestModeControl = this.medicationRequestGroup.get('requestMode');
    if (requestModeControl) {
      requestModeControl.valueChanges
        .pipe(
          takeUntil(this._unsubscribeTrigger$)
        )
        .subscribe({
          next: mode => this.onChangeMode(mode),
          error: err => console.error('error', err)
        });
    }
  }

  private addFormGroupStatusListener(controlType: ControlType, control: AbstractControl): void {
    const subscription = control.statusChanges
        .subscribe({
          next: status => this.onChangeFormStatus(control, status),
          error: err => console.error('error', err)
        });
    this._formStatusListener$.add(subscription);
    if (this._subscriptionMap.has(controlType)) {
      const subscriptions = this._subscriptionMap.get(controlType);
      if (subscriptions) {
        subscriptions.push(subscription);
      }
    }
    else {
      this._subscriptionMap.set(controlType, new Array<Subscription>(subscription));
    }
  }

  private removeFormGroupStatusListener(controlType: ControlType): void {
    if (this._subscriptionMap.has(controlType)) {
      this._subscriptionMap.delete(controlType);
    }
  }

  private onChangeFormStatus(control: AbstractControl, status: string/*: FormControlStatus*/): void {
    this.updateIsMedicationRequestAddable();
  }

  private updateIsMedicationRequestAddable(): void {
    const medicationGroupValid = (this._medicationForm?.medicationGroup) ?
        this._medicationForm.medicationGroup.valid : false;
    const dosageInstructionValid = (this._dosageInstructionForm?.dosageInstruction) ?
      this._dosageInstructionForm.dosageInstruction.valid : false;
    /*const dispenseRequestGroupValid = (this._dispenseRequestForm?.dispenseRequestGroup) ?
      this._dispenseRequestForm.dispenseRequestGroup.valid : false;*/
    this._isMedicationRequestAddable$.next(
      medicationGroupValid
      && dosageInstructionValid
      // && dispenseRequestGroupValid
    );
  }

  private onChangeMode(mode: string): void {
    this._prescriptionState.medicationRequestMode = mode;
    const medicationKnowledgeControl = this.medicationRequestGroup.get('medicationKnowledge');
    if (medicationKnowledgeControl) {
      medicationKnowledgeControl.reset(undefined);
    }
  }

  private onReset(): void {
    this._isMedicationAddable$.next(false);
    this._medicationKnowledgeArray.length = 0;
  }
}
