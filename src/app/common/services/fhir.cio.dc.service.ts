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
import OperationOutcome = fhir.OperationOutcome;
import Bundle = fhir.Bundle;
import Reference = fhir.Reference;
import Composition = fhir.Composition;

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

  searchMedicationKnowledgeDC(filter?: string | undefined, sortActive?: string, sortDirection?: string,
                              page?: number, pageSize?: number):
    Promise<OperationOutcome | Bundle & { type: 'searchset' }> {
    const searchParams = {
      _count: (pageSize) ? pageSize : FhirCioDcService.DEFAULT_PAGE_SIZE,
      'product-type': 'DC',
      _elements: 'ingredient,code,id,relatedMedicationKnowledge',
      LinkPageNumber: 0
    };

    return this.search('MedicationKnowledge', searchParams, 'code:text', filter,
      sortActive, sortDirection, page);
  }

  searchMedicationKnowledgeUCD(filter?: string | undefined, sortActive?: string, sortDirection?: string,
                               page?: number, pageSize?: number):
    Promise<OperationOutcome | Bundle & { type: 'searchset' }> {
    const searchParams = {
      _count: (pageSize) ? pageSize : FhirCioDcService.DEFAULT_PAGE_SIZE,
      'product-type': 'UCD',
      _elements: 'ingredient,code,id,relatedMedicationKnowledge',
      LinkPageNumber: 0
    };
    return this.search('MedicationKnowledge', searchParams, 'code:text', filter,
      sortActive, sortDirection, page);
  }

  searchComposition(filter?: string | undefined, sortActive?: string, sortDirection?: string,
                    page?: number, pageSize?: number):
    Promise<OperationOutcome | Bundle & { type: 'searchset' }> {
    const searchParams = {
      _count: (pageSize) ? pageSize : FhirCioDcService.DEFAULT_PAGE_SIZE,
      _elements: 'id,title,category,type',
      LinkPageNumber: 0
    };
    return this.search('Composition', searchParams, 'type:text', filter,
      sortActive, sortDirection, page);
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
      name: '$phast-medication-knowledge-details',
      resourceType: 'MedicationKnowledge',
      id: mkId,
      method: 'post',
      input
    });
  }

  synchronizeCompositionMedicationKnowledge(compositionId: id, medicationKnowledgeReferences: Array<Reference>):
    Promise<OperationOutcome> {

    const jsonPatch = {
      resourceType: 'parameters',
      parameter: [{
        name: 'operation',
        part: [{
          name: 'type',
          valueCode: 'add'
        },
        {
          name: 'path',
          valueString: 'Composition.section.where(title = root)'
        },
        {
          name: 'name',
          valueString: 'entry'
        },
        {
          name: 'value',
          part: []
        }]
      }]
    };
    const operationIndex = jsonPatch.parameter.findIndex(
      parameter => parameter.name === 'operation'
    );
    const operationValueIndex = jsonPatch.parameter[operationIndex].part.findIndex(
      operation => operation.name === 'value'
    );

    for (const medicationKnowledgeReference of medicationKnowledgeReferences) {
      jsonPatch.parameter[operationIndex].part[operationValueIndex].part.push({
        name: 'reference',
        valueUri: medicationKnowledgeReference.reference
      });
    }

    return this.fhirClient.request(this.fhirClient.baseUrl + '/Composition/' + compositionId, {
      method: 'PATCH',
      body: jsonPatch,
      options: {
        headers: {
          'content-type': 'application/fhir+json'
        }
      }
    });

    /*return this.fhirClient.patch({
      resourceType: 'Composition',
      id: compositionId,
      JSONPatch: jsonPatch
    });*/
  }

  readCompositionMedicationKnowledge(compositionId: id):
    Promise<OperationOutcome | Composition> {
    return this.fhirClient.read({resourceType: 'Composition', id: compositionId});
  }

  putCompositionMedicationKnowledge(composition: Composition): Promise<OperationOutcome> {
    return this.fhirClient.update({resourceType: 'Composition', id: composition.id, body: composition});
  }

  private search(resourceType: string, searchParams: object, columnNameToFilter?: string, filter?: string | undefined,
                 sortActive?: string, sortDirection?: string, page?: number):
    Promise<OperationOutcome | Bundle & { type: 'searchset' }> {

    if (sortDirection && sortDirection === 'desc') {
      searchParams['_sort'] = '-' + sortActive;
    }
    else if (sortDirection && sortDirection === 'asc') {
      searchParams['_sort'] = sortActive;
    }

    if (page) {
      searchParams['LinkPageNumber'] = page;
    }

    if (typeof filter === 'string' && filter.length > 0) {
      searchParams[columnNameToFilter] = filter.trim();
      return this.fhirClient.resourceSearch({
        resourceType,
        searchParams
      });
    }
    return this.fhirClient.resourceSearch({
      resourceType,
      searchParams
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
