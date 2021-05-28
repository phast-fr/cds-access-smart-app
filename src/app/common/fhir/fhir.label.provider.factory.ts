import { ILabelProvider } from '../models/core.model';
import { FhirTypeGuard } from './fhir.type.guard';

import {
  NamedResourceLabelProvider,
  CodingLabelProvider,
  MedicationKnowledgeLabelProvider,
  MedicationRequestLabelProvider,
  QuantityLabelProvider,
  RatioLabelProvider,
  MedicationLabelProvider,
  CodeableConceptLabelProvider, ReferenceLabelProvider
} from './fhir.label.provider';

export class FhirLabelProviderFactory {

  private _labelProviders = {};

  constructor() { }

  getProvider(object: any): ILabelProvider<any> | null {
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
    console.log('Error: provider not supported! ', object);
    return null;
  }
}