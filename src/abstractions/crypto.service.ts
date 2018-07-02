import { CipherString } from '../models/domain/cipherString';
import { SymmetricCryptoKey } from '../models/domain/symmetricCryptoKey';

import { ProfileOrganizationResponse } from '../models/response/profileOrganizationResponse';

export abstract class CryptoService {
    setKey: (key: SymmetricCryptoKey) => Promise<any>;
    setKeyHash: (keyHash: string) => Promise<{}>;
    setEncKey: (encKey: string) => Promise<{}>;
    setEncPrivateKey: (encPrivateKey: string) => Promise<{}>;
    setOrgKeys: (orgs: ProfileOrganizationResponse[]) => Promise<{}>;
    getKey: () => Promise<SymmetricCryptoKey>;
    getKeyHash: () => Promise<string>;
    getEncKey: () => Promise<SymmetricCryptoKey>;
    getPublicKey: () => Promise<ArrayBuffer>;
    getPrivateKey: () => Promise<ArrayBuffer>;
    getOrgKeys: () => Promise<Map<string, SymmetricCryptoKey>>;
    getOrgKey: (orgId: string) => Promise<SymmetricCryptoKey>;
    hasKey: () => Promise<boolean>;
    clearKey: () => Promise<any>;
    clearKeyHash: () => Promise<any>;
    clearEncKey: (memoryOnly?: boolean) => Promise<any>;
    clearPrivateKey: (memoryOnly?: boolean) => Promise<any>;
    clearOrgKeys: (memoryOnly?: boolean) => Promise<any>;
    clearKeys: () => Promise<any>;
    toggleKey: () => Promise<any>;
    makeKey: (password: string, salt: string) => Promise<SymmetricCryptoKey>;
    makeShareKey: () => Promise<[CipherString, SymmetricCryptoKey]>;
    hashPassword: (password: string, key: SymmetricCryptoKey) => Promise<string>;
    makeEncKey: (key: SymmetricCryptoKey) => Promise<CipherString>;
    encrypt: (plainValue: string | ArrayBuffer, key?: SymmetricCryptoKey) => Promise<CipherString>;
    encryptToBytes: (plainValue: ArrayBuffer, key?: SymmetricCryptoKey) => Promise<ArrayBuffer>;
    decryptToUtf8: (cipherString: CipherString, key?: SymmetricCryptoKey) => Promise<string>;
    decryptFromBytes: (encBuf: ArrayBuffer, key: SymmetricCryptoKey) => Promise<ArrayBuffer>;
    randomNumber: (min: number, max: number) => Promise<number>;
}
