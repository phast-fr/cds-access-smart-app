import { fhir } from './fhir.types';
import { ILabelProvider } from '../models/core.model';
import Patient = fhir.Patient;
import Practitioner = fhir.Practitioner;
import MedicationKnowledge = fhir.MedicationKnowledge;
import MedicationRequest = fhir.MedicationRequest;
import Medication = fhir.Medication;
import Coding = fhir.Coding;
import Quantity = fhir.Quantity;
import Ratio = fhir.Ratio;
import CodeableConcept = fhir.CodeableConcept;
import Reference = fhir.Reference;
import Composition = fhir.Composition;

export class NamedResourceLabelProvider implements ILabelProvider<Patient | Practitioner> {

    constructor() {}

    getText(namedResource: Patient | Practitioner | null): string | null {
      if (namedResource == null) { return null; }
      const name = namedResource.name[0];
      if (name.text) {
        return name.text;
      }
      return name.given.join(' ') + ' ' + name.family;
    }
}

export class MedicationKnowledgeLabelProvider implements ILabelProvider<MedicationKnowledge> {

  constructor() {}

  getText(medicationKnowledge: MedicationKnowledge | null): string | null {
    if (medicationKnowledge == null) { return null; }
    if (medicationKnowledge.code != null) {
      const codeableConcept = medicationKnowledge.code;
      return codeableConcept.text;
    }
    return null;
  }
}

export class MedicationRequestLabelProvider implements ILabelProvider<MedicationRequest> {

  constructor() {}

  getText(medicationRequest: MedicationRequest | null): string | null {
    if (medicationRequest == null) { return null; }
    let labelComposed: string;
    if (medicationRequest.medicationReference != null) {
      const medicationId = medicationRequest.medicationReference.reference.substring(1);
      const medicationIndex = medicationRequest.contained.findIndex(
        (value) => value.id === medicationId);
      const medication = medicationRequest.contained[medicationIndex] as Medication;
      labelComposed = new MedicationLabelProvider().getText(medication);
    }
    if (medicationRequest.dosageInstruction.length > 0
      && medicationRequest.dosageInstruction[0].route != null) {
      labelComposed += ' ' + medicationRequest.dosageInstruction[0].route.text;
    }
    return labelComposed;
  }
}

export class MedicationLabelProvider implements ILabelProvider<Medication> {
  constructor() { }

  getText(medication: Medication): string | null {
    if (medication == null) { return null; }
    let labelComposed: string;
    let separator: string;
    const medicationComposed = new Array<string>();
    const strengthComposed = new Array<string>();
    for (const ingredient of medication.ingredient) {
      if (ingredient.itemCodeableConcept != null) {
        separator = '+';
        medicationComposed.push(ingredient.itemCodeableConcept.text);

        if (ingredient.strength != null) {
          // TODO optimize this
          strengthComposed.push(new RatioLabelProvider().getText(ingredient.strength));
        }
      }
      else if (ingredient.itemReference != null) {
        separator = ' & ';

        if (ingredient.strength != null) {
          // TODO optimize this
          strengthComposed.push(' ' + new RatioLabelProvider().getText(ingredient.strength));
        }
        else {
          strengthComposed.push('');
        }
      }
    }

    if ('+' === separator) {
      if (medicationComposed.length > 0) {
        labelComposed = medicationComposed.join(separator);
      }
      else {
        labelComposed = medication.code.text;
      }

      if (strengthComposed.length > 0) {
        labelComposed += ' ' + strengthComposed.join(separator);
      }
    }
    else if (' & ' === separator) {
      const bouxLabel = [];
      medicationComposed.push(...medication.code.text.split('&'));
      let i = 0;
      for (const medicationText of medicationComposed) {
        bouxLabel.push(medicationText + strengthComposed[i]);
        i++;
      }
      labelComposed = bouxLabel.join(separator);
    }

    if (medication.form != null) {
      labelComposed += ' ' + medication.form.text;
    }

    return labelComposed;
  }
}

export class CompositionLabelProvider implements ILabelProvider<Composition> {
  constructor() {
  }

  getText(composition: Composition): string | null {
    if (composition == null) { return null; }
    return composition.title;
  }
}

export class CodeableConceptLabelProvider implements ILabelProvider<CodeableConcept> {
  constructor() { }

  getText(codeableConcept: CodeableConcept): string | null {
    if (codeableConcept == null) { return null; }
    return codeableConcept.text;
  }
}

export class CodingLabelProvider implements ILabelProvider<Coding> {

  constructor() {}

  getText(coding: Coding | null): string | null {
    if (coding == null) { return null; }
    return coding.display;
  }
}

export class QuantityLabelProvider implements ILabelProvider<Quantity> {
  constructor() { }

  getText(quantity: Quantity | null): string | null {
    if (quantity == null) { return null; }
    if (quantity.value == null) { return null; }
    return quantity.value.toString();
  }
}

export class RatioLabelProvider implements ILabelProvider<Ratio> {
  constructor() { }

  getText(ratio: Ratio | null): string | null {
    if (ratio == null) { return null; }
    const labelComposite = new Array<string>();
    if (ratio.numerator != null) {
      if (ratio.numerator.value != null) {
        labelComposite.push(ratio.numerator.value.toString());
      }
      if (ratio.numerator.unit != null) {
        labelComposite.push(ratio.numerator.unit);
      }
    }
    return labelComposite.join(' ');
  }
}

export class ReferenceLabelProvider implements ILabelProvider<Reference> {
  constructor() { }

  getText(reference: Reference | null): string | null {
    if (reference == null) { return null; }
    if (reference.display != null) {
      return reference.display;
    }
    return reference.reference;
  }
}
