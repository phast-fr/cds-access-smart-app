import {Pipe, PipeTransform} from '@angular/core';

import {FhirLabelProviderFactory} from '../providers/fhir.label.provider.factory';
import {MedicationLabelProvider} from '../providers/fhir.label.provider';
import {
  CodeableConcept,
  Coding,
  Composition,
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

  constructor(private _labelProviderFactory: FhirLabelProviderFactory) {
  }

  public transform(person: Patient | Practitioner): string | undefined {
    return this._labelProviderFactory.getProvider(person)?.getText(person);
  }
}

@Pipe({
  name: 'medicationRequest'
})
export class MedicationRequestPipe implements PipeTransform {

  constructor(private _labelProviderFactory: FhirLabelProviderFactory) {
  }

  public transform(medicationRequest: MedicationRequest): string | undefined {
    return this._labelProviderFactory.getProvider(medicationRequest)?.getText(medicationRequest);
  }
}

@Pipe({
  name: 'medicationKnowledge'
})
export class MedicationKnowledgePipe implements PipeTransform {

  constructor(private _labelProviderFactory: FhirLabelProviderFactory) {
  }

  public transform(medicationKnowledge: MedicationKnowledge): string | undefined {
    return this._labelProviderFactory.getProvider(medicationKnowledge)?.getText(medicationKnowledge);
  }
}

@Pipe({
  name: 'medication'
})
export class MedicationPipe implements PipeTransform {

  constructor(private _labelProviderFactory: FhirLabelProviderFactory) {
  }

  public transform(medication: Medication): string | undefined {
    return this._labelProviderFactory.getProvider(medication)?.getText(medication);
  }
}

@Pipe({
  name: 'composition'
})
export class CompositionPipe implements PipeTransform {

  constructor(private _labelProviderFactory: FhirLabelProviderFactory) {
  }

  public transform(composition: Composition): string | undefined {
    return this._labelProviderFactory.getProvider(composition)?.getText(composition);
  }
}

@Pipe({
  name: 'snomed'
})
export class SnomedPipe implements PipeTransform {

  constructor(private _labelProviderFactory: FhirLabelProviderFactory) {
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

  constructor(private _labelProviderFactory: FhirLabelProviderFactory) {
  }

  public transform(codeableConcept: CodeableConcept): string | undefined {
    return this._labelProviderFactory.getProvider('fhir.CodeableConcept')?.getText(codeableConcept);
  }
}

@Pipe({
  name: 'quantity'
})
export class QuantityPipe implements PipeTransform {

  constructor(private _labelProviderFactory: FhirLabelProviderFactory) {
  }

  public transform(quantity: Quantity): string | undefined {
    return this._labelProviderFactory.getProvider('fhir.Quantity')?.getText(quantity);
  }
}

@Pipe({
  name: 'ratio'
})
export class RatioPipe implements PipeTransform {

  constructor(private _labelProviderFactory: FhirLabelProviderFactory) {
  }

  public transform(ratio: Ratio): string | undefined {
    return this._labelProviderFactory.getProvider('fhir.Ratio')?.getText(ratio);
  }
}

@Pipe({
  name: 'reference'
})
export class ReferencePipe implements PipeTransform {

  constructor(private _labelProviderFactory: FhirLabelProviderFactory) {
  }

  public transform(reference: Reference): string | undefined {
    return this._labelProviderFactory.getProvider('fhir.Reference')?.getText(reference);
  }
}

@Pipe({
  name: 'coding'
})
export class CodingPipe implements PipeTransform {

  constructor(private _labelProviderFactory: FhirLabelProviderFactory) {
  }

  public transform(coding: Coding): string | undefined {
    return this._labelProviderFactory.getProvider('fhir.Coding')?.getText(coding);
  }
}

@Pipe({
  name: 'valueSetContains'
})
export class ValueSetContainsPipe implements PipeTransform {

  constructor(private _labelProviderFactory: FhirLabelProviderFactory) {
  }

  public transform(valueSetContains: ValueSetContains): string | undefined {
    return this._labelProviderFactory.getProvider('fhir.ValueSetContains')?.getText(valueSetContains);
  }
}
