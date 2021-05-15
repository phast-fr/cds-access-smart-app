import { Injectable } from '@angular/core';

import FhirClient from 'fhir-kit-client';

import { environment } from '../../../environments/environment';
import { fhir } from '../fhir/fhir.types';
import id = fhir.id;
import Parameters = fhir.Parameters;
import ParametersParameter = fhir.ParametersParameter;
import CodeableConcept = fhir.CodeableConcept;
import MedicationKnowledge = fhir.MedicationKnowledge;
import MedicationIngredient = fhir.MedicationIngredient;

@Injectable()
export class FhirCioDcService {

  private fhirClient: FhirClient;

  constructor() {
    this.fhirClient = new FhirClient({
      baseUrl: environment.cio_dc_url,
      customHeaders: {
        Authorization: 'Basic ' + environment.cio_dc_credential,
        Accept: 'application/json'
      }
    });
  }

  searchMedicationKnowledge(name: string | undefined):
    Promise<fhir.OperationOutcome | fhir.Bundle & { type: 'searchset' }> {
    if (typeof name === 'string') {
      const search = name.trim();
      return this.fhirClient.resourceSearch({
        resourceType: 'MedicationKnowledge',
        searchParams: {
          _count: 10,
          'product-type': 'DC',
          _elements: 'ingredient,code,id,relatedMedicationKnowledge',
          'ingredient-code:text': search
        }
      });
    }
    return this.fhirClient.resourceSearch({
      resourceType: 'MedicationKnowledge',
      searchParams: {
        _count: 10,
        'product-type': 'DC',
        _elements: 'ingredient,code,id,relatedMedicationKnowledge'
      }
    });
  }

  postMedicationKnowledgeDetailsByRouteCodeAndFormCodeAndIngredient(
    mkId: id,
    mkCode: CodeableConcept,
    doseForm: CodeableConcept | undefined,
    ingredient: MedicationIngredient[] | undefined,
    intendedRoute: CodeableConcept | undefined
  ): Promise<Parameters> {
    const input = new MedicationKnowledgeDetailsBuilder(mkId, mkCode)
      .doseForm(doseForm)
      .ingredient(ingredient)
      .intendedRoute(intendedRoute)
      .build();

    return this.fhirClient.operation({
      name: '$phast-medication-knowledge-details',
      resourceType: 'MedicationKnowledge',
      id: mkId,
      method: 'post',
      input
    });
  }
}

export class MedicationKnowledgeDetailsBuilder {
  private readonly _parameters: Parameters;

  constructor(mkId: id, mkCode: CodeableConcept) {
    this._parameters = {
      resourceType: 'Parameters',
      parameter: new Array<ParametersParameter>(
        {
          name: 'with-related-medication-knowledge',
          valueBoolean: true
        },
        {
          name: 'medicationKnowledge',
          resource: {
            resourceType: 'MedicationKnowledge',
            id: mkId,
            code: mkCode,
            status: 'active',
            doseForm: undefined,
            ingredient: new Array<MedicationIngredient>(),
            intendedRoute: new Array<CodeableConcept>()
          } as MedicationKnowledge
        }
      ),
    };
  }

  public doseForm(doseForm: CodeableConcept | undefined): this {
    if (doseForm !== undefined) {
      const medicationKnowledge = this._parameters.parameter[1].resource as MedicationKnowledge;
      medicationKnowledge.doseForm = doseForm;
    }
    return this;
  }

  public ingredient(ingredient: MedicationIngredient[] | undefined): this {
    if (ingredient !== undefined) {
      const medicationKnowledge = this._parameters.parameter[1].resource as MedicationKnowledge;
      for (const element of ingredient) {
        medicationKnowledge.ingredient.push(element);
      }
    }
    return this;
  }

  public intendedRoute(intendedRoute: CodeableConcept | undefined): this {
    if (intendedRoute !== undefined) {
      const medicationKnowledge = this._parameters.parameter[1].resource as MedicationKnowledge;
      medicationKnowledge.intendedRoute.push(intendedRoute);
    }
    return this;
  }

  public build(): object {
    return this._parameters;
  }
}
