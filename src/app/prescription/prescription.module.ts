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
import {MatRadioModule} from '@angular/material/radio';
import {FlexLayoutModule} from '@angular/flex-layout';

import {FhirModule} from '../common/fhir/fhir.module';

import { PrescriptionRoutingModule } from './prescription-routing.module';

import { PrescriptionStateService } from './prescription-state.service';
import { MedicationRequestFormViewModel } from './medication-request-form/medication-request-form.view-model';

import { PrescriptionComponent } from './prescription.component';
import { CardListComponent } from './card-list/card-list.component';
import { MedicationRequestFormComponent } from './medication-request-form/medication-request-form.component';
import { MedicationFormComponent } from './medication-request-form/medication-form/medication-form.component';
import { DosageInstructionFormComponent } from './medication-request-form/dosage-instruction-form/dosage-instruction-form.component';
import { DispenseRequestFormComponent } from './medication-request-form/dispense-request-form/dispense-request-form.component';
import { MedicationRequestTableComponent } from './medication-request-table/medication-request-table.component';
import {CdsAccessModule} from '../common/cds-access/cds-access.module';
import {MetadataFormComponent} from './medication-request-form/metadata-form/metadata-form.component';

@NgModule({
  declarations: [
    PrescriptionComponent,
    MedicationRequestFormComponent,
    MetadataFormComponent,
    MedicationFormComponent,
    DosageInstructionFormComponent,
    DispenseRequestFormComponent,
    MedicationRequestTableComponent,
    CardListComponent
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
        CdsAccessModule,
        FhirModule,
        PrescriptionRoutingModule,
        MatRadioModule
    ],
  providers: [
    PrescriptionStateService,
    MedicationRequestFormViewModel
  ],
  bootstrap: [PrescriptionComponent]
})
export class PrescriptionModule { }
