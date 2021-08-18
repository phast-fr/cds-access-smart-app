import {id, uri} from 'phast-fhir-ts';

export class ReferenceParser {

  private _id: id;

  private _resourceType: string;

  private _baseUrl: uri;

  constructor() {}

  public get baseUrl(): uri {
    return this._baseUrl;
  }

  public get resourceType(): string {
    return this._resourceType;
  }

  public get id(): id {
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
