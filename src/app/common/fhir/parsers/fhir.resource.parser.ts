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

import {id, uri} from 'phast-fhir-ts';

export class ReferenceParser {

  private _id?: id;

  private _resourceType?: string;

  private _baseUrl?: uri;

  constructor() {
  }

  public get baseUrl(): uri | undefined {
    return this._baseUrl;
  }

  public get resourceType(): string | undefined {
    return this._resourceType;
  }

  public get id(): id | undefined {
    return this._id;
  }

  public parse(referenceStr: string): void {
    const nBaseUrl = referenceStr.lastIndexOf('fhir') + 4;
    if (nBaseUrl > 0) {
      this._baseUrl = referenceStr.substring(0, nBaseUrl);
    }
    const nResourceType = referenceStr.lastIndexOf('/');
    this._resourceType = referenceStr.substring(nBaseUrl + 1, nResourceType);
    this._id = referenceStr.substring(nResourceType + 1);
  }
}
