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
  ValueSetContainsLabelProvider, LibraryLabelProvider, BundleLabelProvider
} from './fhir.label.provider';
import {Bundle} from 'phast-fhir-ts';

@Injectable({
  providedIn: 'root'
})
export class FhirLabelProviderFactory {

  private readonly _labelProviders: Map<string, ILabelProvider<any>>;

  constructor() {
    this._labelProviders = new Map<string, ILabelProvider<any>>();
  }

  getProvider(object: any): ILabelProvider<any> | undefined {
    if (!object) { return undefined; }
    if (FhirTypeGuard.isMedicationRequest(object)) {
      if (this._labelProviders.has('fhir.MedicationRequest')) {
        return this._labelProviders.get('fhir.MedicationRequest');
      }
      const provider = new MedicationRequestLabelProvider() as ILabelProvider<any>;
      this._labelProviders.set('fhir.MedicationRequest', provider);
      return provider;
    }
    else if (FhirTypeGuard.isMedicationKnowledge(object)) {
      if (this._labelProviders.has('fhir.MedicationKnowledge')) {
        return this._labelProviders.get('fhir.MedicationKnowledge');
      }
      const provider = new MedicationKnowledgeLabelProvider() as ILabelProvider<any>;
      this._labelProviders.set('fhir.MedicationKnowledge', provider);
      return provider;
    }
    else if (FhirTypeGuard.isMedication(object)) {
      if (this._labelProviders.has('fhir.Medication')) {
        return this._labelProviders.get('fhir.Medication');
      }
      const provider = new MedicationLabelProvider(this) as ILabelProvider<any>;
      this._labelProviders.set('fhir.Medication', provider);
      return provider;
    }
    else if (FhirTypeGuard.isPatient(object)) {
      if (this._labelProviders.has('fhir.Patient')) {
        return this._labelProviders.get('fhir.Patient');
      }
      const provider = new NamedResourceLabelProvider() as ILabelProvider<any>;
      this._labelProviders.set('fhir.Patient', provider);
      return provider;
    }
    else if (FhirTypeGuard.isPractitioner(object)) {
      if (this._labelProviders.has('fhir.Practitioner')) {
        return this._labelProviders.get('fhir.Practitioner');
      }
      const provider = new NamedResourceLabelProvider() as ILabelProvider<any>;
      this._labelProviders.set('fhir.Practitioner', provider);
      return provider;
    }
    else if (FhirTypeGuard.isComposition(object)) {
      if (this._labelProviders.has('fhir.Composition')) {
        return this._labelProviders.get('fhir.Composition');
      }
      const provider = new CompositionLabelProvider() as ILabelProvider<any>;
      this._labelProviders.set('fhir.Composition', provider);
      return provider;
    }
    else if (FhirTypeGuard.isLibrary(object)) {
      if (this._labelProviders.has('fhir.Library')) {
        return this._labelProviders.get('fhir.Library');
      }
      const provider = new LibraryLabelProvider() as ILabelProvider<any>;
      this._labelProviders.set('fhir.Library', provider);
      return provider;
    }
    else if (FhirTypeGuard.isBundle(object)) {
      if (this._labelProviders.has('fhir.Bundle')) {
        return this._labelProviders.get('fhir.Bundle');
      }
      const provider = new BundleLabelProvider(this) as ILabelProvider<Bundle>;
      this._labelProviders.set('fhir.Bundle', provider);
      return provider;
    }
    else if (object === 'fhir.Ratio') {
      if (this._labelProviders.has(object)) {
        return this._labelProviders.get(object);
      }
      const provider = new RatioLabelProvider() as ILabelProvider<any>;
      this._labelProviders.set(object, provider);
      return provider;
    }
    else if (object === 'fhir.Quantity') {
      if (this._labelProviders.has(object)) {
        return this._labelProviders.get(object);
      }
      const provider = new QuantityLabelProvider() as ILabelProvider<any>;
      this._labelProviders.set(object, provider);
      return provider;
    }
    else if (object === 'fhir.CodeableConcept') {
      if (this._labelProviders.has(object)) {
        return this._labelProviders.get(object);
      }
      const provider = new CodeableConceptLabelProvider() as ILabelProvider<any>;
      this._labelProviders.set(object, provider);
      return provider;
    }
    else if (object === 'fhir.Coding') {
      if (this._labelProviders.has(object)) {
        return this._labelProviders.get(object);
      }
      const provider = new CodingLabelProvider() as ILabelProvider<any>;
      this._labelProviders.set(object, provider);
      return provider;
    }
    else if (object === 'fhir.Reference') {
      if (this._labelProviders.has(object)) {
        return this._labelProviders.get(object);
      }
      const provider = new ReferenceLabelProvider() as ILabelProvider<any>;
      this._labelProviders.set(object, provider);
      return provider;
    }
    else if (object === 'fhir.ParametersParameter') {
      if (this._labelProviders.has(object)) {
        return this._labelProviders.get(object);
      }
      const provider = new ParametersParameterLabelProvider() as ILabelProvider<any>;
      this._labelProviders.set(object, provider);
      return provider;
    }
    else if (object === 'fhir.ValueSetContains') {
      if (this._labelProviders.has(object)) {
        return this._labelProviders.get(object);
      }
      const provider = new ValueSetContainsLabelProvider() as ILabelProvider<any>;
      this._labelProviders.set(object, provider);
      return provider;
    }
    console.log('Error: provider not supported! ', object);
    return undefined;
  }
}
