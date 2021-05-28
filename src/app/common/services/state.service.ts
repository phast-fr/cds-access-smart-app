import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

import { IStateModel, StateModel } from '../models/state.model';

@Injectable()
export class StateService {

  constructor() {
  }

  stateSubject$ = new Subject<StateModel>();

  state: IStateModel;

  public getUser<T>(tokenId: string): T {
    return this.jwtDecode(tokenId) as any;
  }

  public emitState(state: IStateModel): void {
    this.state = state;
    this.stateSubject$.next(state as StateModel);
  }

  /**
   * Decodes a JWT token and returns it's body.
   * @param tokenId The token to read
   * @category Utility
   */
  private jwtDecode(tokenId: string): object {
    const payload = tokenId.split('.')[1];
    return JSON.parse(atob(payload));
  }
}
