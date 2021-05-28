import { AfterViewInit, Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { merge, Observable, Subject, BehaviorSubject, from, of, fromEvent } from 'rxjs';
import { catchError, debounceTime, distinctUntilChanged, filter, finalize, map, switchMap, takeUntil, tap } from 'rxjs/operators';

import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { CollectionViewer, DataSource, SelectionModel } from '@angular/cdk/collections';

import { environment } from '../../environments/environment';

import { StateService } from '../common/services/state.service';
import { SmartService } from '../smart/services/smart.service';
import { StateModel } from '../common/models/state.model';
import { TableElement } from '../common/models/core.model';
import { FhirDataSourceService } from '../common/services/fhir.data-source.service';
import { FhirCioDcService } from '../common/services/fhir.cio.dc.service';
import { FhirLabelProviderFactory } from '../common/fhir/fhir.label.provider.factory';
import { fhir } from '../common/fhir/fhir.types';
import Bundle = fhir.Bundle;
import id = fhir.id;
import Composition = fhir.Composition;
import Practitioner = fhir.Practitioner;
import MedicationKnowledge = fhir.MedicationKnowledge;

@Component({
  selector: 'app-formulary',
  templateUrl: './formulary.component.html',
  styleUrls: ['./formulary.component.css']
})
export class FormularyComponent implements OnInit, OnDestroy, AfterViewInit  {

  private _labelProviderFactory = new FhirLabelProviderFactory();

  tableDataSource: MedicationKnowledgeDataSource;

  @ViewChild(MatPaginator)
  paginator: MatPaginator;
  @ViewChild(MatSort)
  sort: MatSort;
  @ViewChild('inputFilter')
  inputFilter: ElementRef;

  selection = new SelectionModel<id>(true, []);

  displayedColumns = ['select', 'position', 'code'];

  user: Practitioner;

  private _unsubscribeTrigger$ = new Subject<void>();

  constructor(private stateService: StateService,
              private route: ActivatedRoute,
              private smartService: SmartService,
              private _dataSource: FhirDataSourceService,
              private _cioDcSource: FhirCioDcService) {
    this.stateService.stateSubject$
      .pipe(
        takeUntil(this._unsubscribeTrigger$),
        filter(stateModel => this.userType(stateModel) === 'Practitioner'),
        switchMap(stateModel => this._dataSource.readPractitioner(this.userId(stateModel)))
      )
      .subscribe(
        (user: Practitioner) => this.user = user
      );
    this.tableDataSource = new MedicationKnowledgeDataSource(this._cioDcSource);
  }

  public get labelProviderFactory(): FhirLabelProviderFactory {
    return this._labelProviderFactory;
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

    this.tableDataSource.loadPage();
    this.loadSelection();
  }

  ngAfterViewInit(): void {
    fromEvent(this.inputFilter.nativeElement, 'keyup')
      .pipe(
        takeUntil(this._unsubscribeTrigger$),
        debounceTime(500),
        distinctUntilChanged(),
        tap(() => {
          this.paginator.pageIndex = 0;
          this.loadPage();
        })
      )
      .subscribe();

    this.sort.sortChange
      .pipe(
        takeUntil(this._unsubscribeTrigger$)
      )
      .subscribe(() => this.paginator.pageIndex = 0);

    merge(this.sort.sortChange, this.paginator.page)
      .pipe(
        takeUntil(this._unsubscribeTrigger$),
        tap(() => this.loadPage())
      )
      .subscribe();
  }

  ngOnDestroy(): void {
    this._unsubscribeTrigger$.next();
    this._unsubscribeTrigger$.complete();
  }

  onSave(): void {
    const promises: Array<Promise<object>> = [];
    this.selection.selected.forEach(
      value => console.log('store MK + ref with catalog', value)
    );
    /*const elements = this.medicationKnowledgeDataSource.data.slice();
    elements.forEach(value => {
      const resource = lodash.cloneDeep(value.resource);
      delete resource.medicationCodeableConcept;
      const authoredOn = new Date(Date.now());
      resource.authoredOn = authoredOn.toISOString();
      promises.push(this._dataSource.saveResource(resource));
    });*/
    Promise.all(promises)
      .then(
        value => {
          console.log('saved: ', value);
        })
      .catch(reason => console.log('Reason: ', reason))
      .finally(() => {

      });
  }

  /** Whether the number of selected elements matches the total number of rows. */
  isAllSelected(): boolean {
    const numSelected = this.selection.selected.length;
    const numRows = (this.paginator) ?
      this.paginator.pageIndex * this.paginator.pageSize + this.paginator.pageSize : this.tableDataSource.pageSize;
    return numSelected === numRows;
  }

  /** Selects all rows if they are not all selected; otherwise clear selection. */
  masterToggle(): void {
    this.isAllSelected() ?
      this.selection.clear() : this.tableDataSource.content.forEach(row => this.selection.select(row?.resource.id));
  }

  /** The label for the checkbox on the passed row */
  checkboxLabel(row?: TableElement<MedicationKnowledge>): string {
    if (!row) {
      return `${this.isAllSelected() ? 'select' : 'deselect'} all`;
    }
    return `${this.selection.isSelected(row.resource.id) ? 'deselect' : 'select'} row ${row.position + 1}`;
  }

  private loadPage(): void {
    this.tableDataSource.loadPage(
      this.inputFilter.nativeElement.value,
      this.sort.active,
      this.sort.direction,
      this.paginator.pageIndex,
      this.paginator.pageSize
    );
  }

  private loadSelection(): void {
    // TODO load selection form Logica
    /*from(this._dataSource.readComposition(environment.drug_formulary_id))
      .pipe(
        takeUntil(this._unsubscribeTrigger$),
        catchError(err => {
          console.log('Error: ', err);
          return of({
            resourceType: 'Composition',
            section: []
          } as Composition);
        }),
      )
      .subscribe(composition => console.log(composition));*/
  }

  private userType(stateModel: StateModel): string | null {
    const profile = stateModel.user.profile;
    if (profile) {
      return profile.split('/')[0];
    }
    return null;
  }

  private userId(stateModel: StateModel): string | null {
    const profile = stateModel.user.profile;
    if (profile) {
      return profile.split('/')[1];
    }
    return null;
  }
}

export class MedicationKnowledgeDataSource implements DataSource<TableElement<MedicationKnowledge>> {

  private _entry$ = new BehaviorSubject<TableElement<MedicationKnowledge>[]>([]);

  private _loading$ = new BehaviorSubject<boolean>(false);

  private _unsubscribeTrigger$ = new Subject<void>();

  private _length: number;

  constructor(private _cioDcSource: FhirCioDcService) { }

  public loading$ = this._loading$.asObservable();

  public get content(): TableElement<MedicationKnowledge>[] {
    return this._entry$.value;
  }

  public get length(): number {
    return this._length;
  }

  public get pageSize(): number {
    return FhirCioDcService.DEFAULT_PAGE_SIZE;
  }

  connect(collectionViewer: CollectionViewer): Observable<TableElement<MedicationKnowledge>[]> {
    return this._entry$.asObservable();
  }

  disconnect(collectionViewer: CollectionViewer): void {
    this._unsubscribeTrigger$.next();
    this._unsubscribeTrigger$.complete();
    this._entry$.complete();
    this._loading$.complete();
  }

  loadPage(medicationKnowledgeFilter?: string, sortActive?: string, sortDirection?: string,
           pageIndex?: number, pageSize?: number): void {
    this._loading$.next(true);
    from(this._cioDcSource.searchMedicationKnowledge(
      medicationKnowledgeFilter,
      sortActive,
      sortDirection,
      pageIndex,
      pageSize
    ))
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
      .subscribe((bundle: Bundle) => {
        this._length = bundle.total;
        const offset = (pageIndex && pageSize) ? pageIndex * pageSize : 0;
        const tableElements = new Array<TableElement<MedicationKnowledge>>();
        bundle.entry.forEach((value, index) => {
          const element = {
            position: index + offset + 1,
            resource: value.resource as MedicationKnowledge
          } as TableElement<MedicationKnowledge>;
          tableElements.push(element);
        });
        this._entry$.next(tableElements);
      });
  }
}
