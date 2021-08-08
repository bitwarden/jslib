import { EncArrayBuffer } from '../models/domain/encArrayBuffer';
import { EncString } from '../models/domain/encString';
import { SymmetricCryptoKey } from '../models/domain/symmetricCryptoKey';

import { ProfileOrganizationResponse } from '../models/response/profileOrganizationResponse';
import { ProfileProviderOrganizationResponse } from '../models/response/profileProviderOrganizationResponse';
import { ProfileProviderResponse } from '../models/response/profileProviderResponse';

import { HashPurpose } from '../enums/hashPurpose';
import { KdfType } from '../enums/kdfType';

import { KeySuffixOptions } from './storage.service';

export abstract class CryptoService {
    setKey: (key: SymmetricCryptoKey) => Promise<any>;
    setKeyHash: (keyHash: string) => Promise<{}>;
    setEncKey: (encKey: string) => Promise<{}>;
    setEncPrivateKey: (encPrivateKey: string) => Promise<{}>;
    setOrgKeys: (orgs: ProfileOrganizationResponse[], providerOrgs: ProfileProviderOrganizationResponse[]) => Promise<{}>;
    setProviderKeys: (orgs: ProfileProviderResponse[]) => Promise<{}>;
    getKey: (keySuffix?: KeySuffixOptions) => Promise<SymmetricCryptoKey>;
    getKeyFromStorage: (keySuffix: KeySuffixOptions) => Promise<SymmetricCryptoKey>;
    getKeyHash: () => Promise<string>;
    compareAndUpdateKeyHash: (masterPassword: string, key: SymmetricCryptoKey) => Promise<boolean>;
    getEncKey: (key?: SymmetricCryptoKey) => Promise<SymmetricCryptoKey>;
    getPublicKey: () => Promise<ArrayBuffer>;
    getPrivateKey: () => Promise<ArrayBuffer>;
    getFingerprint: (userId: string, publicKey?: ArrayBuffer) => Promise<string[]>;
    getOrgKeys: () => Promise<Map<string, SymmetricCryptoKey>>;
    getOrgKey: (orgId: string) => Promise<SymmetricCryptoKey>;
    getProviderKey: (providerId: string) => Promise<SymmetricCryptoKey>;
    hasKey: () => Promise<boolean>;
    hasKeyInMemory: () => boolean;
    hasKeyStored: (keySuffix?: KeySuffixOptions) => Promise<boolean>;
    hasEncKey: () => Promise<boolean>;
    clearKey: (clearSecretStorage?: boolean) => Promise<any>;
    clearKeyHash: () => Promise<any>;
    clearEncKey: (memoryOnly?: boolean) => Promise<any>;
    clearKeyPair: (memoryOnly?: boolean) => Promise<any>;
    clearOrgKeys: (memoryOnly?: boolean) => Promise<any>;
    clearProviderKeys: (memoryOnly?: boolean) => Promise<any>;
    clearPinProtectedKey: () => Promise<any>;
    clearKeys: () => Promise<any>;
    toggleKey: () => Promise<any>;
    makeKey: (password: string, salt: string, kdf: KdfType, kdfIterations: number) => Promise<SymmetricCryptoKey>;
    makeKeyFromPin: (pin: string, salt: string, kdf: KdfType, kdfIterations: number,
        protectedKeyCs?: EncString) => Promise<SymmetricCryptoKey>;
    makeShareKey: () => Promise<[EncString, SymmetricCryptoKey]>;
    makeKeyPair: (key?: SymmetricCryptoKey) => Promise<[string, EncString]>;
    makePinKey: (pin: string, salt: string, kdf: KdfType, kdfIterations: number) => Promise<SymmetricCryptoKey>;
    makeSendKey: (keyMaterial: ArrayBuffer) => Promise<SymmetricCryptoKey>;
    hashPassword: (password: string, key: SymmetricCryptoKey, hashPurpose?: HashPurpose) => Promise<string>;
    makeEncKey: (key: SymmetricCryptoKey) => Promise<[SymmetricCryptoKey, EncString]>;
    remakeEncKey: (key: SymmetricCryptoKey, encKey?: SymmetricCryptoKey) => Promise<[SymmetricCryptoKey, EncString]>;
    encrypt: (plainValue: string | ArrayBuffer, key?: SymmetricCryptoKey) => Promise<EncString>;
    encryptToBytes: (plainValue: ArrayBuffer, key?: SymmetricCryptoKey) => Promise<EncArrayBuffer>;
    rsaEncrypt: (data: ArrayBuffer, publicKey?: ArrayBuffer) => Promise<EncString>;
    rsaDecrypt: (encValue: string, privateKeyValue?: ArrayBuffer) => Promise<ArrayBuffer>;
    decryptToBytes: (encString: EncString, key?: SymmetricCryptoKey) => Promise<ArrayBuffer>;
    decryptToUtf8: (encString: EncString, key?: SymmetricCryptoKey) => Promise<string>;
    decryptFromBytes: (encBuf: ArrayBuffer, key: SymmetricCryptoKey) => Promise<ArrayBuffer>;
    randomNumber: (min: number, max: number) => Promise<number>;
    validateKey: (key: SymmetricCryptoKey) => Promise<boolean>;
}
