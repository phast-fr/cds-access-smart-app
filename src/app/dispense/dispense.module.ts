import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatCardModule } from '@angular/material/card';
import { MatListModule } from '@angular/material/list';
import { MatButtonModule } from '@angular/material/button';
import { MatTableModule } from '@angular/material/table';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatSortModule } from '@angular/material/sort';
import { MatMenuModule } from '@angular/material/menu';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatSelectModule } from '@angular/material/select';
import { MatBadgeModule } from '@angular/material/badge';
import { MatSidenavModule } from '@angular/material/sidenav';
import { FlexLayoutModule } from '@angular/flex-layout';

import { FhirDataSourceService } from '../common/services/fhir.data-source.service';
import { FhirCdsHooksService } from '../common/fhir/fhir.cdshooks.service';
import { FhirCioDcService } from '../common/services/fhir.cio.dc.service';
import { FhirTioService } from '../common/services/fhir.tio.service';
import { DispenseRoutingModule } from './dispense-routing.module';

import {DialogOverviewExampleDialogComponent, DispenseComponent} from './dispense.component';
import { DispenseTableComponent } from './dispense-table/dispense-table.component';
import {DispenseStateService} from './dispense-state.service';
import {FormularyTableComponent} from '../formulary/formulary-table/formulary-table.component';
import {DialogSelectedSpecialiteComponent} from './dispense-dialog/dialog-selected-specialite.component';
import {MatDialogModule} from '@angular/material/dialog';

@NgModule({
  declarations: [
    DispenseComponent,
    DispenseTableComponent,
    DialogSelectedSpecialiteComponent,
    DialogOverviewExampleDialogComponent
  ],
  imports: [
    CommonModule,
    FlexLayoutModule,
    MatProgressSpinnerModule,
    MatIconModule,
    MatInputModule,
    MatAutocompleteModule,
    MatTooltipModule,
    MatFormFieldModule,
    MatCardModule,
    MatListModule,
    MatButtonModule,
    MatTableModule,
    MatCheckboxModule,
    MatSortModule,
    MatMenuModule,
    ReactiveFormsModule,
    MatPaginatorModule,
    MatSelectModule,
    MatBadgeModule,
    MatSidenavModule,
    DispenseRoutingModule,
    MatDialogModule,
    FormsModule,
  ],
  providers: [
    FhirDataSourceService,
    FhirCioDcService,
    FhirTioService,
    FhirCdsHooksService,
    DispenseStateService
  ],
  bootstrap: [DispenseComponent]
})
export class DispenseModule { }
