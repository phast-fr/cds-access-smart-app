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
  Bundle,
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

  public getText(namedResource: Patient | Practitioner | undefined | null): string | undefined {
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

  public getText(medicationKnowledge: MedicationKnowledge | undefined | null): string | undefined {
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

  constructor() {
  }

  public getText(medicationRequest: MedicationRequest | undefined | null): string | undefined {
    if (medicationRequest?.dosageInstruction
      && medicationRequest?.dosageInstruction.length > 0
      && medicationRequest?.dosageInstruction[0].route != null) {
      return medicationRequest.dosageInstruction[0].route.text;
    }
    return '';
  }
}

export class MedicationLabelProvider implements ITermLabelProvider<Medication> {

  constructor(
      private _factory: FhirLabelProviderFactory
  ) {
  }

  public getText(medication: Medication | undefined | null): string | undefined {
    if (medication?.code) {
      return this._factory.getProvider('fhir.CodeableConcept')?.getText(medication.code);
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

  public getTerm(medication: Medication | undefined | null, system: string): string | undefined {
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

  constructor() {
  }

  public getText(composition: Composition | undefined | null): string | undefined {
    if (!composition) { return undefined; }
    return composition.title;
  }
}

export class CodeableConceptLabelProvider implements ILabelProvider<CodeableConcept> {

  constructor() {
  }

  public getText(codeableConcept: CodeableConcept | undefined | null): string | undefined {
    if (!codeableConcept) { return undefined; }
    return codeableConcept.text;
  }
}

export class CodingLabelProvider implements ILabelProvider<Coding> {

  constructor() {
  }

  public getText(coding: Coding | undefined | null): string | undefined {
    if (!coding) { return undefined; }
    return coding.display;
  }
}

export class QuantityLabelProvider implements ILabelProvider<Quantity> {

  constructor() {
  }

  public getText(quantity: Quantity | undefined | null): string | undefined {
    if (!quantity) { return undefined; }
    return `${quantity.value?.toString()} ${quantity.unit}`;
  }
}

export class RatioLabelProvider implements ILabelProvider<Ratio> {

  constructor() {
  }

  public getText(ratio: Ratio | undefined | null): string | undefined {
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
        labelComposite.push(ratio.denominator?.unit);
      }
    }
    return labelComposite.join(' ');
  }
}

export class ReferenceLabelProvider implements ILabelProvider<Reference> {

  constructor() {
  }

  public getText(reference: Reference | undefined | null): string | undefined {
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

  public getText(parametersParameter: ParametersParameter | undefined | null): string | undefined {
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
    return valueSetContains.display;
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

export class BundleLabelProvider implements ILabelProvider<Bundle> {

  constructor(
      private _factory: FhirLabelProviderFactory
  ) {
  }

  public getText(bundle: Bundle | undefined | null): string | undefined {
    if (bundle?.entry
        && bundle?.entry?.length > 1) {
      const medication = bundle?.entry[1].resource as Medication;
      const medicationRequest = bundle?.entry[0].resource as MedicationRequest;
      return `${this._factory.getProvider(medication)?.getText(medication)} ${this._factory.getProvider(medicationRequest)?.getText(medicationRequest)}`;
    }
  }
}
