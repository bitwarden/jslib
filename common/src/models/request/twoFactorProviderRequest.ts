import { SecretVerificationRequest } from './secretVerificationRequest';

import { TwoFactorProviderType } from '../../enums/twoFactorProviderType';

export class TwoFactorProviderRequest extends SecretVerificationRequest {
    type: TwoFactorProviderType;
}
