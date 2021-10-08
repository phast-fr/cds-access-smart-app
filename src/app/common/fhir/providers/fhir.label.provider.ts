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

import {ILabelProvider, ITermLabelProvider} from '../../cds-access/models/core.model';
import {
  CodeableConcept,
  Coding,
  Composition, Library,
  Medication,
  MedicationKnowledge,
  MedicationRequest, ParametersParameter,
  Patient,
  Practitioner, Quantity, Ratio, Reference, ValueSetContains
} from 'phast-fhir-ts';
import {FhirLabelProviderFactory} from './fhir.label.provider.factory';

export class NamedResourceLabelProvider implements ILabelProvider<Patient | Practitioner> {

  constructor() {
  }

  getText(namedResource: Patient | Practitioner | undefined | null): string | undefined {
    if (namedResource?.name) {
      if (namedResource.name.length > 0) {
        const name = namedResource.name[0];
        if (name?.text) {
          return name.text;
        }
        if (name?.given) {
          return name.given.join(' ') + ' ' + name.family;
        }
      }
    }
    return undefined;
  }
}

export class MedicationKnowledgeLabelProvider implements ILabelProvider<MedicationKnowledge> {

  constructor() {
  }

  getText(medicationKnowledge: MedicationKnowledge | undefined | null): string | undefined {
    if (medicationKnowledge) {
      if (medicationKnowledge.code) {
        const codeableConcept = medicationKnowledge.code;
        return codeableConcept.text;
      }
    }
    return undefined;
  }
}

export class MedicationRequestLabelProvider implements ILabelProvider<MedicationRequest> {

  constructor(private _factory: FhirLabelProviderFactory) {
  }

  getText(medicationRequest: MedicationRequest | undefined | null): string | undefined {
    let labelComposed: string | undefined;
    if (medicationRequest?.medicationReference?.reference) {
      const medicationId = medicationRequest.medicationReference.reference.substring(1);
      if (medicationRequest.contained) {
        const medication = medicationRequest.contained.find(value => value.id === medicationId);
        const labelProvider = this._factory.getProvider(medication);
        if (labelProvider) {
          labelComposed = labelProvider.getText(medication);
        }
      }
    }
    if (medicationRequest?.dosageInstruction
      && medicationRequest?.dosageInstruction.length > 0
      && medicationRequest?.dosageInstruction[0].route != null) {
      labelComposed += ' ' + medicationRequest.dosageInstruction[0].route.text;
    }
    return labelComposed;
  }
}

export class MedicationLabelProvider implements ITermLabelProvider<Medication> {

  constructor(private _factory: FhirLabelProviderFactory) {
  }

  getText(medication: Medication | undefined | null): string | undefined {
    if (medication?.code?.text) {
      return medication.code.text;
    }
    return undefined;
    /*
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
    */
  }

  getTerm(medication: Medication | undefined | null, system: string): string | undefined {
    let labelComposed = this.getText(medication);
    if (medication?.code?.coding) {
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

  getText(composition: Composition | undefined | null): string | undefined {
    if (!composition) { return undefined; }
    return composition.title;
  }
}

export class CodeableConceptLabelProvider implements ILabelProvider<CodeableConcept> {

  constructor() {
  }

  getText(codeableConcept: CodeableConcept | undefined | null): string | undefined {
    if (!codeableConcept) { return undefined; }
    return codeableConcept.text;
  }
}

export class CodingLabelProvider implements ILabelProvider<Coding> {

  constructor() {
  }

  getText(coding: Coding | undefined | null): string | undefined {
    if (!coding) { return undefined; }
    return coding.display;
  }
}

export class QuantityLabelProvider implements ILabelProvider<Quantity> {

  constructor() {
  }

  getText(quantity: Quantity | undefined | null): string | undefined {
    if (!quantity) { return undefined; }
    return `${quantity.value?.toString()} ${quantity.unit}`;
  }
}

export class RatioLabelProvider implements ILabelProvider<Ratio> {

  constructor() {
  }

  getText(ratio: Ratio | undefined | null): string | undefined {
    if (!ratio) { return undefined; }
    const labelComposite = new Array<string>();
    if (ratio.numerator) {
      if (ratio.numerator.value) {
        labelComposite.push(ratio.numerator.value.toString());
      }
      if (ratio.numerator.unit) {
        labelComposite.push(ratio.numerator.unit);
      }
      if (ratio.denominator?.value
        && ratio.denominator?.value !== 1) {
        labelComposite.push('/');
        labelComposite.push(ratio.denominator?.value?.toString());
      }
      if (ratio.denominator?.unit
        && ratio.denominator?.unit !== '1') {
        labelComposite.push('/');
        labelComposite.push(ratio.denominator?.unit);
      }
    }
    return labelComposite.join(' ');
  }
}

export class ReferenceLabelProvider implements ILabelProvider<Reference> {

  constructor() {
  }

  getText(reference: Reference | undefined | null): string | undefined {
    if (!reference) { return undefined; }
    if (reference.display) {
      return reference.display;
    }
    return reference.reference;
  }
}

export class ParametersParameterLabelProvider implements ILabelProvider<ParametersParameter> {

  constructor() {
  }

  getText(parametersParameter: ParametersParameter | undefined | null): string | undefined {
    if (!parametersParameter?.part) { return undefined; }
    const pp = parametersParameter.part.find((e => e.name === 'reference'));
    // console.log(pp);
    if (pp?.valueReference) {
      return pp.valueReference.display;
    }
    return undefined;
  }
}

export class ValueSetContainsLabelProvider implements ILabelProvider<ValueSetContains> {

  constructor() {
  }

  public getText(valueSetContains: ValueSetContains | undefined | null): string | undefined {
    if (! valueSetContains) { return undefined; }
    let display: string | undefined;
    switch (valueSetContains.code) {
      case 'a':
        display = 'année';
        break;
      case '':
        break;
      case 'd':
        display = 'jour';
        break;
      default:
        display = valueSetContains.display;
        break;
    }
    return display;
  }
}

export class LibraryLabelProvider {

  constructor() {
  }

  public getText(library: Library | undefined | null): string | undefined {
    if (! library) { return undefined; }
    return library.title + ' v' + library.version;
  }
}
