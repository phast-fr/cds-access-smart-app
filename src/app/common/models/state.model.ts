import { SmartUserModel } from '../../smart/models/smart.user.model';
import { fhir } from '../fhir/fhir.types';
import id = fhir.id;
import {SmartToken} from '../../smart/models/smart.token.model';

export interface IStateModel {
  user: SmartUserModel;
  patient: id;
  needPatientBanner: boolean;
}

export class StateModel implements IStateModel {

  user: SmartUserModel;

  patient: id;

  needPatientBanner: boolean;

  public userType(): string | null {
    const profile = this.user.profile;
    if (profile) {
      return profile.split('/')[0];
    }
    return null;
  }

  public getNeedPatientBanner(): boolean | null {
    return  this.needPatientBanner;
  }

  public userId(): string | null {
    const profile = this.user.profile;
    if (profile) {
      return profile.split('/')[1];
    }
    return null;
  }
}
