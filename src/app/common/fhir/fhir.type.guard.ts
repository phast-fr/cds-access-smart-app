import { fhir } from './fhir.types';
import { ResourceType } from './fhir.resource.type';

export class FhirTypeGuard {

    static isPatient(x: unknown): x is fhir.Patient {
        return (x as fhir.Patient).resourceType !== undefined
            &&  (x as fhir.Patient).resourceType === ResourceType.Patient;
    }

    static isPractitioner(x: unknown): x is fhir.Practitioner {
      return (x as fhir.Practitioner).resourceType !== undefined
        &&  (x as fhir.Practitioner).resourceType === ResourceType.Practitioner;
    }

    static isLibrary(x: unknown): x is fhir.Library {
        return (x as fhir.Library).resourceType !== undefined
            &&  (x as fhir.Library).resourceType === ResourceType.Library;
    }

    static isBundle(x: unknown): x is fhir.Bundle {
        return (x as fhir.Bundle).resourceType !== undefined
            &&  (x as fhir.Bundle).resourceType === ResourceType.Bundle;
    }

    static isParameters(x: unknown): x is fhir.Parameters {
        return (x as fhir.Parameters).resourceType !== undefined
            &&  (x as fhir.Parameters).resourceType === ResourceType.Parameters;
    }

    static isMedicationRequest(x: unknown): x is fhir.MedicationRequest {
      return (x as fhir.MedicationRequest).resourceType !== undefined
        &&  (x as fhir.MedicationRequest).resourceType === ResourceType.MedicationRequest;
    }

  static isMedicationKnowledge(x: unknown): x is fhir.MedicationKnowledge {
    return (x as fhir.MedicationKnowledge).resourceType !== undefined
      &&  (x as fhir.MedicationKnowledge).resourceType === ResourceType.MedicationKnowledge;
  }

  static isMedication(x: unknown): x is fhir.Medication {
    return (x as fhir.Medication).resourceType !== undefined
      &&  (x as fhir.Medication).resourceType === ResourceType.Medication;
  }
}
