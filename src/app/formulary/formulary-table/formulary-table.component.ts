import {ChangeDetectionStrategy, Component, ElementRef, OnDestroy, OnInit, ViewChild} from '@angular/core';
import {BehaviorSubject, fromEvent, merge, Observable, Subject} from 'rxjs';
import {debounceTime, distinctUntilChanged, filter, map, switchMap, takeUntil, tap} from 'rxjs/operators';

import {MatPaginator} from '@angular/material/paginator';
import {MatSort} from '@angular/material/sort';
import {CollectionViewer, DataSource, SelectionModel} from '@angular/cdk/collections';

import {environment} from '../../../environments/environment';

import {TableElement} from '../../common/cds-access/models/core.model';
import {FormularyStateService} from '../formulary-state.service';
import {FhirDataSourceService} from '../../common/fhir/services/fhir.data-source.service';
import {PhastCioDcService} from '../../common/cds-access/services/phast.cio.dc.service';
import {FhirTypeGuard} from '../../common/fhir/utils/fhir.type.guard';
import {ReferenceBuilder} from '../../common/fhir/builders/fhir.resource.builder';
import {ReferenceParser} from '../../common/fhir/parsers/fhir.resource.parser';
import {Bundle, Composition, id, MedicationKnowledge, Reference} from 'phast-fhir-ts';

@Component({
  selector: 'app-formulary-table',
  templateUrl: './formulary-table.component.html',
  styleUrls: ['./formulary-table.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class FormularyTableComponent implements OnInit, OnDestroy  {

  private readonly _selection: SelectionModel<id>;

  private readonly _displayedColumns: Array<string>;

  private _composition: Composition;

  private readonly _unsubscribeTrigger$: Subject<void>;

  private readonly _tableDataSource: MedicationKnowledgeDataSource;

  @ViewChild(MatPaginator)
  paginator: MatPaginator;

  @ViewChild(MatSort)
  sort: MatSort;

  @ViewChild('inputFilter')
  inputFilter: ElementRef;

  constructor(private _formularyState: FormularyStateService,
              private _dataSource: FhirDataSourceService,
              private _cioDcSource: PhastCioDcService) {
    this._unsubscribeTrigger$ = new Subject<void>();
    this._tableDataSource = new MedicationKnowledgeDataSource(this._cioDcSource);
    this._selection = new SelectionModel<id>(true);
    this._displayedColumns = ['select', 'position', 'code:text'];
  }

  public get tableDataSource(): MedicationKnowledgeDataSource {
    return this._tableDataSource;
  }

  public get selection(): SelectionModel<id> {
    return this._selection;
  }

  public get displayedColumns(): Array<string> {
    return this._displayedColumns;
  }

  public get composition(): Composition {
    return this._composition;
  }

  public ngOnInit(): void {
    this._formularyState.composition$
      .subscribe({
        next: composition => {
          this._composition = composition;

          const values = new Set<id>();
          const parser = new ReferenceParser();
          for (const reference of composition.section[0].entry) {
            parser.parse(reference.reference);
            values.add(parser.id);
          }
          this._selection.select(...Array.from(values));
          this._tableDataSource.loadPage();

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
            .subscribe({
              error: err => console.error('error', err)
            });

          this.sort.sortChange
            .pipe(
              takeUntil(this._unsubscribeTrigger$)
            )
            .subscribe({
              next: () => this.paginator.pageIndex = 0,
              error: err => console.error('error', err)
            });

          merge(this.sort.sortChange, this.paginator.page)
            .pipe(
              takeUntil(this._unsubscribeTrigger$),
              tap(() => this.loadPage())
            )
            .subscribe({
              error: err => console.error('error', err)
            });
        },
        error: err => console.error('error', err)
      });
  }

  public ngOnDestroy(): void {
    this._unsubscribeTrigger$.next();
    this._unsubscribeTrigger$.complete();
  }

  public onSave(): void {
    const medicationKnowledgeReferences = new Array<Reference>();
    this._selection.selected.forEach(
      value => medicationKnowledgeReferences.push(
        new ReferenceBuilder(value)
        .baseUrl('http://phast.fr/fhir')
        .resourceType(environment.drug_formulary_resource_type)
        .build()
      )
    );
    this._cioDcSource.readCompositionMedicationKnowledge(this._composition.id)
      .pipe(
        map((composition: Composition) => {
          composition.section[0].entry = medicationKnowledgeReferences;
          return composition;
        }),
        switchMap((composition: Composition) => this._cioDcSource.putCompositionMedicationKnowledge(composition))
      )
      .subscribe({
        next: value => console.log(value),
        error: err => console.error(err)
      });
  }

  /** Whether the number of selected elements matches the total number of rows. */
  public isAllSelected(): boolean {
    const numSelected = this._selection.selected.length;
    const numRows = (this.paginator) ?
      this.paginator.pageIndex * this.paginator.pageSize + this.paginator.pageSize : this._tableDataSource.pageSize;
    return numSelected === numRows;
  }

  /** Selects all rows if they are not all selected; otherwise clear selection. */
  public masterToggle(): void {
    this.isAllSelected() ?
      this._selection.clear() : this._tableDataSource.content.forEach(
        row => this._selection.select(row?.resource.id)
      );
  }

  /** The label for the checkbox on the passed row */
  public checkboxLabel(row?: TableElement<MedicationKnowledge>): string {
    if (!row) {
      return `${this.isAllSelected() ? 'select' : 'deselect'} all`;
    }
    return `${this._selection.isSelected(row.resource.id) ? 'deselect' : 'select'} row ${row.position + 1}`;
  }

  private loadPage(): void {
    this._tableDataSource.loadPage(
      this.inputFilter.nativeElement.value,
      this.sort.active,
      this.sort.direction,
      this.paginator.pageIndex,
      this.paginator.pageSize
    );
  }
}

export class MedicationKnowledgeDataSource implements DataSource<TableElement<MedicationKnowledge>> {

  private _entry$ = new BehaviorSubject<TableElement<MedicationKnowledge>[]>([]);

  private _loading$ = new BehaviorSubject<boolean>(false);

  private _unsubscribeTrigger$ = new Subject<void>();

  private _length: number;

  constructor(private _cioDcSource: PhastCioDcService) {
  }

  public loading$ = this._loading$.asObservable();

  public get content(): TableElement<MedicationKnowledge>[] {
    return this._entry$.value;
  }

  public get length(): number {
    return this._length;
  }

  public get pageSize(): number {
    return PhastCioDcService.DEFAULT_PAGE_SIZE;
  }

  public connect(collectionViewer: CollectionViewer): Observable<TableElement<MedicationKnowledge>[]> {
    return this._entry$.asObservable();
  }

  public disconnect(collectionViewer: CollectionViewer): void {
    this._unsubscribeTrigger$.next();
    this._unsubscribeTrigger$.complete();
    this._entry$.complete();
    this._loading$.complete();
  }

  public loadPage(medicationKnowledgeFilter?: string, sortActive?: string, sortDirection?: string,
                  pageIndex?: number, pageSize?: number): void {
    this._loading$.next(true);
    this._cioDcSource.searchMedicationKnowledgeUCD(
        medicationKnowledgeFilter,
        sortActive,
        sortDirection,
        pageIndex,
        pageSize
    )
      .pipe(
        takeUntil(this._unsubscribeTrigger$),
        filter(bundle => FhirTypeGuard.isBundle(bundle)),
        map(bundle => bundle as Bundle)
      )
      .subscribe({
        next: bundle => {
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
          this._loading$.next(false);
        },
        error: err => console.error('error', err)
      });
  }
}
