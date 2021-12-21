import { TwoFactorProviderType } from "../enums/twoFactorProviderType";

export abstract class TwoFactorService {
  init: () => void;
  getSupportedProviders: (win: Window) => any[];
  getDefaultProvider: (webAuthnSupported: boolean) => TwoFactorProviderType;
  setSelectedProvider: (type: TwoFactorProviderType) => void;
  clearSelectedProvider: () => void;

  setProviders: (data: any) => void;
  clearProviders: () => void;
  getProviders: () => Map<TwoFactorProviderType, { [key: string]: string }>;
}
