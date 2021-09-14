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
      _elements: 'ingredient,code,id',
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
      _elements: 'ingredient,code,id,doseForm',
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
    doseForm?: CodeableConcept,
    ingredient?: MedicationIngredient[],
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

    if (columnNameToFilter && typeof filter === 'string' && filter.length > 0) {
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
    if (doseForm && this._parameters.parameter && this._parameters.parameter[1]) {
      const medicationKnowledge = this._parameters.parameter[1].resource as MedicationKnowledge;
      medicationKnowledge.doseForm = doseForm;
    }
    return this;
  }

  public ingredient(ingredient: MedicationIngredient[] | undefined): this {
    if (ingredient && this._parameters.parameter && this._parameters.parameter[1]) {
      const medicationKnowledge = this._parameters.parameter[1].resource as MedicationKnowledge;
      ingredient.forEach(element => {
        medicationKnowledge.ingredient?.push(element);
      });
    }
    return this;
  }

  public intendedRoute(intendedRoute: CodeableConcept | undefined): this {
    if (intendedRoute && this._parameters.parameter && this._parameters.parameter[1]) {
      const medicationKnowledge = this._parameters.parameter[1].resource as MedicationKnowledge;
      medicationKnowledge.intendedRoute?.push(intendedRoute);
    }
    return this;
  }

  public build(): object {
    return this._parameters;
  }
}
