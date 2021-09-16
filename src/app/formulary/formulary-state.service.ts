import { Injectable } from '@angular/core';
import { Observable, Subject } from 'rxjs';

import { Composition, Patient, Practitioner } from 'phast-fhir-ts';

@Injectable()
export class FormularyStateService {

  private _user?: Patient | Practitioner;

  private _compositionSubject$ = new Subject<Composition>();

  constructor() {
  }

  public set user(user: Patient | Practitioner | undefined) {
    this._user = user;
  }

  public get user(): Patient | Practitioner | undefined {
    return this._user;
  }

  public set changeComposition(composition: Composition) {
    this._compositionSubject$.next(composition);
  }

  public get composition$(): Observable<Composition> {
    return this._compositionSubject$.asObservable();
  }
}
