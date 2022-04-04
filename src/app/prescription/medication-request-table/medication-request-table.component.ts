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
import {BehaviorSubject, Observable} from 'rxjs';
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
import {Bundle, MedicationRequest} from 'phast-fhir-ts';
import {FhirTypeGuard} from '../../common/fhir/utils/fhir.type.guard';

@Component({
  selector: 'app-medication-request-table',
  templateUrl: './medication-request-table.component.html',
  styleUrls: ['./medication-request-table.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MedicationRequestTableComponent implements OnInit, AfterViewInit {

  private readonly _bundleDataSource: MatTableDataSource<TableElement<Bundle>>;

  private readonly _selection: SelectionModel<TableElement<Bundle>>;

  private readonly _displayedColumns: Array<string>;

  private readonly _saving$: BehaviorSubject<boolean>;

  @ViewChild(MatPaginator)
  paginator?: MatPaginator;

  @ViewChild(MatSort)
  sort?: MatSort;

  constructor(
      private _labelProviderFactory: FhirLabelProviderFactory,
      private _prescriptionState: PrescriptionStateService,
      private _dataSource: FhirDataSourceService
  ) {
    this._bundleDataSource = new MatTableDataSource<TableElement<Bundle>>([]);
    this._selection = new SelectionModel<TableElement<Bundle>>(true, []);
    this._displayedColumns = ['select', 'position', 'name'];
    this._saving$ = new BehaviorSubject<boolean>(false);
  }

  public get bundleDataSource(): MatTableDataSource<TableElement<Bundle>> {
    return this._bundleDataSource;
  }

  public get displayedColumns(): Array<string> {
    return this._displayedColumns;
  }

  public get selection(): SelectionModel<TableElement<Bundle>> {
    return this._selection;
  }

  public get saving$(): Observable<boolean> {
    return this._saving$.asObservable();
  }

  public ngOnInit(): void {
    this._prescriptionState.bundle$
      .pipe(
        filter(bundle => bundle !== false),
        map(bundle => bundle as Bundle)
      )
      .subscribe({
        next: bundle => this.onAdd(bundle),
        error: err => console.error('error', err)
      });
  }

  public ngAfterViewInit(): void {
    this._bundleDataSource.sortingDataAccessor = (item: TableElement<Bundle>, property: string) => {
      switch (property) {
        case 'name':
          const text = this._labelProviderFactory.getProvider(item.resource)?.getText(item.resource);
          if (text) {
            return text;
          }
          return 0;
        default:
          return 0;
      }
    };
    if (this.sort) {
      this._bundleDataSource.sort = this.sort;
    }

    if (this.paginator) {
      this._bundleDataSource.paginator = this.paginator;
    }

    this._bundleDataSource.filterPredicate = (data: TableElement<Bundle>, filterValue: string) => {
      const text = this._labelProviderFactory.getProvider(data.resource)?.getText(data.resource);
      if (text) {
        return text.trim().toUpperCase().indexOf(filterValue.trim().toUpperCase()) >= 0;
      }
      return false;
    };
  }

  public onAdd(bundle: Bundle): void {
    this._bundleDataSource.data.push({
      position: this._bundleDataSource.data.length + 1,
      resource: bundle
    });
    this._bundleDataSource._updateChangeSubscription();
    if (this.sort) {
      this._bundleDataSource.sort = this.sort;
    }

    if (this.paginator) {
      this._bundleDataSource.paginator = this.paginator;
    }
  }

  public onDelete(): void {
    const elements = this._bundleDataSource.data.slice();
    this._bundleDataSource.data.slice().forEach(value => {
      if (this._selection.isSelected(value)) {
        const indexToRemove = elements.findIndex(
          (elt) => {
            if (elt === value) {
              return true;
            }
          }
        );
        this._bundleDataSource.data.splice(indexToRemove, 1);
      }
    });
    this._bundleDataSource.data.forEach((value: TableElement<Bundle>, index: number) => {
      value.position = index + 1;
    });
    this._bundleDataSource._updateChangeSubscription();

    if (this.sort) {
      this._bundleDataSource.sort = this.sort;
    }

    if (this.paginator) {
      this._bundleDataSource.paginator = this.paginator;
    }
    this._selection.clear();
  }

  public onSave(): void {
    this._saving$.next(true);
    this._bundleDataSource.data.slice().forEach(value => {
      this._dataSource.bundleSave(lodash.cloneDeep(value.resource))
          .subscribe({
            next: results => {
              results.forEach(result => {
                if (!result) {
                  console.error('error:', 'undefined value');
                }
                else if (FhirTypeGuard.isMedicationRequest(result)) {
                  console.log('result:', result);
                }
                else if (FhirTypeGuard.isOperationOutcome(result)) {
                  console.error('error:', result);
                }
              });

              this._bundleDataSource.data.length = 0;
              this._bundleDataSource._updateChangeSubscription();

              if (this.sort) {
                this._bundleDataSource.sort = this.sort;
              }

              if (this.paginator) {
                this._bundleDataSource.paginator = this.paginator;
              }
              this._selection.clear();
            },
            error: err => console.error('error:', err),
            complete: () => this._saving$.next(false)
          });
    });
  }

  public applyFilter(event: Event): void {
    this._bundleDataSource.filter = (event.target as HTMLInputElement).value.trim().toUpperCase();

    if (this._bundleDataSource.paginator) {
      this._bundleDataSource.paginator.firstPage();
    }
  }

  /** Whether the number of selected elements matches the total number of rows. */
  public isAllSelected(): boolean {
    const numSelected = this._selection.selected.length;
    const numRows = this._bundleDataSource.data.length;
    return numSelected === numRows;
  }

  /** Selects all rows if they are not all selected; otherwise clear selection. */
  public masterToggle(): void {
    this.isAllSelected() ?
      this._selection.clear() :
      this._bundleDataSource.data.forEach(row => this._selection.select(row));
  }

  /** The label for the checkbox on the passed row */
  public checkboxLabel(row?: TableElement<Bundle>): string {
    if (!row) {
      return `${this.isAllSelected() ? 'select' : 'deselect'} all`;
    }
    return `${this._selection.isSelected(row) ? 'deselect' : 'select'} row ${row.position + 1}`;
  }

  public toTableElement(element: object): TableElement<MedicationRequest> {
    return element as TableElement<MedicationRequest>;
  }
}
