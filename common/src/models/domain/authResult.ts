import { TwoFactorProviderType } from '../../enums/twoFactorProviderType';

export class AuthResult {
    twoFactor: boolean = false;
    captchaSiteKey: string = '';
    resetMasterPassword: boolean = false;
    forcePasswordReset: boolean = false;
    twoFactorProviders: Map<TwoFactorProviderType, { [key: string]: string; }> = null;
}
