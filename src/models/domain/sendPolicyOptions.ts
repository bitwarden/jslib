import { DisableSendPolicyType } from '../../enums/disableSendPolicyType';
import Domain from './domainBase';

export class DisableSendPolicyOptions extends Domain {
    disabledSendTypes: DisableSendPolicyType
}
