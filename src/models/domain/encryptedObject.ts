import { SymmetricCryptoKey } from './symmetricCryptoKey';

export class EncryptedObject {
    iv: ArrayBuffer;
    ct: ArrayBuffer;
    mac: ArrayBuffer;
    key: SymmetricCryptoKey;
}
