import { Injectable } from '@angular/core';

import { SmartService } from '../../smart/services/smart.service';
import { fhir } from '../fhir/fhir.types';
import OperationOutcome = fhir.OperationOutcome;
import Patient = fhir.Patient;
import Practitioner = fhir.Practitioner;
import Bundle = fhir.Bundle;
import Resource = fhir.Resource;
import id = fhir.id;
import Composition = fhir.Composition;

@Injectable()
export class FhirDataSourceService {

  constructor(private smartService: SmartService) {}

  readPatient(patientId: id): Promise<OperationOutcome | Patient> {
    return this.smartService.getFhirClient().read({
      resourceType: 'Patient',
      id: patientId
    });
  }

  readPractitioner(practitionerId: id): Promise<OperationOutcome | Practitioner> {
    return this.smartService.getFhirClient().read({
      resourceType: 'Practitioner',
      id: practitionerId
    });
  }

  readComposition(compositionId: id): Promise<OperationOutcome | Composition> {
    return this.smartService.getFhirClient().read({
      resourceType: 'Composition',
      id: compositionId
    });
  }

  searchResources(path: string): Promise<OperationOutcome | Bundle & { type: 'searchset' }> {
    const resourceTypeSearch = path.split('?');
    const resourceType = resourceTypeSearch[0];
    const search = resourceTypeSearch[1];

    const searchParams = {};
    for (const part of search.split('&')) {
      const keyValue = part.split('=');
      const key = keyValue[0];
      searchParams[key] = keyValue[1];
    }

    return this.smartService.getFhirClient().resourceSearch({
      resourceType,
      searchParams
    });
  }

  searchPatients(name: string | undefined): Promise<OperationOutcome | Bundle & { type: 'searchset' }> {
      if (typeof name === 'string') {
          let search = name.trim();
          search = search.replace(/ /g, ',');
          return this.smartService.getFhirClient().resourceSearch({
            resourceType: 'Patient',
            searchParams: {
              _count: '10',
              name: search
            }
          });
      }
      return this.smartService.getFhirClient().resourceSearch({
        resourceType: 'Patient',
        searchParams: {
          _count: '10'
        }
      });
  }

  searchMedicationRequests(patient: Patient, name?: string):
    Promise<OperationOutcome | Bundle & { type: 'searchset' }> {
    if (typeof name === 'string') {
      let search = name.trim();
      search = search.replace(/ /g, ',');
      return this.smartService.getFhirClient().resourceSearch({
        resourceType: 'MedicationRequest',
        searchParams: {
          subject: patient.id,
          'code:text': search
        }
      });
    }
    return this.smartService.getFhirClient().resourceSearch({
      resourceType: 'MedicationRequest',
      searchParams: {
        subject: patient.id
      }
    });
  }

  public saveResource(resource: Resource): Promise<OperationOutcome | Resource> {
      return this.smartService.getFhirClient().create({
        resourceType: resource.resourceType,
        body: resource
      });
  }
}
