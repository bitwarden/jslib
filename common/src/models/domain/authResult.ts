import { TwoFactorProviderType } from '../../enums/twoFactorProviderType';

export class AuthResult {
    twoFactor: boolean = false;
    resetMasterPassword: boolean = false;
    twoFactorProviders: Map<TwoFactorProviderType, { [key: string]: string; }> = null;
}
