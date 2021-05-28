import { SmartUserModel } from '../../smart/models/smart.user.model';
import { fhir } from '../fhir/fhir.types';
import id = fhir.id;

export interface IStateModel {
  user: SmartUserModel;
  patient: id;
}

export class StateModel implements IStateModel {

  user: SmartUserModel;

  patient: id;

  public userType(): string | null {
    const profile = this.user.profile;
    if (profile) {
      return profile.split('/')[0];
    }
    return null;
  }

  public userId(): string | null {
    const profile = this.user.profile;
    if (profile) {
      return profile.split('/')[1];
    }
    return null;
  }
}
