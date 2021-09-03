/**
 * @license
 * Copyright PHAST SARL All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://cds-access.phast.fr/license
 */
import { Injectable } from '@angular/core';
import {HttpHeaders} from '@angular/common/http';
import {Observable} from 'rxjs';
import {ParsedUrlQueryInput} from 'querystring';

import { environment } from '../../../../environments/environment';

import {FhirClientService, Options, RequestOptions} from '../../fhir/services/fhir.client.service';
import {
  Bundle,
  CodeableConcept,
  MedicationIngredient,
  MedicationKnowledge,
  OperationOutcome,
  Reference,
  Parameters,
  id, Composition, ParametersParameter, Resource
} from 'phast-fhir-ts';

/**
 * @ngModule CdsAccessModule
 * @description
 *
 * // TODO put here the description
 */
@Injectable()
export class PhastCioDcService {

  static DEFAULT_PAGE_SIZE = 10;

  private readonly _options: Options;

  constructor(private _fhirClient: FhirClientService) {
    this._options = {
      headers: new HttpHeaders()
        .set('Accept', 'application/json; charset=utf-8; q=1')
        .set('Content-type', 'application/fhir+json')
        .set('Authorization', `Basic ${environment.cio_dc_credential}`)
    } as Options;
  }

  searchMedicationKnowledgeDC(filter?: string | undefined, sortActive?: string, sortDirection?: string,
                              page?: number, pageSize?: number): Observable<OperationOutcome | Bundle & { type: 'searchset' }> {
    const searchParams = {
      _count: (pageSize) ? pageSize : PhastCioDcService.DEFAULT_PAGE_SIZE,
      'product-type': 'DC',
      _elements: 'ingredient,code,id,relatedMedicationKnowledge',
      LinkPageNumber: 0
    };

    return this.search<OperationOutcome | Bundle & { type: 'searchset' }>('MedicationKnowledge', searchParams,
      'code:text', filter, sortActive, sortDirection, page);
  }

  searchMedicationKnowledgeUCD(filter?: string | undefined, sortActive?: string, sortDirection?: string,
                               page?: number, pageSize?: number): Observable<OperationOutcome | Bundle & { type: 'searchset' }> {
    const searchParams = {
      _count: (pageSize) ? pageSize : PhastCioDcService.DEFAULT_PAGE_SIZE,
      'product-type': 'UCD',
      _elements: 'ingredient,code,id,relatedMedicationKnowledge',
      LinkPageNumber: 0
    };
    return this.search<OperationOutcome | Bundle & { type: 'searchset' }>('MedicationKnowledge', searchParams,
      'code:text', filter, sortActive, sortDirection, page);
  }

  searchComposition(filter?: string | undefined, sortActive?: string, sortDirection?: string,
                    page?: number, pageSize?: number): Observable<OperationOutcome | Bundle & { type: 'searchset' }> {
    const searchParams = {
      _count: (pageSize) ? pageSize : PhastCioDcService.DEFAULT_PAGE_SIZE,
      _elements: 'id,title,category,type',
      LinkPageNumber: 0
    };
    return this.search<OperationOutcome | Bundle & { type: 'searchset' }>('Composition', searchParams,
      'type:text', filter, sortActive, sortDirection, page);
  }

  postMedicationKnowledgeLookupByRouteCodeAndFormCodeAndIngredient(
    mkId: id,
    mkCode: CodeableConcept,
    doseForm: CodeableConcept | undefined,
    ingredient: MedicationIngredient[] | undefined,
    intendedRoute?: CodeableConcept
  ): Observable<Parameters> {
    const input = new MedicationKnowledgeDetailsBuilder(mkId, mkCode)
      .doseForm(doseForm)
      .ingredient(ingredient)
      .intendedRoute(intendedRoute)
      .build();

    return this._fhirClient.operation<Parameters>(environment.cio_dc_url, {
      name: '$lookup?with-related-medication-knowledge=true',
      resourceType: 'MedicationKnowledge',
      id: mkId,
      method: 'post',
      input
    }, this._options);
  }

  synchronizeCompositionMedicationKnowledge(compositionId: id, medicationKnowledgeReferences: Array<Reference>):
    Observable<OperationOutcome | Resource> {

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

    return this._fhirClient.request('PATCH', environment.cio_dc_url + '/Composition/' + compositionId, {
      body: jsonPatch
    } as RequestOptions);

    /*return this.fhirClient.patch({
      resourceType: 'Composition',
      id: compositionId,
      JSONPatch: jsonPatch
    });*/
  }

  readCompositionMedicationKnowledge(compositionId: id): Observable<Composition> {
    return this._fhirClient.read<Composition>(environment.cio_dc_url, {resourceType: 'Composition', id: compositionId},
      this._options);
  }

  putCompositionMedicationKnowledge(composition: Composition): Observable<OperationOutcome> {
    return this._fhirClient.update<OperationOutcome>(
      environment.cio_dc_url, {resourceType: 'Composition', id: composition.id, input: composition}, this._options
    );
  }

  private search<T>(resourceType: string, searchParams: ParsedUrlQueryInput, columnNameToFilter?: string, filter?: string | undefined,
                    sortActive?: string, sortDirection?: string, page?: number):
    Observable<T> {

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
      return this._fhirClient.resourceSearch<T>(environment.cio_dc_url, {
        resourceType,
        searchParams
      }, this._options);
    }
    return this._fhirClient.resourceSearch<T>(environment.cio_dc_url, {
      resourceType,
      searchParams
    }, this._options);
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
