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
import {MatProgressSpinnerModule} from '@angular/material/progress-spinner';

import {FhirSmartService} from './smart/services/fhir.smart.service';
import {FhirDataSourceService} from './services/fhir.data-source.service';
import {FhirCdsHooksService} from './cds-hooks/services/fhir.cdshooks.service';

import {
  CodeableConceptPipe, CodingPipe,
  CompositionPipe, LibraryPipe,
  MedicationKnowledgePipe,
  MedicationPipe, MedicationRequestPipe,
  PersonNamePipe, QuantityPipe,
  RatioPipe, ReferencePipe,
  SnomedPipe, ValueSetContainsPipe
} from './pipes/fhir.pipe';

import {SmartLaunchComponent} from './smart/components/launch/smart.launch.component';
import {FhirClientService} from './services/fhir.client.service';

@NgModule({
  declarations: [
      SmartLaunchComponent,
      PersonNamePipe,
      MedicationRequestPipe,
      MedicationKnowledgePipe,
      MedicationPipe,
      CodeableConceptPipe,
      QuantityPipe,
      RatioPipe,
      ReferencePipe,
      CodingPipe,
      CompositionPipe,
      LibraryPipe,
      ValueSetContainsPipe,
      SnomedPipe
  ],
  imports: [
      MatProgressSpinnerModule
  ],
  exports: [
    SmartLaunchComponent,
    PersonNamePipe,
    MedicationRequestPipe,
    MedicationKnowledgePipe,
    MedicationPipe,
    CodeableConceptPipe,
    RatioPipe,
    ReferencePipe,
    CodingPipe,
    CompositionPipe,
    SnomedPipe,
    ValueSetContainsPipe,
    QuantityPipe,
    LibraryPipe
  ],
  providers: [
      FhirClientService,
      FhirSmartService,
      FhirDataSourceService,
      FhirCdsHooksService
  ]
})
export class FhirModule { }
