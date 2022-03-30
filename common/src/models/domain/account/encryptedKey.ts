import { CryptoService } from "jslib-common/abstractions/crypto.service";

import { EncString } from "../encString";
import { SymmetricCryptoKey } from "../symmetricCryptoKey";

export abstract class BaseEncryptedOrganizationKey {
  decrypt: (cryptoService: CryptoService) => Promise<SymmetricCryptoKey>;
  toJSON: () => string;

  static fromObj(obj: { key: string; providerId?: string }) {
    if (obj.providerId != null) {
      return new ProviderEncryptedOrganizationKey(obj.key, obj.providerId);
    }

    return new EncryptedOrganizationKey(obj.key);
  }
}

export class EncryptedOrganizationKey implements BaseEncryptedOrganizationKey {
  constructor(private key: string) {}

  async decrypt(cryptoService: CryptoService) {
    const decValue = await cryptoService.rsaDecrypt(this.key);
    return new SymmetricCryptoKey(decValue);
  }

  toJSON() {
    return JSON.stringify({ key: this.key });
  }
}

export class ProviderEncryptedOrganizationKey implements BaseEncryptedOrganizationKey {
  constructor(private key: string, private providerId: string) {}

  async decrypt(cryptoService: CryptoService) {
    const providerKey = await cryptoService.getProviderKey(this.providerId);
    const decValue = await cryptoService.decryptToBytes(new EncString(this.key), providerKey);
    return new SymmetricCryptoKey(decValue);
  }

  toJSON() {
    return JSON.stringify({
      key: this.key,
      providerId: this.providerId,
    });
  }
}
