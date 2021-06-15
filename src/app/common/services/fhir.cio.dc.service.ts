import {Injectable} from '@angular/core';

import FhirClient from 'fhir-kit-client';

import {environment} from '../../../environments/environment';
import {fhir} from '../fhir/fhir.types';
import id = fhir.id;
import Parameters = fhir.Parameters;
import ParametersParameter = fhir.ParametersParameter;
import CodeableConcept = fhir.CodeableConcept;
import MedicationKnowledge = fhir.MedicationKnowledge;
import MedicationIngredient = fhir.MedicationIngredient;
import OperationOutcome = fhir.OperationOutcome;
import Bundle = fhir.Bundle;

@Injectable()
export class FhirCioDcService {

  static DEFAULT_PAGE_SIZE = 10;

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

  searchMedicationKnowledge(filter?: string | undefined, sortActive?: string, sortDirection?: string,
                            page?: number, pageSize?: number):
    Promise<OperationOutcome | Bundle & { type: 'searchset' }> {
    const searchParams = {
      _count: (pageSize) ? pageSize : FhirCioDcService.DEFAULT_PAGE_SIZE,
      // 'product-type': 'DC',
      _elements: 'ingredient,code,id,relatedMedicationKnowledge',
      LinkPageNumber: 0
    };

    if (sortDirection && sortDirection.length > 0) {
      searchParams['_sort:' + sortDirection] = sortActive;
    }

    if (page) {
      searchParams.LinkPageNumber = page;
    }

    if (typeof filter === 'string' && filter.length > 0) {
      searchParams['code:text'] = filter.trim();
      return this.fhirClient.resourceSearch({
        resourceType: 'MedicationKnowledge',
        searchParams
      });
    }
    return this.fhirClient.resourceSearch({
      resourceType: 'MedicationKnowledge',
      searchParams
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

    console.log(input);

    return this.fhirClient.operation({
      name: '$phast-medication-knowledge-details?with-related-medication-knowledge=true',
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
          valueBoolean: false
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
