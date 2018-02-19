import { TwoFactorProviderType } from '../enums';

import { AuthResult } from '../models/domain';

export abstract class AuthService {
    email: string;
    masterPasswordHash: string;
    twoFactorProviders: Map<TwoFactorProviderType, { [key: string]: string; }>;

    logIn: (email: string, masterPassword: string) => Promise<AuthResult>;
    logInTwoFactor: (twoFactorProvider: TwoFactorProviderType, twoFactorToken: string,
        remember?: boolean) => Promise<AuthResult>;
    logOut: (callback: Function) => void;
    getDefaultTwoFactorProvider: (u2fSupported: boolean) => TwoFactorProviderType;
}
