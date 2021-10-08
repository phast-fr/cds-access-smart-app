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
import {MatToolbarModule} from '@angular/material/toolbar';
import {FlexLayoutModule} from '@angular/flex-layout';

import {FhirModule} from '../common/fhir/fhir.module';

import {CdsAccessModule} from '../common/cds-access/cds-access.module';

import {CqlEditorComponent} from './cql-editor.component';
import {CqlEditorRoutingModule} from './cql-editor-routing.module';
import {RunnerComponent} from './runner/runner.component';
import {CodeMirrorDirective} from './shared/code-mirror/code-mirror.directive';
import {MenuComponent} from './menu/menu.component';
import {MatDialogModule} from '@angular/material/dialog';
import {CqlEditorViewModel} from './cql-editor.view-model';

@NgModule({
    declarations: [
        CqlEditorComponent,
        RunnerComponent,
        CodeMirrorDirective,
        MenuComponent
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
        CqlEditorRoutingModule,
        MatRadioModule,
        MatToolbarModule,
        MatDialogModule
    ],
  providers: [
      CqlEditorViewModel,
  ],
  bootstrap: [CqlEditorComponent]
})
export class CqlEditorModule { }
