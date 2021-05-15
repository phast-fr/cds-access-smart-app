import {AfterViewInit, Component, Input, OnInit, ViewChild} from '@angular/core';
import {fhir} from '../../common/fhir/fhir.types';
import {FhirLabelProviderFactory} from '../../common/fhir/fhir.label.provider.factory';
import {MatTableDataSource} from '@angular/material/table';
import {MatPaginator} from '@angular/material/paginator';
import {MatSort} from '@angular/material/sort';
import {SelectionModel} from '@angular/cdk/collections';
import {PrescriptionStateService} from '../prescription-state.service';
import MedicationRequest = fhir.MedicationRequest;
import {Elements} from '../prescription.model';

@Component({
  selector: 'app-medication-request-table',
  templateUrl: './medication-request-table.component.html',
  styleUrls: ['./medication-request-table.component.css']
})
export class MedicationRequestTableComponent implements OnInit, AfterViewInit {

  private _labelProviderFactory = new FhirLabelProviderFactory();

  @Input()
  expandedElement: Elements | null;
  @Input()
  medicationRequestDataSource = new MatTableDataSource<Elements>([]);
  @ViewChild(MatPaginator)
  paginator: MatPaginator;
  @ViewChild(MatSort)
  sort: MatSort;

  selection = new SelectionModel<Elements>(true, []);

  displayedColumns: Array<string> = ['select', 'position', 'name'];

  constructor(private prescriptionState: PrescriptionStateService) { }

  public get labelProviderFactory(): FhirLabelProviderFactory {
    return this._labelProviderFactory;
  }

  ngOnInit(): void {
    this.prescriptionState.medicationRequestSubject.subscribe(
      next => {
        this.onAddMedicationRequest(next);
      }
    );
  }

  ngAfterViewInit(): void {
    this.medicationRequestDataSource.sortingDataAccessor = (item: Elements, property: string) => {
      switch (property) {
        case 'name': return this._labelProviderFactory.getProvider(item.resource).getText(item.resource);
        default: return item[property];
      }
    };
    this.medicationRequestDataSource.sort = this.sort;
    this.medicationRequestDataSource.paginator = this.paginator;
    this.medicationRequestDataSource.filterPredicate = (data: Elements, filterValue: string) => {
      return this._labelProviderFactory.getProvider(data.resource).getText(data.resource)
        .trim()
        .toLocaleLowerCase().indexOf(filterValue.trim().toLocaleLowerCase()) >= 0;
    };
  }

  onAddMedicationRequest(medicationRequest: MedicationRequest): void {
    this.medicationRequestDataSource.data.push({
      position: this.medicationRequestDataSource.data.length + 1,
      resource: medicationRequest
    });
    this.medicationRequestDataSource._updateChangeSubscription();
    this.medicationRequestDataSource.sort = this.sort;
    this.medicationRequestDataSource.paginator = this.paginator;
  }

  onDeleteMedicationRequest(): void {
    const elements = this.medicationRequestDataSource.data.slice();
    elements.forEach(value => {
      if (this.selection.isSelected(value)) {
        const indexToRemove = elements.findIndex(
          (elt) => {
            if (elt === value) {
              return true;
            }
          }
        );
        this.medicationRequestDataSource.data.splice(indexToRemove, 1);
      }
    });
    this.medicationRequestDataSource.data.forEach((value: Elements, index: number) => {
      value.position = index + 1;
    });
    this.medicationRequestDataSource._updateChangeSubscription();
    this.medicationRequestDataSource.sort = this.sort;
    this.medicationRequestDataSource.paginator = this.paginator;
    this.selection.clear();
  }

  onSave(): void {
    console.log('TODO save !');
  }

  applyFilter(event: Event): void {
    const filterValue = (event.target as HTMLInputElement).value;
    this.medicationRequestDataSource.filter = filterValue.trim().toLowerCase();

    if (this.medicationRequestDataSource.paginator) {
      this.medicationRequestDataSource.paginator.firstPage();
    }
  }

  /** Whether the number of selected elements matches the total number of rows. */
  isAllSelected(): boolean {
    const numSelected = this.selection.selected.length;
    const numRows = this.medicationRequestDataSource.data.length;
    return numSelected === numRows;
  }

  /** Selects all rows if they are not all selected; otherwise clear selection. */
  masterToggle(): void {
    this.isAllSelected() ?
      this.selection.clear() :
      this.medicationRequestDataSource.data.forEach(row => this.selection.select(row));
  }

  /** The label for the checkbox on the passed row */
  checkboxLabel(row?: Elements): string {
    if (!row) {
      return `${this.isAllSelected() ? 'select' : 'deselect'} all`;
    }
    return `${this.selection.isSelected(row) ? 'deselect' : 'select'} row ${row.position + 1}`;
  }

}
