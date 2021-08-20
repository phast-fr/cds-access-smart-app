import {Injectable} from '@angular/core';

import { ILabelProvider } from '../../cds-access/models/core.model';
import { FhirTypeGuard } from '../utils/fhir.type.guard';

import {
  NamedResourceLabelProvider,
  CodingLabelProvider,
  MedicationKnowledgeLabelProvider,
  MedicationRequestLabelProvider,
  QuantityLabelProvider,
  RatioLabelProvider,
  MedicationLabelProvider,
  CodeableConceptLabelProvider,
  ReferenceLabelProvider,
  CompositionLabelProvider,
  ParametersParameterLabelProvider,
  ValueSetContainsLabelProvider
} from './fhir.label.provider';

@Injectable({
  providedIn: 'root'
})
export class FhirLabelProviderFactory {

  private readonly _labelProviders: object;

  constructor() {
    this._labelProviders = {};
  }

  getProvider(object: any): ILabelProvider<any> | null {
    if (object == null) { return null; }
    if (FhirTypeGuard.isMedicationRequest(object)) {
      if (this._labelProviders.hasOwnProperty('fhir.MedicationRequest')) {
        return this._labelProviders['fhir.MedicationRequest'];
      }
      const provider = new MedicationRequestLabelProvider();
      this._labelProviders['fhir.MedicationRequest'] = provider;
      return provider;
    }
    else if (FhirTypeGuard.isMedicationKnowledge(object)) {
      if (this._labelProviders.hasOwnProperty('fhir.MedicationKnowledge')) {
        return this._labelProviders['fhir.MedicationKnowledge'];
      }
      const provider = new MedicationKnowledgeLabelProvider();
      this._labelProviders['fhir.MedicationKnowledge'] = provider;
      return provider;
    }
    else if (FhirTypeGuard.isMedication(object)) {
      if (this._labelProviders.hasOwnProperty('fhir.Medication')) {
        return this._labelProviders['fhir.Medication'];
      }
      const provider = new MedicationLabelProvider();
      this._labelProviders['fhir.Medication'] = provider;
      return provider;
    }
    else if (FhirTypeGuard.isPatient(object)) {
      if (this._labelProviders.hasOwnProperty('fhir.Patient')) {
        return this._labelProviders['fhir.Patient'];
      }
      const provider = new NamedResourceLabelProvider();
      this._labelProviders['fhir.Patient'] = provider;
      return provider;
    }
    else if (FhirTypeGuard.isPractitioner(object)) {
      if (this._labelProviders.hasOwnProperty('fhir.Practitioner')) {
        return this._labelProviders['fhir.Practitioner'];
      }
      const provider = new NamedResourceLabelProvider();
      this._labelProviders['fhir.Practitioner'] = provider;
      return provider;
    }
    else if (FhirTypeGuard.isComposition(object)) {
      if (this._labelProviders.hasOwnProperty('fhir.Composition')) {
        return this._labelProviders['fhir.Composition'];
      }
      const provider = new CompositionLabelProvider();
      this._labelProviders['fhir.Composition'] = provider;
      return provider;
    }
    else if (object === 'fhir.Ratio') {
      if (this._labelProviders.hasOwnProperty(object)) {
        return this._labelProviders[object];
      }
      const provider = new RatioLabelProvider();
      this._labelProviders[object] = provider;
      return provider;
    }
    else if (object === 'fhir.Quantity') {
      if (this._labelProviders.hasOwnProperty(object)) {
        return this._labelProviders[object];
      }
      const provider = new QuantityLabelProvider();
      this._labelProviders[object] = provider;
      return provider;
    }
    else if (object === 'fhir.CodeableConcept') {
      if (this._labelProviders.hasOwnProperty(object)) {
        return this._labelProviders[object];
      }
      const provider = new CodeableConceptLabelProvider();
      this._labelProviders[object] = provider;
      return provider;
    }
    else if (object === 'fhir.Coding') {
      if (this._labelProviders.hasOwnProperty(object)) {
        return this._labelProviders[object];
      }
      const provider = new CodingLabelProvider();
      this._labelProviders[object] = provider;
      return provider;
    }
    else if (object === 'fhir.Reference') {
      if (this._labelProviders.hasOwnProperty(object)) {
        return this._labelProviders[object];
      }
      const provider = new ReferenceLabelProvider();
      this._labelProviders[object] = provider;
      return provider;
    }
    else if (object === 'fhir.ParametersParameter') {
      if (this._labelProviders.hasOwnProperty(object)) {
        return this._labelProviders[object];
      }
      const provider = new ParametersParameterLabelProvider();
      this._labelProviders[object] = provider;
      return provider;
    }
    else if (object === 'fhir.ValueSetContains') {
      if (this._labelProviders.hasOwnProperty(object)) {
        return this._labelProviders[object];
      }
      const provider = new ValueSetContainsLabelProvider();
      this._labelProviders[object] = provider;
      return provider;
    }
    console.log('Error: provider not supported! ', object);
    return null;
  }
}
