import { Injectable } from '@angular/core';

import { SmartService } from '../../smart/services/smart.service';
import { fhir } from '../fhir/fhir.types';
import OperationOutcome = fhir.OperationOutcome;
import Patient = fhir.Patient;
import Practitioner = fhir.Practitioner;
import Bundle = fhir.Bundle;

@Injectable()
export class FhirDataSourceService {

    constructor(private smartService: SmartService) {}

    readPatient(id: string): Promise<OperationOutcome | Patient> {
      return this.smartService.getFhirClient().read({
        resourceType: 'Patient',
        id
      });
    }

    readPractitioner(id: string): Promise<OperationOutcome | Practitioner> {
      return this.smartService.getFhirClient().read({
        resourceType: 'Practitioner',
        id
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

  searchMedicationRequests(patient: Patient, name: string | undefined):
    Promise<fhir.OperationOutcome | Bundle & { type: 'searchset' }> {
    if (typeof name === 'string') {
      let search = name.trim();
      search = search.replace(/ /g, ',');
      return this.smartService.getFhirClient().resourceSearch({
        resourceType: 'MedicationRequest',
        searchParams: {
          _count: '10',
          subject: patient.id,
          'code:text': search
        }
      });
    }
    return this.smartService.getFhirClient().resourceSearch({
      resourceType: 'MedicationRequest',
      searchParams: {
        _count: '10',
        subject: patient.id
      }
    });
  }
}
