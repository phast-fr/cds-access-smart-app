import {
  Bundle,
  Composition,
  Library,
  Patient,
  Parameters,
  Practitioner,
  MedicationRequest,
  MedicationKnowledge,
  Medication
} from 'phast-fhir-ts';
import {ResourceType} from './fhir.resource.type';

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

  static isLibrary(x: unknown): x is Library {
      return (x as Library).resourceType !== undefined
          &&  (x as Library).resourceType === ResourceType.Library;
  }

  static isBundle(x: unknown): x is Bundle {
      return (x as Bundle).resourceType !== undefined
          &&  (x as Bundle).resourceType === ResourceType.Bundle;
  }

  static isParameters(x: unknown): x is Parameters {
      return (x as Parameters).resourceType !== undefined
          &&  (x as Parameters).resourceType === ResourceType.Parameters;
  }

  static isMedicationRequest(x: unknown): x is MedicationRequest {
    return (x as MedicationRequest).resourceType !== undefined
      &&  (x as MedicationRequest).resourceType === ResourceType.MedicationRequest;
  }

  static isMedicationKnowledge(x: unknown): x is MedicationKnowledge {
    return (x as MedicationKnowledge).resourceType !== undefined
      &&  (x as MedicationKnowledge).resourceType === ResourceType.MedicationKnowledge;
  }

  static isMedication(x: unknown): x is Medication {
    return (x as Medication).resourceType !== undefined
      &&  (x as Medication).resourceType === ResourceType.Medication;
  }
}
