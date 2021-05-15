import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

import { StateModel } from '../models/state.model';

@Injectable()
export class StateService {

  constructor() {}

  stateSubject$ = new Subject<StateModel>();

  state: StateModel;

  /**
   * Returns the user ID or null.
   */
  getUserId(): string | null {
    const profile = this.state.user.profile;
    if (profile) {
      return profile.split('/')[1];
    }
    return null;
  }

  /**
   * Returns the type of the logged-in user or null. The result can be
   * "Practitioner", "Patient" or "RelatedPerson".
   */
  getUserType(): string | null {
    const profile = this.state.user.profile;
    if (profile) {
      return profile.split('/')[0];
    }
    return null;
  }

  getUser<T>(tokenId: string): T {
    return this.jwtDecode(tokenId) as any;
  }

  emitState(state: StateModel): void {
    this.state = state;
    this.stateSubject$.next(state);
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
