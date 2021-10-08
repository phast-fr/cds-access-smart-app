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
