import { fhir } from './fhir.types';
import { ResourceType } from './fhir.resource.type';
import Composition = fhir.Composition;
import Patient = fhir.Patient;
import Practitioner = fhir.Practitioner;

export class FhirTypeGuard {

  static isComposition(x: unknown): x is Composition {
    return (x as Composition).resourceType !== undefined
      &&  (x as Composition).resourceType === ResourceType.Composition;
  }

  static isPatient(x: unknown): x is Patient {
      return (x as Patient).resourceType !== undefined
          &&  (x as Patient).resourceType === ResourceType.Patient;
  }

  static isPractitioner(x: unknown): x is Practitioner {
    return (x as Practitioner).resourceType !== undefined
      &&  (x as Practitioner).resourceType === ResourceType.Practitioner;
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
