import {ILabelProvider, ITermLabelProvider} from '../../cds-access/models/core.model';
import {
  CodeableConcept,
  Coding,
  Composition,
  Medication,
  MedicationKnowledge,
  MedicationRequest, ParametersParameter,
  Patient,
  Practitioner, Quantity, Ratio, Reference, ValueSetContains
} from 'phast-fhir-ts';
import {FhirLabelProviderFactory} from './fhir.label.provider.factory';

export class NamedResourceLabelProvider implements ILabelProvider<Patient | Practitioner> {

  constructor() {}

  getText(namedResource: Patient | Practitioner): string | null {
    if (namedResource.name.length > 0) {
      const name = namedResource.name[0];
      if (name.text) {
        return name.text;
      }
      return name.given.join(' ') + ' ' + name.family;
    }
    return null;
  }
}

export class MedicationKnowledgeLabelProvider implements ILabelProvider<MedicationKnowledge> {

  constructor() {}

  getText(medicationKnowledge: MedicationKnowledge | null): string | null {
    if (medicationKnowledge.code != null) {
      const codeableConcept = medicationKnowledge.code;
      return codeableConcept.text;
    }
    return null;
  }
}

export class MedicationRequestLabelProvider implements ILabelProvider<MedicationRequest> {

  constructor(private _factory: FhirLabelProviderFactory) {
  }

  getText(medicationRequest: MedicationRequest): string | null {
    let labelComposed: string;
    if (medicationRequest.medicationReference != null) {
      const medicationId = medicationRequest.medicationReference.reference.substring(1);
      const medicationIndex = medicationRequest.contained.findIndex(
        (value) => value.id === medicationId);
      const medication = medicationRequest.contained[medicationIndex] as Medication;
      labelComposed = this._factory.getProvider(medication).getText(medication);
    }
    if (medicationRequest.dosageInstruction
      && medicationRequest.dosageInstruction.length > 0
      && medicationRequest.dosageInstruction[0].route != null) {
      labelComposed += ' ' + medicationRequest.dosageInstruction[0].route.text;
    }
    return labelComposed;
  }
}

export class MedicationLabelProvider implements ITermLabelProvider<Medication> {

  constructor(private _factory: FhirLabelProviderFactory) {
  }

  getText(medication: Medication): string | null {
    let labelComposed: string;
    let separator: string;
    const medicationComposed = new Array<string>();
    const strengthComposed = new Array<string>();
    for (const ingredient of medication.ingredient) {
      if (ingredient.itemCodeableConcept) {
        separator = '+';
        medicationComposed.push(ingredient.itemCodeableConcept.text);

        if (ingredient.strength) {
          strengthComposed.push(this._factory.getProvider('fhir.Ratio').getText(ingredient.strength));
        }
      }
      else if (ingredient.itemReference) {
        separator = ' & ';

        if (ingredient.strength) {
          strengthComposed.push(' ' + this._factory.getProvider('fhir.Ratio').getText(ingredient.strength));
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

  getTerm(medication: Medication, system: string): string | null{
    let labelComposed: string;
    labelComposed = this.getText(medication);
    if (medication.code != null){
      const x = medication.code.coding.find(e => e.system === system);
      if (x != null){
        labelComposed += ' (' + x.code + ' - ' + x.display + ')';
      }
    }
    return labelComposed;
  }
}

export class CompositionLabelProvider implements ILabelProvider<Composition> {

  constructor() {}

  getText(composition: Composition): string | null {
    return composition.title;
  }
}

export class CodeableConceptLabelProvider implements ILabelProvider<CodeableConcept> {

  constructor() {}

  getText(codeableConcept: CodeableConcept): string | null {
    if (!codeableConcept) { return null; }
    return codeableConcept.text;
  }
}

export class CodingLabelProvider implements ILabelProvider<Coding> {

  constructor() {}

  getText(coding: Coding): string | null {
    if (!coding) { return null; }
    return coding.display;
  }
}

export class QuantityLabelProvider implements ILabelProvider<Quantity> {

  constructor() {}

  getText(quantity: Quantity): string | null {
    if (!quantity) { return null; }
    if (quantity.value == null) { return null; }
    return quantity.value.toString();
  }
}

export class RatioLabelProvider implements ILabelProvider<Ratio> {

  constructor() {}

  getText(ratio: Ratio): string | null {
    if (!ratio) { return null; }
    const labelComposite = new Array<string>();
    if (ratio.numerator != null) {
      if (ratio.numerator.value != null) {
        labelComposite.push(ratio.numerator.value.toString());
      }
      if (ratio.numerator.unit != null) {
        labelComposite.push(ratio.numerator.unit);
      }
      if (ratio.denominator?.value != null
        && ratio.denominator?.value !== 1) {
        labelComposite.push('/');
        labelComposite.push(ratio.denominator?.value?.toString());
      }
      if (ratio.denominator?.unit != null
        && ratio.denominator?.unit !== '1') {
        labelComposite.push('/');
        labelComposite.push(ratio.denominator?.unit);
      }
    }
    return labelComposite.join(' ');
  }
}

export class ReferenceLabelProvider implements ILabelProvider<Reference> {

  constructor() {}

  getText(reference: Reference): string | null {
    if (!reference) { return null; }
    if (reference.display != null) {
      return reference.display;
    }
    return reference.reference;
  }
}

export class ParametersParameterLabelProvider implements ILabelProvider<ParametersParameter> {

  constructor() {}

  getText(parametersParameter: ParametersParameter): string | null {
    if (!parametersParameter) { return null; }
    const pp = parametersParameter.part.find((e => e.name === 'reference'));
    // console.log(pp);
    if (pp) {
      return pp.valueReference.display;
    }
    else {
      return null;
    }
  }
}

export class ValueSetContainsLabelProvider implements ILabelProvider<ValueSetContains> {

  constructor() {
  }

  public getText(valueSetContains: ValueSetContains): string | null {
    if (! valueSetContains) { return null; }
    return valueSetContains.display;
  }
}
