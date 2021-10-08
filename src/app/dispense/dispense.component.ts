import {AfterViewInit, Component, ElementRef, Inject, OnDestroy, ViewChild} from '@angular/core';
import {MatDialog, MatDialogRef, MAT_DIALOG_DATA} from '@angular/material/dialog';
import { ActivatedRoute } from '@angular/router';
import { FormBuilder } from '@angular/forms';
import {BehaviorSubject, from, fromEvent, merge, Observable, of, Subject} from 'rxjs';
import {catchError, debounceTime, distinctUntilChanged, filter, finalize, map, switchMap, takeUntil, tap} from 'rxjs/operators';

import { StateService } from '../common/cds-access/services/state.service';
import { FhirSmartService } from '../common/fhir/smart/services/fhir.smart.service';
import { DispenseStateService } from './dispense-state.service';
import { FhirDataSourceService } from '../common/fhir/services/fhir.data-source.service';
import { PhastCioDcService } from '../common/cds-access/services/phast.cio.dc.service';
import { FhirTypeGuard } from '../common/fhir/utils/fhir.type.guard';
import { FhirLabelProviderFactory } from '../common/fhir/providers/fhir.label.provider.factory';
import {MedicationRequestDataSource} from './dispense-table/dispense-table.component';
import {MatTableDataSource} from '@angular/material/table';
import {SmartComponent, StateModel, TableElement} from '../common/cds-access/models/core.model';
import {MatPaginator} from '@angular/material/paginator';
import {MatSort} from '@angular/material/sort';
import {CollectionViewer, DataSource} from '@angular/cdk/collections';
import {MatCheckboxChange} from '@angular/material/checkbox';
import {SmartContext} from '../common/fhir/smart/models/fhir.smart.context.model';
import {
  Bundle,
  Composition,
  Medication,
  MedicationRequest,
  Parameters, ParametersParameter,
  Patient,
  Practitioner, Reference
} from 'phast-fhir-ts';

@Component({
  selector: 'app-dispense',
  templateUrl: './dispense.component.html',
  styleUrls: ['./dispense.component.css']
})
export class DispenseComponent extends SmartComponent implements OnDestroy, AfterViewInit  {

  private _user?: Practitioner;

  composition?: Composition;

  medicationRequestControl = this._fb.control(null);

  isLoading = false;

  ucdDataSource: ParametersParameterDataSource;

  @ViewChild(MatPaginator)
  paginator?: MatPaginator;
  @ViewChild(MatSort)
  sort?: MatSort;
  @ViewChild('inputFilter')
  inputFilter?: ElementRef;

  private  _MedicationRequestDataSource?: MedicationRequestDataSource;
  private _medicationRequestArray = new Array<MedicationRequest>();
  private _medicationArray = new Array<Medication>();
  private _ucdArray = new Array<ParametersParameter>();

  private _selectedMedicationRequest?: MedicationRequest;
  private _selectedMedication?: Medication;

  private  _patient?: Patient;

  private _needBanner$ = new BehaviorSubject<boolean>(false);
  private  _withLivret?: boolean;

  medicationDataSource = new MatTableDataSource<TableElement<Medication>>([]);
  displayedColumns: Array<string> = ['position', 'name'];

  constructor(public dialog: MatDialog,
              private _fb: FormBuilder,
              route: ActivatedRoute,
              private stateService: StateService,
              smartService: FhirSmartService,
              /*private _dispenseState: DispenseStateService,*/
              private _dataSource: FhirDataSourceService,
              private _cioDcSource: PhastCioDcService,
              private _labelProviderFactory: FhirLabelProviderFactory) {
    super(route, smartService);
    this.ucdDataSource = new ParametersParameterDataSource(this._cioDcSource);

    this.stateService.state$
      .pipe(
        takeUntil(this.unsubscribeTrigger$),
        filter(state => state !== false),
        map(state => state as StateModel),
        map(state => this.update(state)),
        switchMap(() =>   this._cioDcSource.readCompositionMedicationKnowledge('phast-formulary-1'))
      )
      .subscribe(composition => this.composition = composition);
  }

  public needBanner$ = this._needBanner$.asObservable();

  public get medicationRequestArray(): Array<MedicationRequest> {
    return this._medicationRequestArray;
  }
  public get medicationArray(): Array<Medication> {
    return this._medicationArray;
  }
  public get ucdArray(): Array<ParametersParameter> {
    return this._ucdArray;
  }
  public get patient(): Patient | undefined {
    return this._patient;
  }

  public get withLivret(): boolean | undefined {
    return this._withLivret;
  }
  public set withLivret(val){
    this._withLivret = val;
  }
  public get user(): Practitioner | undefined {
    return this._user;
  }

  public  get selectedMedication(): Medication | undefined
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

  displayMedicationRequest(medicationRequest: MedicationRequest): string | undefined {
    return this._labelProviderFactory.getProvider(medicationRequest)?.getText(medicationRequest);
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
    super.ngOnDestroy();

    this._needBanner$.complete();
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
    this._dataSource.medicationRequestSearch(this._patient)
      .subscribe(res => {
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

  onWithLivret(ob: MatCheckboxChange): void {
    this.getSpecialites(this._selectedMedication);
  }


  getSpecialites(medication: Medication): void {
    this._selectedMedication = medication;
    fromEvent(
        this.inputFilter.nativeElement, 'keyup'
      ).pipe(
        takeUntil(this.unsubscribeTrigger$),
        debounceTime(500),
        distinctUntilChanged(),
        tap(() => {
          this.paginator.pageIndex = 0;
          this.loadPage(medication, this._selectedMedicationRequest);
        })
      ).subscribe();

    this.ucdDataSource.loadPage(medication, this._selectedMedicationRequest, this._withLivret, this.composition );

    this.sort.sortChange.pipe(
        takeUntil(this.unsubscribeTrigger$)
      ).subscribe(() => this.paginator.pageIndex = 0);

    merge(this.sort.sortChange, this.paginator.page)
      .pipe(
        takeUntil(this.unsubscribeTrigger$),
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

  openDialog(parameter: ParametersParameter): void {
    let quantite = 0;
    if (this._selectedMedicationRequest.dosageInstruction != null && this._selectedMedicationRequest.dosageInstruction.length > 0){
      const di = this._selectedMedicationRequest.dosageInstruction[0];
      if (di != null && di.doseAndRate != null && di.doseAndRate.length > 0){
        const dq = di.doseAndRate[0];
        if (dq != null && dq.doseQuantity != null && dq.doseQuantity.value != null){
          quantite = dq.doseQuantity.value;
        }
      }
    }
    const dialogRef = this.dialog.open(DialogOverviewExampleDialogComponent, {
      width: '400px',
      data: {name: parameter.part.find(e => e.name === 'reference').valueReference.display, quantity: quantite}
    });
    dialogRef.afterClosed().subscribe(result => {
      console.log('The dialog was closed with : ' + result + 'unit(s) selected' );
    });
  }

  private update(state: StateModel): void {
    this._patient = state.patient;
    this._user = state.practitioner;
    this._needBanner$.next(state.needPatientBanner);
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

  constructor(private _cioDcSource: PhastCioDcService) {
  }

  public loading$ = this._loading$.asObservable();

  public get content(): TableElement<ParametersParameter>[] {
    return this._entry$.value;
  }

  public get length(): number {
    return this._length;
  }

  public get pageSize(): number {
    return PhastCioDcService.DEFAULT_PAGE_SIZE;
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

    const route = (selectedMedicationRequest.dosageInstruction && selectedMedicationRequest.dosageInstruction.length > 0) ?
      selectedMedicationRequest.dosageInstruction[0].route : null;

    const forme = medication.form;
    const amount = (medication.amount?.numerator) ? medication.amount.numerator : undefined;

    from(
      this._cioDcSource.postMedicationKnowledgeLookupByRouteCodeAndFormCodeAndIngredient('MK_' + medication.code.coding[0].code,
        medication.code, forme, amount, medication.ingredient, route )
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

        const ee = (res as Parameters).parameter.filter(e => e.name === 'relatedMedicationKnowledge'
          && e.part.filter(f => f.name === 'reference'));
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
            ucdArray.sort((a, b) =>
              a.part.find(e => e.name === 'reference').valueReference.display >
              b.part.find(e => e.name === 'reference').valueReference.display ? 1 : -1);
          }
        }

        const livretArray = new Array<Reference>();
        for (const rr of livret.section[0].entry){
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
