import { TwoFactorProviderType } from '../enums/twoFactorProviderType';

import { AuthResult } from '../models/domain/authResult';
import { SymmetricCryptoKey } from '../models/domain/symmetricCryptoKey';

export abstract class AuthService {
    email: string;
    masterPasswordHash: string;
    twoFactorProvidersData: Map<TwoFactorProviderType, { [key: string]: string; }>;
    selectedTwoFactorProviderType: TwoFactorProviderType;

    logIn: (email: string, masterPassword: string) => Promise<AuthResult>;
    logInTwoFactor: (twoFactorProvider: TwoFactorProviderType, twoFactorToken: string,
        remember?: boolean) => Promise<AuthResult>;
    logInComplete: (email: string, masterPassword: string, twoFactorProvider: TwoFactorProviderType,
        twoFactorToken: string, remember?: boolean) => Promise<AuthResult>;
    logOut: (callback: Function) => void;
    getSupportedTwoFactorProviders: (win: Window) => any[];
    getDefaultTwoFactorProvider: (u2fSupported: boolean) => TwoFactorProviderType;
    makePreloginKey: (masterPassword: string, email: string) => Promise<SymmetricCryptoKey>;
}
