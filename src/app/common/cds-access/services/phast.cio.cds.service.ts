/**
 * @license
 * Copyright PHAST SARL All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://cds-access.phast.fr/license
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

  constructor(private _fhirClient: FhirClientService) {
    this._options = {
      headers: new HttpHeaders()
        .set('Accept', 'application/json; charset=utf-8; q=1')
        .set('Content-type', 'application/fhir+json')
    } as Options;
  }

  public searchLibraryCQL(filter?: string | undefined, sortActive?: string, sortDirection?: string,
                          page?: number, pageSize?: number): Observable<OperationOutcome | Bundle & { type: 'searchset' }> {
    const searchParams = new URLSearchParams({
      _count: (pageSize) ? pageSize.toString() : PhastCioCdsService.DEFAULT_PAGE_SIZE.toString(),
      'content-type': 'text/cql'
    });
    return this.search<OperationOutcome | Bundle & { type: 'searchset' }>(
        'Library', searchParams, 'title', filter, sortActive, sortDirection, page
    );
  }

  public updateLibraryCQL(library: Library): Observable<Library> {
    return this._fhirClient.update<Library>(environment.library_url, {
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
      return this._fhirClient.resourceSearch<T>(environment.library_url, {
        resourceType,
        searchParams
      }, this._options);
    }
    return this._fhirClient.resourceSearch<T>(environment.library_url, {
      resourceType,
      searchParams
    }, this._options);
  }
}
