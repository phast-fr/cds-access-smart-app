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
    OperationOutcome,
    Parameters,
    id, Composition, ParametersParameter, MedicationRequest, Dosage, Medication, MedicationIngredient
} from 'phast-fhir-ts';

import {FhirClientService, Options} from '../../fhir/services/fhir.client.service';
import {environment} from '../../../../environments/environment';
import {FhirTypeGuard} from '../../fhir/utils/fhir.type.guard';

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

  postMedicationKnowledgeLookup(
    bundle: Bundle | undefined
  ): Observable<Parameters> {
      const medicationRequest = bundle?.entry?.filter(entry => FhirTypeGuard.isMedicationRequest(entry.resource))
          .map(entry => entry.resource as MedicationRequest)
          .reduce((_, current) => current);

      const inputBuilder = new MedicationKnowledgeLookupBuilder()
          .withMedicationRequest(
              medicationRequest
          );
      bundle?.entry?.filter(entry => FhirTypeGuard.isMedication(entry.resource))
          .map(entry => entry.resource as Medication)
          .forEach(medication => inputBuilder.withMedication(medication));

      return this._fhirClient.operation<Parameters>(
        environment.cio_dc_url,
        {
          name: '$lookup2?',
          resourceType: 'MedicationKnowledge',
          method: 'post',
          input: inputBuilder.build()
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

  private readonly _part: ParametersParameter[];

  constructor() {
    this._parameters = {
      resourceType: 'Parameters',
      parameter: new Array<ParametersParameter>(
        {
          name: 'with-related-medication-knowledge',
          valueBoolean: false
        }
      ),
    };
    this._part = [];
  }

  public withMedicationRequest(medicationRequest: MedicationRequest | undefined): this {
      medicationRequest?.dosageInstruction?.forEach(((dosage: Dosage, indexDosage: number) => {
          this._part.push({
              name: 'identifier',
              valueString: `MedicationRequest.dosageInstruction[${indexDosage}]`
          });

          if (dosage.route) {
              this._part.push({
                  name: 'Route',
                  valueCodeableConcept: dosage.route
              });
          }
      }));
      return this;
  }

  public withMedication(medication: Medication): this {
      const medPart = {
          name: 'medication',
          part: [
              {
                  name: 'code',
                  valueCodeableConcept: medication.code
              }
          ] as ParametersParameter[]
      } as ParametersParameter;

      if (medication.form) {
          medPart.part?.push({
              name: 'form',
              valueCodeableConcept: medication.form
          });
      }
      if (medication.amount) {
          medPart.part?.push({
              name: 'amount',
              valueRatio: medication.amount
          });
      }
      if (medication.ingredient) {
          medPart.part?.push({
              name: 'ingredient',
              part: medication.ingredient?.map((ingredient: MedicationIngredient) => {
                  return {
                      name: 'item',
                      valueCodeableConcept: ingredient.itemCodeableConcept
                  } as ParametersParameter;
              })
          });
      }
      this._part.push(medPart);
      return this;
  }

  public build(): Parameters {
      this._parameters.parameter?.push(
          {
              name: 'item',
              part: this._part
          }
      );
      return this._parameters;
  }
}
