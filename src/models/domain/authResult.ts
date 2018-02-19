import { TwoFactorProviderType } from '../../enums';

export class AuthResult {
    twoFactor: boolean = false;
    twoFactorProviders: Map<TwoFactorProviderType, { [key: string]: string; }> = null;
}
