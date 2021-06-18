import {AfterViewInit, Component, ElementRef, Inject, OnDestroy, OnInit, ViewChild} from '@angular/core';
import {MatDialog, MatDialogRef, MAT_DIALOG_DATA} from '@angular/material/dialog';
import { ActivatedRoute } from '@angular/router';
import { FormBuilder } from '@angular/forms';
import {BehaviorSubject, from, fromEvent, merge, Observable, of, Subject} from 'rxjs';
import {catchError, debounceTime, distinctUntilChanged, filter, finalize, map, switchMap, takeUntil, tap} from 'rxjs/operators';

import { StateService } from '../common/services/state.service';
import { SmartService } from '../smart/services/smart.service';
import { DispenseStateService } from './dispense-state.service';
import { FhirDataSourceService } from '../common/services/fhir.data-source.service';
import { FhirCioDcService } from '../common/services/fhir.cio.dc.service';
import { FhirTypeGuard } from '../common/fhir/fhir.type.guard';
import { FhirLabelProviderFactory } from '../common/fhir/fhir.label.provider.factory';
import { fhir } from '../common/fhir/fhir.types';
import Bundle = fhir.Bundle;
import Composition = fhir.Composition;
import Practitioner = fhir.Practitioner;
import Patient = fhir.Patient;
import MedicationRequest = fhir.MedicationRequest;
import Medication = fhir.Medication;
import MedicationKnowledge = fhir.MedicationKnowledge;
import Parameters = fhir.Parameters;
import Reference = fhir.Reference;
import ParametersParameter = fhir.ParametersParameter;
import {MedicationRequestDataSource} from './dispense-table/dispense-table.component';
import {MatTableDataSource} from '@angular/material/table';
import {TableElement} from '../common/models/core.model';
import {MatPaginator} from '@angular/material/paginator';
import {MatSort} from '@angular/material/sort';
import {CollectionViewer, DataSource} from '@angular/cdk/collections';
import {MatCheckboxChange} from '@angular/material/checkbox';
import {SmartToken} from '../smart/models/smart.token.model';


@Component({
  selector: 'app-dispense',
  templateUrl: './dispense.component.html',
  styleUrls: ['./dispense.component.css']
})
export class DispenseComponent implements OnInit, OnDestroy, AfterViewInit  {

  private _labelProviderFactory = new FhirLabelProviderFactory();

  user: Practitioner;

  composition: Composition;

  medicationRequestControl = this._fb.control(null);

  isLoading = false;

  ucdDataSource: ParametersParameterDataSource;

  @ViewChild(MatPaginator)
  paginator: MatPaginator;
  @ViewChild(MatSort)
  sort: MatSort;
  @ViewChild('inputFilter')
  inputFilter: ElementRef;

  private  _MedicationRequestDataSource: MedicationRequestDataSource;
  private _medicationRequestArray = new Array<MedicationRequest>();
  private _medicationArray = new Array<Medication>();
  private _ucdArray = new Array<ParametersParameter>();

  private _unsubscribeTrigger$ = new Subject<void>();
  private _selectedMedicationRequest: MedicationRequest;
  private _selectedMedication: Medication;

  private  _patient: Patient;

  private  _needPatientBanner: boolean;
  private  _withLivret: boolean;

  medicationDataSource = new MatTableDataSource<TableElement<Medication>>([]);
  displayedColumns: Array<string> = ['position', 'name'];

  constructor(public dialog: MatDialog,
              private _fb: FormBuilder,
              private route: ActivatedRoute,
              private stateService: StateService,
              private smartService: SmartService,
              /*private _dispenseState: DispenseStateService,*/
              private _dataSource: FhirDataSourceService,
              private _cioDcSource: FhirCioDcService) {
    this.ucdDataSource = new ParametersParameterDataSource(this._cioDcSource);

    this.stateService.stateSubject$
      .pipe(
        takeUntil(this._unsubscribeTrigger$)
      )
      .subscribe(
        (state) => this._needPatientBanner = state.needPatientBanner
      );
    this.stateService.stateSubject$
      .pipe(
        takeUntil(this._unsubscribeTrigger$),
        filter(stateModel => stateModel.userType() === 'Practitioner'),
        switchMap(stateModel => this._dataSource.readPractitioner(stateModel.userId()))
      )
      .subscribe(
        (user) => this.user = user
      );

    this.stateService.stateSubject$
      .pipe(
        takeUntil(this._unsubscribeTrigger$),
        switchMap(stateModel => this._dataSource.readPatient(stateModel.patient))
      )
      .subscribe((patient: Patient) => this._patient = patient);

    this.stateService.stateSubject$
      .pipe(
        takeUntil(this._unsubscribeTrigger$),
        switchMap(stateModel =>   this._cioDcSource.readCompositionMedicationKnowledge('phast-formulary-1'))
      )
      .subscribe((composition: Composition) => this.composition = composition);
  }

  public get labelProviderFactory(): FhirLabelProviderFactory {
    return this._labelProviderFactory;
  }

  public get medicationRequestArray(): Array<MedicationRequest> {
    return this._medicationRequestArray;
  }
  public get medicationArray(): Array<Medication> {
    return this._medicationArray;
  }
  public get ucdArray(): Array<ParametersParameter> {
    return this._ucdArray;
  }
  public get getPatient(): Patient{
    return this._patient;
  }

  public get NeedPatientBanner(): boolean{
    return  this._needPatientBanner;
  }
  public get withLivret(): boolean{
    return this._withLivret;
  }
  public  set withLivret(val){
    this._withLivret = val;
  }
  public  get getUser(): Practitioner{
    return this.user;
  }

  public  get selectedMedication(): Medication
  {
    return this._selectedMedication;
  }
  public get selectedMedicationRequest(): string{
    if (!this._selectedMedicationRequest) {
      return null;
    }
    let labelComposed = ' ';
    if (this._selectedMedicationRequest.dosageInstruction != null && this._selectedMedicationRequest.dosageInstruction.length > 0){
        labelComposed += ' (';
        for (const dosage of this._selectedMedicationRequest.dosageInstruction){
          if (dosage.doseAndRate != null && dosage.doseAndRate.length > 0) {
            for (const doseAndRate of dosage.doseAndRate) {
              if (doseAndRate.doseQuantity != null ) {
                labelComposed += ' ' + doseAndRate.doseQuantity.value;
                if (doseAndRate.doseQuantity.unit != null) {
                  labelComposed += doseAndRate.doseQuantity.unit;
                } else {
                  labelComposed += ' unité' + (doseAndRate.doseQuantity.value > 1 ? 's' : '');
                }
              }
            }
            if (dosage.timing != null) {
                let first = true;
                if (dosage.timing.repeat != null) {
                  if (dosage.timing.repeat.timeOfDay != null && dosage.timing.repeat.timeOfDay.length > 0) {
                    for (const t of dosage.timing.repeat.timeOfDay) {
                      labelComposed += (first ? ' ' : '-') + t;
                      first = false;
                    }
                  }
                }
              }
            }
          }
      labelComposed += ')';
      }
    return labelComposed;
    }

  displayMedicationRequest(medicationRequest: MedicationRequest): string | null {
    if (medicationRequest == null) { return null; }
    return this._labelProviderFactory.getProvider(medicationRequest).getText(medicationRequest);
  }
  ngOnInit(): void {
    const routeWithoutToken$ = this.route.queryParams
      .pipe(
        filter(_ => !this.smartService.isTokenExist())
      );
    const routeWithToken$ = this.route.queryParams
      .pipe(
        filter(_ => this.smartService.isTokenExist())
      );
    routeWithoutToken$
      .pipe(
        takeUntil(this._unsubscribeTrigger$),
        map(params  => {
          return {
            code: params.code,
            state: params.state
          };
        })
      )
      .subscribe(value => this.smartService.retrieveToken(value.code, value.state));
    routeWithToken$
      .subscribe(_ => this.smartService.loadToken());
  }

  ngAfterViewInit(): void {
    const compositionString$ = this.medicationRequestControl.valueChanges
      .pipe(
        filter(value => typeof value === 'string')
      );
    const compositionObj$ = this.medicationRequestControl.valueChanges
      .pipe(
        filter(value => value instanceof Object)
      );
    /*
    compositionString$
      .pipe(
        takeUntil(this._unsubscribeTrigger$),
        debounceTime(500),
        distinctUntilChanged(),
        tap(
          () => {
            //this._compositionArray.length = 0;
            this.isLoading = true;
          }),
        switchMap(value => this._cioDcSource.searchComposition(value))
      )
      .subscribe(
        response => {
          const bundle = response as Bundle;
          if (bundle.total > 0) {
            for (const entry of bundle.entry) {
              if (FhirTypeGuard.isComposition(entry.resource)) {
                this._compositionArray.push(entry.resource);
              }
            }
          }
          this.isLoading = false;
        });
      */
    compositionObj$
/*      .pipe(
        switchMap(composition => this._cioDcSource.readCompositionMedicationKnowledge(composition.id))
      )*/
      .subscribe(( medicationRequest: MedicationRequest) => {
        console.log(medicationRequest);
        this._selectedMedicationRequest = medicationRequest;
        this._selectedMedication = null;

        this.medicationDataSource.data.length = 0;
        for (const medication of medicationRequest.contained){
          // this._medicationArray.push(medication as Medication);
          this.medicationDataSource.data.push({
            position: this.medicationDataSource.data.length + 1,
            resource: medication as Medication
          });
          this.medicationDataSource._updateChangeSubscription();
        }
        // this.composition = composition;
        // this._dispenseState.changeComposition = composition;
      });
  }

  ngOnDestroy(): void {
    this._unsubscribeTrigger$.next();
    this._unsubscribeTrigger$.complete();
  }
/*
  displayComposition(composition: Composition): string | null {
    if (composition == null) { return null; }
    return this._labelProviderFactory.getProvider(composition).getText(composition);
  }
*/
  onGetDispense(): void{
    console.log(this._patient.name);
    this.isLoading = true;
    this._medicationRequestArray.length = 0;
    this._dataSource.searchMedicationRequests(this._patient)
      .then(
        (res) => {
          console.log(res);
          this.isLoading = false;
          const bundle = (res as Bundle);
          if (bundle.entry != null){
            for (const entry of bundle.entry) {
              if (FhirTypeGuard.isMedicationRequest(entry.resource)) {
                this._medicationRequestArray.push(entry.resource);

                for (const medication of entry.resource.contained){
                  console.log(entry.resource.id + ' - ' + entry.resource.authoredOn + ' - ' + (medication as Medication).code.text);
                }
              }
            }
          }
        });
  }

  onWithLivret(ob: MatCheckboxChange){
    this.getSpecialites(this._selectedMedication);
  }


  getSpecialites(medication: Medication): void{
    this._selectedMedication = medication;
    fromEvent(
        this.inputFilter.nativeElement, 'keyup'
      ).pipe(
        takeUntil(this._unsubscribeTrigger$),
        debounceTime(500),
        distinctUntilChanged(),
        tap(() => {
          this.paginator.pageIndex = 0;
          this.loadPage(medication, this._selectedMedicationRequest);
        })
      ).subscribe();

    this.ucdDataSource.loadPage(medication, this._selectedMedicationRequest, this._withLivret, this.composition );

    this.sort.sortChange.pipe(
        takeUntil(this._unsubscribeTrigger$)
      ).subscribe(() => this.paginator.pageIndex = 0);

    merge(this.sort.sortChange, this.paginator.page)
      .pipe(
        takeUntil(this._unsubscribeTrigger$),
        tap(() => this.loadPage(medication, this._selectedMedicationRequest))
      ).subscribe();
  }

  private loadPage(medication: Medication, selectedMedicationRequest: MedicationRequest): void {
    this.ucdDataSource.loadPage(medication,
      selectedMedicationRequest,
      this._withLivret,
      this.composition,
      this.inputFilter.nativeElement.value,
      this.sort.active,
      this.sort.direction,
      this.paginator.pageIndex,
      this.paginator.pageSize
    );
  }

  openDialog(parameter: ParametersParameter) {
    const dialogRef = this.dialog.open(DialogOverviewExampleDialogComponent, {
      width: '400px',
      data: {name: parameter.part.find(e => e.name === 'reference').valueReference.display, quantity: 0}
    });
    dialogRef.afterClosed().subscribe(result => {
      console.log('The dialog was closed with : ' + result + 'unit(s) selected' );
    });
  }
}

export interface DialogData {
  name: string;
  quantity: number;
}
@Component({
  selector: 'app-dialog-overview-example-dialog',
  templateUrl: './dialog-overview-example-dialog.html',
})
export class DialogOverviewExampleDialogComponent {

  constructor(
    public dialogRef: MatDialogRef<DialogOverviewExampleDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: DialogData) {}

  onNoClick(): void {
    this.dialogRef.close();

  }
}
export class ParametersParameterDataSource implements DataSource<TableElement<ParametersParameter>> {

  private _entry$ = new BehaviorSubject<TableElement<ParametersParameter>[]>([]);

  private _loading$ = new BehaviorSubject<boolean>(false);

  private _unsubscribeTrigger$ = new Subject<void>();

  private _length: number;

  constructor(private _cioDcSource: FhirCioDcService) {
  }

  public loading$ = this._loading$.asObservable();

  public get content(): TableElement<ParametersParameter>[] {
    return this._entry$.value;
  }

  public get length(): number {
    return this._length;
  }

  public get pageSize(): number {
    return FhirCioDcService.DEFAULT_PAGE_SIZE;
  }

  connect(collectionViewer: CollectionViewer): Observable<TableElement<ParametersParameter>[]> {
    return this._entry$.asObservable();
  }

  disconnect(collectionViewer: CollectionViewer): void {
    this._unsubscribeTrigger$.next();
    this._unsubscribeTrigger$.complete();
    this._entry$.complete();
    this._loading$.complete();
  }

  loadPage(medication: Medication, selectedMedicationRequest: MedicationRequest, auLivret: boolean, livret: Composition,
           medicationRequestFilter?: string, sortActive?: string, sortDirection?: string,
           pageIndex?: number, pageSize?: number): void {
    this._loading$.next(true);

    // tslint:disable-next-line:max-line-length
    const route = selectedMedicationRequest.dosageInstruction != null && selectedMedicationRequest.dosageInstruction.length > 0 ? selectedMedicationRequest.dosageInstruction[0].route : null;
    from(
      this._cioDcSource.postMedicationKnowledgeDetailsByRouteCodeAndFormCodeAndIngredient('MK_' + medication.code.coding[0].code,
        medication.code,
        undefined, medication.ingredient,
        route )
    )
      .pipe(
        takeUntil(this._unsubscribeTrigger$),
        catchError(err => {
          console.log('Error: ', err);
          return of({
            total: 0,
            entry: []
          } as Bundle);
        }),
        finalize(() => this._loading$.next(false))
      )
      .subscribe((res: Parameters) => {
        const offset = (pageIndex && pageSize) ? pageIndex * pageSize : 0;
        const pageSizeEffective = (pageSize) ? pageSize : this.pageSize;
        const tableElements = new Array<TableElement<ParametersParameter>>();

        const ee = (res as Parameters).parameter.filter(e => e.name === 'relatedMedicationKnowledge' && e.part.filter(f => f.name === 'reference'));
        let index = 0;
        const ucdArray = new Array<ParametersParameter>();
        for (const eee of ee) {
          const x = eee.part.find((e => e.name === 'type' && e.valueCodeableConcept.text === 'UCD'));
          if (x != null) {
            if (medicationRequestFilter) {
              if (eee.part.find(e => e.name === 'reference' &&
                (e.valueReference.display.toUpperCase().indexOf(medicationRequestFilter.toUpperCase()) >= 0))){
                ucdArray.push(eee);
              }
            } else {
              ucdArray.push(eee);
            }
            ucdArray.sort((a, b) => a.part.find(e => e.name === 'reference').valueReference.display > b.part.find(e => e.name === 'reference').valueReference.display ? 1 : -1);
          }
        }

        const livretArray = new Array<Reference>();
        for(const rr of livret.section[0].entry){
          livretArray.push(rr);
        }

        for (const eee of ucdArray) {
          if (auLivret) {
            if (livretArray.find(e => e.reference === eee.part.find(s => s.name === 'reference').valueReference.reference)) {
              index++;
              if (index > offset && index <= offset + pageSizeEffective) {
                const element = {
                  position: index,
                  resource: eee
                } as TableElement<ParametersParameter>;
                tableElements.push(element);
              }
            }
          }
          else{
            index++;
            if (index > offset && index <= offset + pageSizeEffective) {
              const element = {
                position: index,
                resource: eee
              } as TableElement<ParametersParameter>;
              tableElements.push(element);
            }
          }
        }
        this._length = index;
        this._entry$.next(tableElements);
        this._loading$.next(false);
      });
  }
}




