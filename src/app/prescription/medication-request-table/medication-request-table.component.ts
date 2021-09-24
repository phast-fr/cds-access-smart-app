import {AfterViewInit, ChangeDetectionStrategy, Component, OnInit, ViewChild} from '@angular/core';
import {BehaviorSubject, forkJoin, Observable} from 'rxjs';
import {filter, map} from 'rxjs/operators';
import {SelectionModel} from '@angular/cdk/collections';
import {MatTableDataSource} from '@angular/material/table';
import {MatPaginator} from '@angular/material/paginator';
import {MatSort} from '@angular/material/sort';

import * as lodash from 'lodash';

import {PrescriptionStateService} from '../prescription-state.service';
import {TableElement} from '../../common/cds-access/models/core.model';
import {FhirLabelProviderFactory} from '../../common/fhir/providers/fhir.label.provider.factory';
import {FhirDataSourceService} from '../../common/fhir/services/fhir.data-source.service';
import {MedicationRequest, OperationOutcome, Resource} from 'phast-fhir-ts';

@Component({
  selector: 'app-medication-request-table',
  templateUrl: './medication-request-table.component.html',
  styleUrls: ['./medication-request-table.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MedicationRequestTableComponent implements OnInit, AfterViewInit {

  private readonly _medicationRequestDataSource: MatTableDataSource<TableElement<MedicationRequest>>;

  private readonly _selection: SelectionModel<TableElement<MedicationRequest>>;

  private readonly _displayedColumns: Array<string>;

  private readonly _saving$: BehaviorSubject<boolean>;

  @ViewChild(MatPaginator)
  paginator?: MatPaginator;

  @ViewChild(MatSort)
  sort?: MatSort;

  constructor(private _labelProviderFactory: FhirLabelProviderFactory,
              private _prescriptionState: PrescriptionStateService,
              private _dataSource: FhirDataSourceService) {
    this._medicationRequestDataSource = new MatTableDataSource<TableElement<MedicationRequest>>([]);
    this._selection = new SelectionModel<TableElement<MedicationRequest>>(true, []);
    this._displayedColumns = ['select', 'position', 'name'];
    this._saving$ = new BehaviorSubject<boolean>(false);
  }

  public get medicationRequestDataSource(): MatTableDataSource<TableElement<MedicationRequest>> {
    return this._medicationRequestDataSource;
  }

  public get displayedColumns(): Array<string> {
    return this._displayedColumns;
  }

  public get selection(): SelectionModel<TableElement<MedicationRequest>> {
    return this._selection;
  }

  public get saving$(): Observable<boolean> {
    return this._saving$.asObservable();
  }

  public ngOnInit(): void {
    this._prescriptionState.medicationRequest$
      .pipe(
        filter(medicationRequest => medicationRequest !== false),
        map(medicationRequest => medicationRequest as MedicationRequest)
      )
      .subscribe({
        next: medicationRequest => this.onAddMedicationRequest(medicationRequest),
        error: err => console.error('error', err)
      });
  }

  public ngAfterViewInit(): void {
    this._medicationRequestDataSource.sortingDataAccessor = (item: TableElement<MedicationRequest>, property: string) => {
      switch (property) {
        case 'name':
          const provider = this._labelProviderFactory.getProvider(item.resource);
          if (provider) {
            return provider.getText(item.resource);
          }
          break;
        default:
          // @ts-ignore
          return item[property];
      }
    };
    if (this.sort) {
      this._medicationRequestDataSource.sort = this.sort;
    }

    if (this.paginator) {
      this._medicationRequestDataSource.paginator = this.paginator;
    }

    this._medicationRequestDataSource.filterPredicate = (data: TableElement<MedicationRequest>, filterValue: string) => {
      const provider = this._labelProviderFactory.getProvider(data.resource);
      if (provider) {
        const text = provider.getText(data.resource);
        if (text) {
          return text.trim().toUpperCase().indexOf(filterValue.trim().toUpperCase()) >= 0;
        }
      }
      return false;
    };
  }

  public onAddMedicationRequest(medicationRequest: MedicationRequest): void {
    this._medicationRequestDataSource.data.push({
      position: this._medicationRequestDataSource.data.length + 1,
      resource: medicationRequest
    });
    this._medicationRequestDataSource._updateChangeSubscription();
    if (this.sort) {
      this._medicationRequestDataSource.sort = this.sort;
    }

    if (this.paginator) {
      this._medicationRequestDataSource.paginator = this.paginator;
    }
  }

  public onDeleteMedicationRequest(): void {
    const elements = this._medicationRequestDataSource.data.slice();
    elements.forEach(value => {
      if (this._selection.isSelected(value)) {
        const indexToRemove = elements.findIndex(
          (elt) => {
            if (elt === value) {
              return true;
            }
          }
        );
        this._medicationRequestDataSource.data.splice(indexToRemove, 1);
      }
    });
    this._medicationRequestDataSource.data.forEach((value: TableElement<MedicationRequest>, index: number) => {
      value.position = index + 1;
    });
    this._medicationRequestDataSource._updateChangeSubscription();

    if (this.sort) {
      this._medicationRequestDataSource.sort = this.sort;
    }

    if (this.paginator) {
      this._medicationRequestDataSource.paginator = this.paginator;
    }
    this._selection.clear();
  }

  public onSave(): void {
    this._saving$.next(true);
    const observables = new Array<Observable<OperationOutcome | Resource>>();
    const elements = this._medicationRequestDataSource.data.slice();
    elements.forEach(value => {
      const resource = lodash.cloneDeep(value.resource);
      delete resource.medicationCodeableConcept;
      const authoredOn = new Date();
      resource.authoredOn = authoredOn.toISOString();
      const observable = this._dataSource.resourceSave(resource);
      if (observable) {
        observables.push(observable);
      }
    });
    forkJoin(observables)
      .subscribe({
        next: values => {
          console.log('saved', values);
          this._medicationRequestDataSource.data.length = 0;
          this._medicationRequestDataSource._updateChangeSubscription();

          if (this.sort) {
            this._medicationRequestDataSource.sort = this.sort;
          }

          if (this.paginator) {
            this._medicationRequestDataSource.paginator = this.paginator;
          }
          this._selection.clear();
        },
        error: err => console.error('error', err),
        complete: () => this._saving$.next(false)
      });
  }

  public applyFilter(event: Event): void {
    const filterValue = (event.target as HTMLInputElement).value;
    this._medicationRequestDataSource.filter = filterValue.trim().toUpperCase();

    if (this._medicationRequestDataSource.paginator) {
      this._medicationRequestDataSource.paginator.firstPage();
    }
  }

  /** Whether the number of selected elements matches the total number of rows. */
  public isAllSelected(): boolean {
    const numSelected = this._selection.selected.length;
    const numRows = this._medicationRequestDataSource.data.length;
    return numSelected === numRows;
  }

  /** Selects all rows if they are not all selected; otherwise clear selection. */
  public masterToggle(): void {
    this.isAllSelected() ?
      this._selection.clear() :
      this._medicationRequestDataSource.data.forEach(row => this._selection.select(row));
  }

  /** The label for the checkbox on the passed row */
  public checkboxLabel(row?: TableElement<MedicationRequest>): string {
    if (!row) {
      return `${this.isAllSelected() ? 'select' : 'deselect'} all`;
    }
    return `${this._selection.isSelected(row) ? 'deselect' : 'select'} row ${row.position + 1}`;
  }

  public toTableElement(element: object): TableElement<MedicationRequest> {
    return element as TableElement<MedicationRequest>;
  }
}
