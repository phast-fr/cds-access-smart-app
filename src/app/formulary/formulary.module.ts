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
import { ReactiveFormsModule } from '@angular/forms';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatSelectModule } from '@angular/material/select';
import { MatBadgeModule } from '@angular/material/badge';
import { MatSidenavModule } from '@angular/material/sidenav';
import { FlexLayoutModule } from '@angular/flex-layout';

import { FormularyRoutingModule } from './formulary-routing.module';
import {FhirModule} from '../common/fhir/fhir.module';

import { FormularyStateService } from './formulary-state.service';

import { FormularyComponent } from './formulary.component';
import { FormularyTableComponent } from './formulary-table/formulary-table.component';
import {CdsAccessModule} from '../common/cds-access/cds-access.module';

@NgModule({
  declarations: [
    FormularyComponent,
    FormularyTableComponent
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
    FormularyRoutingModule,
    CdsAccessModule,
    FhirModule
  ],
  providers: [
    FormularyStateService
  ],
  bootstrap: [FormularyComponent]
})
export class FormularyModule { }
