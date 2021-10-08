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

  static isComposition(x: unknown | null): x is Composition {
    return x != null
        && (x as Composition).resourceType !== undefined
        && (x as Composition).resourceType === ResourceType.Composition;
  }

  static isPatient(x: unknown | null): x is Patient {
    return x != null
        && (x as Patient).resourceType !== undefined
        && (x as Patient).resourceType === ResourceType.Patient;
  }

  static isPractitioner(x: unknown | null): x is Practitioner {
    return x != null
        && (x as Practitioner).resourceType !== undefined
        && (x as Practitioner).resourceType === ResourceType.Practitioner;
  }

  static isLibrary(x: unknown | null): x is Library {
    return x != null
        && (x as Library).resourceType !== undefined
        && (x as Library).resourceType === ResourceType.Library;
  }

  static isBundle(x: unknown | null): x is Bundle {
    return x != null
        && (x as Bundle).resourceType !== undefined
        && (x as Bundle).resourceType === ResourceType.Bundle;
  }

  static isParameters(x: unknown | null): x is Parameters {
    return x != null
        && (x as Parameters).resourceType !== undefined
        && (x as Parameters).resourceType === ResourceType.Parameters;
  }

  static isMedicationRequest(x: unknown | null): x is MedicationRequest {
    return x != null
        && (x as MedicationRequest).resourceType !== undefined
        && (x as MedicationRequest).resourceType === ResourceType.MedicationRequest;
  }

  static isMedicationKnowledge(x: unknown | null): x is MedicationKnowledge {
    return x != null
        && (x as MedicationKnowledge).resourceType !== undefined
        && (x as MedicationKnowledge).resourceType === ResourceType.MedicationKnowledge;
  }

  static isMedication(x: unknown | null): x is Medication {
    return x != null
        && (x as Medication).resourceType !== undefined
        && (x as Medication).resourceType === ResourceType.Medication;
  }
}
