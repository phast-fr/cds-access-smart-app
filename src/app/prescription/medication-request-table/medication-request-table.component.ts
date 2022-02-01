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
import {FhirTypeGuard} from '../../common/fhir/utils/fhir.type.guard';

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
            const text = provider.getText(item.resource);
            if (text) {
              return text;
            }
          }
          return 0;
        default:
          return 0;
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
      const medicationRequest = lodash.cloneDeep(value.resource);
      if (medicationRequest.medicationCodeableConcept) {
        delete medicationRequest.medicationCodeableConcept;
      }
      const authoredOn = new Date();
      medicationRequest.authoredOn = authoredOn.toISOString();
      const observable = this._dataSource.medicationRequestSave(medicationRequest);
      if (observable) {
        observables.push(observable);
      }
    });
    forkJoin(observables)
      .subscribe({
        next: values => {
          values.forEach(value => {
            if (!value) {
              console.error('error', 'undefined value');
            }
            else if (FhirTypeGuard.isMedicationRequest(value)) {
              console.log('result', value);
            }
            else if (FhirTypeGuard.isOperationOutcome(value)) {
              console.error('error', value);
            }
          });

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
