import { CryptoService } from "jslib-common/abstractions/crypto.service";
import { EncryptedOrganizationKeyData } from "jslib-common/models/data/encryptedOrganizationKeyData";

import { EncString } from "../encString";
import { SymmetricCryptoKey } from "../symmetricCryptoKey";

export abstract class BaseEncryptedOrganizationKey {
  decrypt: (cryptoService: CryptoService) => Promise<SymmetricCryptoKey>;

  static fromData(data: EncryptedOrganizationKeyData) {
    if (data.providerId != null) {
      return new ProviderEncryptedOrganizationKey(data.key, data.providerId);
    }

    return new EncryptedOrganizationKey(data.key);
  }
}

export class EncryptedOrganizationKey implements BaseEncryptedOrganizationKey {
  constructor(private key: string) {}

  async decrypt(cryptoService: CryptoService) {
    const decValue = await cryptoService.rsaDecrypt(this.key);
    return new SymmetricCryptoKey(decValue);
  }

  toData() {
    return new EncryptedOrganizationKeyData(this.key);
  }
}

export class ProviderEncryptedOrganizationKey implements BaseEncryptedOrganizationKey {
  constructor(private key: string, private providerId: string) {}

  async decrypt(cryptoService: CryptoService) {
    const providerKey = await cryptoService.getProviderKey(this.providerId);
    const decValue = await cryptoService.decryptToBytes(new EncString(this.key), providerKey);
    return new SymmetricCryptoKey(decValue);
  }

  toData() {
    return new EncryptedOrganizationKeyData(this.key, this.providerId);
  }
}
