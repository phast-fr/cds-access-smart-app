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
import {HttpHeaders} from '@angular/common/http';
import {Observable} from 'rxjs';

import {
  Bundle,
  CodeableConcept,
  MedicationIngredient,
  MedicationKnowledge,
  OperationOutcome,
  Parameters,
  id, Composition, ParametersParameter, Quantity
} from 'phast-fhir-ts';

import {FhirClientService, Options} from '../../fhir/services/fhir.client.service';
import {environment} from '../../../../environments/environment';

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
    const searchParams = new URLSearchParams({
      _count: (pageSize) ? pageSize.toString() : PhastCioDcService.DEFAULT_PAGE_SIZE.toString(),
      'product-type': 'DC1',
      _elements: 'ingredient,code,id,doseForm,amount',
      LinkPageNumber: '0'
    });

    return this.search<OperationOutcome | Bundle & { type: 'searchset' }>(
        'MedicationKnowledge',
        searchParams,
      'code:text',
        filter,
        sortActive,
        sortDirection,
        page
    );
  }

  searchMedicationKnowledgeUCD(filter?: string | undefined, sortActive?: string, sortDirection?: string,
                               page?: number, pageSize?: number): Observable<OperationOutcome | Bundle & { type: 'searchset' }> {
    const searchParams = new URLSearchParams({
      _count: (pageSize) ? pageSize.toString() : PhastCioDcService.DEFAULT_PAGE_SIZE.toString(),
      'product-type': 'UCD',
      _elements: 'ingredient,code,id,doseForm,amount',
      LinkPageNumber: '0'
    });
    return this.search<OperationOutcome | Bundle & { type: 'searchset' }>(
        'MedicationKnowledge',
        searchParams,
      'code:text',
        filter,
        sortActive,
        sortDirection,
        page
    );
  }

  searchComposition(filter?: string | undefined, sortActive?: string, sortDirection?: string,
                    page?: number, pageSize?: number): Observable<OperationOutcome | Bundle & { type: 'searchset' }> {
    const searchParams = new URLSearchParams({
      _count: (pageSize) ? pageSize.toString() : PhastCioDcService.DEFAULT_PAGE_SIZE.toString(),
      _elements: 'id,title,category,type',
      LinkPageNumber: '0'
    });
    return this.search<OperationOutcome | Bundle & { type: 'searchset' }>(
        'Composition',
        searchParams,
      'type:text',
        filter,
        sortActive,
        sortDirection,
        page
    );
  }

  postMedicationKnowledgeLookupByRouteCodeAndFormCodeAndIngredient(
    mkId: id,
    mkCode: CodeableConcept,
    doseForm?: CodeableConcept,
    amount?: Quantity,
    ingredient?: MedicationIngredient[],
    intendedRoute?: CodeableConcept
  ): Observable<Parameters> {
    const input = new MedicationKnowledgeLookupBuilder(mkId, mkCode)
      .doseForm(doseForm)
      .amount(amount)
      .ingredient(ingredient)
      .intendedRoute(intendedRoute)
      .build();

    return this._fhirClient.operation<Parameters>(
        environment.cio_dc_url,
        {
          name: '$lookup?with-related-medication-knowledge=true',
          resourceType: 'MedicationKnowledge',
          id: mkId,
          method: 'post',
          input
        },
        this._options
    );
  }

  readCompositionMedicationKnowledge(compositionId: id): Observable<Composition> {
    return this._fhirClient.read<Composition>(
        environment.cio_dc_url,
        {
          resourceType: 'Composition',
          id: compositionId
        },
        this._options
    );
  }

  putCompositionMedicationKnowledge(composition: Composition): Observable<OperationOutcome> {
    return this._fhirClient.update<OperationOutcome>(
      environment.cio_dc_url,
        {
          resourceType: 'Composition',
          id: composition.id,
          input: composition
        },
        this._options
    );
  }

  private search<T>(resourceType: string, searchParams: URLSearchParams, columnNameToFilter?: string,
                    filter?: string | undefined, sortActive?: string, sortDirection?: string, page?: number): Observable<T> {

    if (sortActive) {
      if (sortDirection && sortDirection === 'desc') {
        searchParams.set('_sort', '-' + sortActive);
      }
      else if (sortDirection && sortDirection === 'asc') {
        searchParams.set('_sort', sortActive);
      }
    }

    if (page) {
      searchParams.set('LinkPageNumber', page.toString());
    }

    if (columnNameToFilter && typeof filter === 'string' && filter.length > 0) {
      searchParams.set(columnNameToFilter, filter.trim());
      return this._fhirClient.resourceSearch<T>(
          environment.cio_dc_url,
          {
            resourceType,
            searchParams
          },
          this._options
      );
    }
    return this._fhirClient.resourceSearch<T>(
        environment.cio_dc_url,
        {
          resourceType,
          searchParams
        },
        this._options
    );
  }
}

export class MedicationKnowledgeLookupBuilder {
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

  public amount(amount: Quantity | undefined): this {
    if (amount && this._parameters.parameter && this._parameters.parameter[1]) {
      const medicationKnowledge = this._parameters.parameter[1].resource as MedicationKnowledge;
      medicationKnowledge.amount = amount;
    }
    return this;
  }

  public build(): object {
    return this._parameters;
  }
}
