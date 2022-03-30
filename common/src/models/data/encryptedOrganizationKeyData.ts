export class EncryptedOrganizationKeyData {
  constructor(public key: string, public providerId?: string) {}

  static fromObj(obj: { key: string; providerId?: string }) {
    return new EncryptedOrganizationKeyData(obj.key, obj.providerId);
  }
}
