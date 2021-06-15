import { Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { merge, Observable, Subject, BehaviorSubject, from, of, fromEvent } from 'rxjs';
import { catchError, debounceTime, distinctUntilChanged, finalize, map, switchMap, takeUntil, tap } from 'rxjs/operators';

import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { CollectionViewer, DataSource, SelectionModel } from '@angular/cdk/collections';

import { environment } from '../../../environments/environment';

import { TableElement } from '../../common/models/core.model';
// import { FormularyStateService } from '../formulary-state.service';
import { FhirDataSourceService } from '../../common/services/fhir.data-source.service';
import { FhirCioDcService } from '../../common/services/fhir.cio.dc.service';
import { ReferenceBuilder } from '../../common/fhir/fhir.resource.builder';
import { ReferenceParser } from '../../common/fhir/fhir.resource.parser';
import { FhirLabelProviderFactory } from '../../common/fhir/fhir.label.provider.factory';
import { fhir } from '../../common/fhir/fhir.types';
import Bundle = fhir.Bundle;
import id = fhir.id;
import Composition = fhir.Composition;
import MedicationKnowledge = fhir.MedicationKnowledge;
import Reference = fhir.Reference;
import MedicationRequest = fhir.MedicationRequest;

@Component({
  selector: 'app-dispense-table',
  templateUrl: './dispense-table.component.html',
  styleUrls: ['./dispense-table.component.css']
})
export class DispenseTableComponent implements OnInit, OnDestroy  {

  private _labelProviderFactory = new FhirLabelProviderFactory();

  tableDataSource: MedicationRequestDataSource;

  @ViewChild(MatPaginator)
  paginator: MatPaginator;
  @ViewChild(MatSort)
  sort: MatSort;
  @ViewChild('inputFilter')
  inputFilter: ElementRef;

  selection = new SelectionModel<id>(true);

  displayedColumns = ['select', 'position', 'code:text'];

  private _composition: Composition;

  private _unsubscribeTrigger$ = new Subject<void>();

  constructor(// private _formularyState: FormularyStateService,
              private _dataSource: FhirDataSourceService,
              private _cioDcSource: FhirCioDcService) {
    this.tableDataSource = new MedicationRequestDataSource(this._cioDcSource);
  }

  public get labelProviderFactory(): FhirLabelProviderFactory {
    return this._labelProviderFactory;
  }

  public get composition(): Composition {
    return this._composition;
  }

  ngOnInit(): void {
    /* this._formularyState.composition$
      .subscribe(
      composition => {
        this._composition = composition;

        const values = new Set<id>();
        const parser = new ReferenceParser();
        for (const reference of composition.section[0].entry) {
          parser.parse(reference.reference);
          values.add(parser.id);
        }
        console.log(composition);
        this.selection.select(...Array.from(values));

        this.tableDataSource.loadPage();

        fromEvent(
          this.inputFilter.nativeElement, 'keyup'
        )
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
    );*/
  }

  ngOnDestroy(): void {
    this._unsubscribeTrigger$.next();
    this._unsubscribeTrigger$.complete();
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
      this.selection.clear() : this.tableDataSource.content.forEach(
        row => this.selection.select(row?.resource.id)
      );
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
}

export class MedicationRequestDataSource implements DataSource<TableElement<MedicationRequest>> {

  private _entry$ = new BehaviorSubject<TableElement<MedicationRequest>[]>([]);

  private _loading$ = new BehaviorSubject<boolean>(false);

  private _unsubscribeTrigger$ = new Subject<void>();

  private _length: number;

  constructor(private _cioDcSource: FhirCioDcService) {
  }

  public loading$ = this._loading$.asObservable();

  public get content(): TableElement<MedicationRequest>[] {
    return this._entry$.value;
  }

  public get length(): number {
    return this._length;
  }

  public get pageSize(): number {
    return FhirCioDcService.DEFAULT_PAGE_SIZE;
  }

  connect(collectionViewer: CollectionViewer): Observable<TableElement<MedicationRequest>[]> {
    return this._entry$.asObservable();
  }

  disconnect(collectionViewer: CollectionViewer): void {
    this._unsubscribeTrigger$.next();
    this._unsubscribeTrigger$.complete();
    this._entry$.complete();
    this._loading$.complete();
  }

  loadPage(medicationRequestFilter?: string, sortActive?: string, sortDirection?: string,
           pageIndex?: number, pageSize?: number): void {
    this._loading$.next(true);
    from(
      this._cioDcSource.searchMedicationKnowledgeUCD(
        medicationRequestFilter,
        sortActive,
        sortDirection,
        pageIndex,
        pageSize
      )
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
      .subscribe((bundle: Bundle) => {
        this._length = bundle.total;
        const offset = (pageIndex && pageSize) ? pageIndex * pageSize : 0;
        const tableElements = new Array<TableElement<MedicationRequest>>();
        bundle.entry.forEach((value, index) => {
          const element = {
            position: index + offset + 1,
            resource: value.resource as MedicationRequest
          } as TableElement<MedicationRequest>;
          tableElements.push(element);
        });
        console.log(tableElements);
        this._entry$.next(tableElements);
      });
  }
}
