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

import {Pipe, PipeTransform} from '@angular/core';

import {FhirLabelProviderFactory} from '../providers/fhir.label.provider.factory';
import {MedicationLabelProvider} from '../providers/fhir.label.provider';
import {
  CodeableConcept,
  Coding,
  Composition, Library,
  Medication,
  MedicationKnowledge, MedicationRequest,
  Patient,
  Practitioner, Quantity,
  Ratio,
  Reference, ValueSetContains
} from 'phast-fhir-ts';

@Pipe({
  name: 'personName'
})
export class PersonNamePipe implements PipeTransform {

  constructor(
      private _labelProviderFactory: FhirLabelProviderFactory
  ) {
  }

  public transform(person: Patient | Practitioner): string | undefined {
    return this._labelProviderFactory.getProvider(person)?.getText(person);
  }
}

@Pipe({
  name: 'medicationRequest'
})
export class MedicationRequestPipe implements PipeTransform {

  constructor(
      private _labelProviderFactory: FhirLabelProviderFactory
  ) {
  }

  public transform(medicationRequest: MedicationRequest): string | undefined {
    return this._labelProviderFactory.getProvider(medicationRequest)?.getText(medicationRequest);
  }
}

@Pipe({
  name: 'medicationKnowledge'
})
export class MedicationKnowledgePipe implements PipeTransform {

  constructor(
      private _labelProviderFactory: FhirLabelProviderFactory
  ) {
  }

  public transform(medicationKnowledge: MedicationKnowledge): string | undefined {
    return this._labelProviderFactory.getProvider(medicationKnowledge)?.getText(medicationKnowledge);
  }
}

@Pipe({
  name: 'medication'
})
export class MedicationPipe implements PipeTransform {

  constructor(
      private _labelProviderFactory: FhirLabelProviderFactory
  ) {
  }

  public transform(medication: Medication): string | undefined {
    return this._labelProviderFactory.getProvider(medication)?.getText(medication);
  }
}

@Pipe({
  name: 'composition'
})
export class CompositionPipe implements PipeTransform {

  constructor(
      private _labelProviderFactory: FhirLabelProviderFactory
  ) {
  }

  public transform(composition: Composition): string | undefined {
    return this._labelProviderFactory.getProvider(composition)?.getText(composition);
  }
}

@Pipe({
  name: 'snomed'
})
export class SnomedPipe implements PipeTransform {

  constructor(
      private _labelProviderFactory: FhirLabelProviderFactory
  ) {
  }

  public transform(medication: Medication): string | undefined {
    const medicationLabelProvider = this._labelProviderFactory.getProvider(medication) as MedicationLabelProvider;
    return medicationLabelProvider.getTerm(medication, 'http://snomed.info/sct');
  }
}

@Pipe({
  name: 'codeableConcept'
})
export class CodeableConceptPipe implements PipeTransform {

  constructor(
      private _labelProviderFactory: FhirLabelProviderFactory
  ) {
  }

  public transform(codeableConcept: CodeableConcept): string | undefined {
    return this._labelProviderFactory.getProvider('fhir.CodeableConcept')?.getText(codeableConcept);
  }
}

@Pipe({
  name: 'quantity'
})
export class QuantityPipe implements PipeTransform {

  constructor(
      private _labelProviderFactory: FhirLabelProviderFactory
  ) {
  }

  public transform(quantity: Quantity): string | undefined {
    return this._labelProviderFactory.getProvider('fhir.Quantity')?.getText(quantity);
  }
}

@Pipe({
  name: 'ratio'
})
export class RatioPipe implements PipeTransform {

  constructor(
      private _labelProviderFactory: FhirLabelProviderFactory
  ) {
  }

  public transform(ratio: Ratio): string | undefined {
    return this._labelProviderFactory.getProvider('fhir.Ratio')?.getText(ratio);
  }
}

@Pipe({
  name: 'reference'
})
export class ReferencePipe implements PipeTransform {

  constructor(
      private _labelProviderFactory: FhirLabelProviderFactory
  ) {
  }

  public transform(reference: Reference): string | undefined {
    return this._labelProviderFactory.getProvider('fhir.Reference')?.getText(reference);
  }
}

@Pipe({
  name: 'coding'
})
export class CodingPipe implements PipeTransform {

  constructor(
      private _labelProviderFactory: FhirLabelProviderFactory
  ) {
  }

  public transform(coding: Coding): string | undefined {
    return this._labelProviderFactory.getProvider('fhir.Coding')?.getText(coding);
  }
}

@Pipe({
  name: 'valueSetContains'
})
export class ValueSetContainsPipe implements PipeTransform {

  constructor(
      private _labelProviderFactory: FhirLabelProviderFactory
  ) {
  }

  public transform(valueSetContains: ValueSetContains): string | undefined {
    return this._labelProviderFactory.getProvider('fhir.ValueSetContains')?.getText(valueSetContains);
  }
}

@Pipe({
  name: 'library'
})
export class LibraryPipe implements PipeTransform {

  constructor(
      private _labelProviderFactory: FhirLabelProviderFactory
  ) {
  }

  public transform(library: Library): string | undefined {
    return this._labelProviderFactory.getProvider(library)?.getText(library);
  }
}
