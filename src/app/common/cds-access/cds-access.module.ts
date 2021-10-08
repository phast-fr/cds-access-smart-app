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
