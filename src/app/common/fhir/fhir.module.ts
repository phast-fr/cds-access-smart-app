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
