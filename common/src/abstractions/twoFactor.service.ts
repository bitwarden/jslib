import { TwoFactorProviderType } from '../enums/twoFactorProviderType';

export abstract class TwoFactorService {
    getSupportedTwoFactorProviders: (win: Window) => any[];
    getDefaultTwoFactorProvider: (webAuthnSupported: boolean) => TwoFactorProviderType;
    clearSelectedProvider: () => void;
    setProviders: (data: any) => void;
    clearProviders: () => void;
    providers: Map<TwoFactorProviderType, { [key: string]: string }>;
}
