import { EncryptionType } from '../../enums';

import { SymmetricCryptoKey } from './symmetricCryptoKey';

export class EncryptedObject {
    type: EncryptionType;
    iv: ArrayBuffer;
    data: ArrayBuffer;
    mac: ArrayBuffer;
    key: SymmetricCryptoKey;
}
