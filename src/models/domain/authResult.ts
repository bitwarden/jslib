import { TwoFactorProviderType } from '../../enums/twoFactorProviderType';

export class AuthResult {
    twoFactor: boolean = false;
    twoFactorProviders: Map<TwoFactorProviderType, { [key: string]: string; }> = null;
}
