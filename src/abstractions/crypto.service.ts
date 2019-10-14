import { CipherString } from '../models/domain/cipherString';
import { SymmetricCryptoKey } from '../models/domain/symmetricCryptoKey';

import { ProfileOrganizationResponse } from '../models/response/profileOrganizationResponse';

import { KdfType } from '../enums/kdfType';

export abstract class CryptoService {
    setKey: (key: SymmetricCryptoKey) => Promise<any>;
    setKeyHash: (keyHash: string) => Promise<{}>;
    setEncKey: (encKey: string) => Promise<{}>;
    setEncPrivateKey: (encPrivateKey: string) => Promise<{}>;
    setOrgKeys: (orgs: ProfileOrganizationResponse[]) => Promise<{}>;
    getKey: () => Promise<SymmetricCryptoKey>;
    getKeyHash: () => Promise<string>;
    getEncKey: (key?: SymmetricCryptoKey) => Promise<SymmetricCryptoKey>;
    getPublicKey: () => Promise<ArrayBuffer>;
    getPrivateKey: () => Promise<ArrayBuffer>;
    getFingerprint: (userId: string, publicKey?: ArrayBuffer) => Promise<string[]>;
    getOrgKeys: () => Promise<Map<string, SymmetricCryptoKey>>;
    getOrgKey: (orgId: string) => Promise<SymmetricCryptoKey>;
    hasKey: () => Promise<boolean>;
    hasEncKey: () => Promise<boolean>;
    clearKey: () => Promise<any>;
    clearKeyHash: () => Promise<any>;
    clearEncKey: (memoryOnly?: boolean) => Promise<any>;
    clearKeyPair: (memoryOnly?: boolean) => Promise<any>;
    clearOrgKeys: (memoryOnly?: boolean) => Promise<any>;
    clearPinProtectedKey: () => Promise<any>;
    clearKeys: () => Promise<any>;
    toggleKey: () => Promise<any>;
    makeKey: (password: string, salt: string, kdf: KdfType, kdfIterations: number) => Promise<SymmetricCryptoKey>;
    makeKeyFromPin: (pin: string, salt: string, kdf: KdfType, kdfIterations: number,
        protectedKeyCs?: CipherString) => Promise<SymmetricCryptoKey>;
    makeShareKey: () => Promise<[CipherString, SymmetricCryptoKey]>;
    makeKeyPair: (key?: SymmetricCryptoKey) => Promise<[string, CipherString]>;
    makePinKey: (pin: string, salt: string, kdf: KdfType, kdfIterations: number) => Promise<SymmetricCryptoKey>;
    hashPassword: (password: string, key: SymmetricCryptoKey) => Promise<string>;
    makeEncKey: (key: SymmetricCryptoKey) => Promise<[SymmetricCryptoKey, CipherString]>;
    remakeEncKey: (key: SymmetricCryptoKey) => Promise<[SymmetricCryptoKey, CipherString]>;
    encrypt: (plainValue: string | ArrayBuffer, key?: SymmetricCryptoKey) => Promise<CipherString>;
    encryptToBytes: (plainValue: ArrayBuffer, key?: SymmetricCryptoKey) => Promise<ArrayBuffer>;
    rsaEncrypt: (data: ArrayBuffer, publicKey?: ArrayBuffer) => Promise<CipherString>;
    decryptToBytes: (cipherString: CipherString, key?: SymmetricCryptoKey) => Promise<ArrayBuffer>;
    decryptToUtf8: (cipherString: CipherString, key?: SymmetricCryptoKey) => Promise<string>;
    decryptFromBytes: (encBuf: ArrayBuffer, key: SymmetricCryptoKey) => Promise<ArrayBuffer>;
    randomNumber: (min: number, max: number) => Promise<number>;
}
