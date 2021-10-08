/**
 * @license
 * Copyright PHAST SARL All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://cds-access.phast.fr/license
 */
import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FlexLayoutModule} from '@angular/flex-layout';
import {MatIconModule} from '@angular/material/icon';
import {MatCardModule} from '@angular/material/card';
import {MatTooltipModule} from '@angular/material/tooltip';

import {FhirModule} from '../fhir/fhir.module';

import {StateService} from './services/state.service';
import {PhastCioDcService} from './services/phast.cio.dc.service';
import {PhastCioCdsService} from './services/phast.cio.cds.service';
import {PhastTioService} from './services/phast.tio.service';

import {HeaderComponent} from './components/header/header.component';
import {FooterComponent} from './components/footer/footer.component';

import {AgePipe} from './pipes/age.pipe';
import {MyI18nSelectPipe} from './pipes/i18n.pipe';
import {PhastCQLService} from './services/phast.cql.service';

/**
 * @description
 *
 * Exports all the basic cds-access
 */
@NgModule({
  declarations: [
      HeaderComponent,
      FooterComponent,
      AgePipe,
      MyI18nSelectPipe
  ],
  imports: [
      CommonModule,
      FlexLayoutModule,
      MatIconModule,
      MatCardModule,
      MatTooltipModule,
      FhirModule
  ],
  exports: [
      HeaderComponent,
      FooterComponent,
      AgePipe
  ],
  providers: [
      StateService,
      PhastCioDcService,
      PhastTioService,
      PhastCioCdsService,
      PhastCQLService
  ]
})
export class CdsAccessModule { }
