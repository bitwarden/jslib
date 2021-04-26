import { PasswordVerificationRequest } from './passwordVerificationRequest';

import { TwoFactorProviderType } from '../../enums/twoFactorProviderType';

export class TwoFactorProviderRequest extends PasswordVerificationRequest {
    type: TwoFactorProviderType;
}
