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

import { environment } from '../../../../environments/environment';

import {FhirClientService, Options} from '../../fhir/services/fhir.client.service';
import {
  Bundle,
  OperationOutcome,
  Library
} from 'phast-fhir-ts';

/**
 * @ngModule CdsAccessModule
 * @description
 *
 * // TODO put here the description
 */
@Injectable()
export class PhastCioCdsService {

  static DEFAULT_PAGE_SIZE = 10;

  private readonly _options: Options;

  constructor(
      private _fhirClient: FhirClientService
  ) {
    if (environment.cql_library_auth) {
      this._options = {
        headers: new HttpHeaders()
            .set('Accept', 'application/json; charset=utf-8; q=1')
            .set('Content-type', 'application/fhir+json')
            .set('Authorization', `Basic ${environment.cql_library_credential}`)
      } as Options;
    }
    else {
      this._options = {
        headers: new HttpHeaders()
            .set('Accept', 'application/json; charset=utf-8; q=1')
            .set('Content-type', 'application/fhir+json')
      } as Options;
    }
  }

  public searchLibraryCQL(filter?: string, sortActive?: string, sortDirection?: string,
                          page?: number, pageSize?: number, LinkPageNumber?: number): Observable<OperationOutcome | Bundle & { type: 'searchset' }> {
    const searchParams = new URLSearchParams({
      _count: (pageSize) ? pageSize.toString() : PhastCioCdsService.DEFAULT_PAGE_SIZE.toString(),
      LinkPageNumber: (LinkPageNumber) ? LinkPageNumber.toString() : '0'
      /*'content-type': 'text/cql'*/
    });
    return this.search<OperationOutcome | Bundle & { type: 'searchset' }>(
        'Library', searchParams, 'title', filter, sortActive, sortDirection, page
    );
  }

  public updateLibraryCQL(library: Library): Observable<Library> {
    return this._fhirClient.update<Library>(environment.cql_library_url, {
      resourceType: 'Library',
      id: library.id,
      input: JSON.stringify(library)
    }, this._options);
  }

  private search<T>(resourceType: string, searchParams: URLSearchParams, columnNameToFilter?: string, filter?: string | undefined,
                    sortActive?: string, sortDirection?: string, page?: number): Observable<T> {

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
      return this._fhirClient.resourceSearch<T>(environment.cql_library_url, {
        resourceType,
        searchParams
      }, this._options);
    }
    return this._fhirClient.resourceSearch<T>(environment.cql_library_url, {
      resourceType,
      searchParams
    }, this._options);
  }
}
