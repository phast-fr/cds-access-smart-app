import { SmartUserModel } from '../../smart/models/smart.user.model';
import { SmartToken } from '../../smart/models/smart.token.model';

export interface StateModel {
  user: SmartUserModel;
  token: SmartToken;
}
