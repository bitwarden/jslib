import { TwoFactorProviderType } from '../enums/twoFactorProviderType';

import { AuthResult } from '../models/domain/authResult';
import { SymmetricCryptoKey } from '../models/domain/symmetricCryptoKey';

export abstract class AuthService {
    email: string;
    masterPasswordHash: string;
    code: string;
    codeVerifier: string;
    ssoRedirectUrl: string;
    clientId: string;
    clientSecret: string;
    twoFactorProvidersData: Map<TwoFactorProviderType, { [key: string]: string; }>;
    selectedTwoFactorProviderType: TwoFactorProviderType;

    logIn: (email: string, masterPassword: string) => Promise<AuthResult>;
    logInSso: (code: string, codeVerifier: string, redirectUrl: string) => Promise<AuthResult>;
    logInApiKey: (clientId: string, clientSecret: string) => Promise<AuthResult>;
    logInTwoFactor: (twoFactorProvider: TwoFactorProviderType, twoFactorToken: string,
        remember?: boolean) => Promise<AuthResult>;
    logInComplete: (email: string, masterPassword: string, twoFactorProvider: TwoFactorProviderType,
        twoFactorToken: string, remember?: boolean) => Promise<AuthResult>;
    logInSsoComplete: (code: string, codeVerifier: string, redirectUrl: string,
        twoFactorProvider: TwoFactorProviderType, twoFactorToken: string, remember?: boolean) => Promise<AuthResult>;
    logInApiKeyComplete: (clientId: string, clientSecret: string, twoFactorProvider: TwoFactorProviderType,
        twoFactorToken: string, remember?: boolean) => Promise<AuthResult>;
    logOut: (callback: Function) => void;
    getSupportedTwoFactorProviders: (win: Window) => any[];
    getDefaultTwoFactorProvider: (webAuthnSupported: boolean) => TwoFactorProviderType;
    makePreloginKey: (masterPassword: string, email: string) => Promise<SymmetricCryptoKey>;
    authingWithApiKey: () => boolean;
    authingWithSso: () => boolean;
    authingWithPassword: () => boolean;
}
