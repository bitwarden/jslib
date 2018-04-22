import * as forge from 'node-forge';

import { EncryptionType } from '../enums/encryptionType';

import { CipherString } from '../models/domain/cipherString';
import { EncryptedObject } from '../models/domain/encryptedObject';
import { SymmetricCryptoKey } from '../models/domain/symmetricCryptoKey';
import { ProfileOrganizationResponse } from '../models/response/profileOrganizationResponse';

import { CryptoService as CryptoServiceAbstraction } from '../abstractions/crypto.service';
import { CryptoFunctionService } from '../abstractions/cryptoFunction.service';
import { StorageService } from '../abstractions/storage.service';

import { ConstantsService } from './constants.service';

import { Utils } from '../misc/utils';

const Keys = {
    key: 'key',
    encOrgKeys: 'encOrgKeys',
    encPrivateKey: 'encPrivateKey',
    encKey: 'encKey',
    keyHash: 'keyHash',
};

export class CryptoService implements CryptoServiceAbstraction {
    private key: SymmetricCryptoKey;
    private encKey: SymmetricCryptoKey;
    private legacyEtmKey: SymmetricCryptoKey;
    private keyHash: string;
    private privateKey: ArrayBuffer;
    private orgKeys: Map<string, SymmetricCryptoKey>;

    constructor(private storageService: StorageService, private secureStorageService: StorageService,
        private cryptoFunctionService: CryptoFunctionService) { }

    async setKey(key: SymmetricCryptoKey): Promise<any> {
        this.key = key;

        const option = await this.storageService.get<number>(ConstantsService.lockOptionKey);
        if (option != null) {
            // if we have a lock option set, we do not store the key
            return;
        }

        return this.secureStorageService.save(Keys.key, key.keyB64);
    }

    setKeyHash(keyHash: string): Promise<{}> {
        this.keyHash = keyHash;
        return this.storageService.save(Keys.keyHash, keyHash);
    }

    async setEncKey(encKey: string): Promise<{}> {
        if (encKey == null) {
            return;
        }

        await this.storageService.save(Keys.encKey, encKey);
        this.encKey = null;
    }

    async setEncPrivateKey(encPrivateKey: string): Promise<{}> {
        if (encPrivateKey == null) {
            return;
        }

        await this.storageService.save(Keys.encPrivateKey, encPrivateKey);
        this.privateKey = null;
    }

    setOrgKeys(orgs: ProfileOrganizationResponse[]): Promise<{}> {
        const orgKeys: any = {};
        orgs.forEach((org) => {
            orgKeys[org.id] = org.key;
        });

        return this.storageService.save(Keys.encOrgKeys, orgKeys);
    }

    async getKey(): Promise<SymmetricCryptoKey> {
        if (this.key != null) {
            return this.key;
        }

        const option = await this.storageService.get<number>(ConstantsService.lockOptionKey);
        if (option != null) {
            return null;
        }

        const key = await this.secureStorageService.get<string>(Keys.key);
        if (key != null) {
            this.key = new SymmetricCryptoKey(Utils.fromB64ToArray(key).buffer);
        }

        return key == null ? null : this.key;
    }

    getKeyHash(): Promise<string> {
        if (this.keyHash != null) {
            return Promise.resolve(this.keyHash);
        }

        return this.storageService.get<string>(Keys.keyHash);
    }

    async getEncKey(): Promise<SymmetricCryptoKey> {
        if (this.encKey != null) {
            return this.encKey;
        }

        const encKey = await this.storageService.get<string>(Keys.encKey);
        if (encKey == null) {
            return null;
        }

        const key = await this.getKey();
        if (key == null) {
            return null;
        }

        const decEncKey = await this.decrypt(new CipherString(encKey), key);
        if (decEncKey == null) {
            return null;
        }

        this.encKey = new SymmetricCryptoKey(decEncKey);
        return this.encKey;
    }

    async getPrivateKey(): Promise<ArrayBuffer> {
        if (this.privateKey != null) {
            return this.privateKey;
        }

        const encPrivateKey = await this.storageService.get<string>(Keys.encPrivateKey);
        if (encPrivateKey == null) {
            return null;
        }

        this.privateKey = await this.decrypt(new CipherString(encPrivateKey), null);
        return this.privateKey;
    }

    async getOrgKeys(): Promise<Map<string, SymmetricCryptoKey>> {
        if (this.orgKeys != null && this.orgKeys.size > 0) {
            return this.orgKeys;
        }

        const encOrgKeys = await this.storageService.get<any>(Keys.encOrgKeys);
        if (encOrgKeys == null) {
            return null;
        }

        const orgKeys: Map<string, SymmetricCryptoKey> = new Map<string, SymmetricCryptoKey>();
        let setKey = false;

        for (const orgId in encOrgKeys) {
            if (!encOrgKeys.hasOwnProperty(orgId)) {
                continue;
            }

            const decValue = await this.rsaDecrypt(encOrgKeys[orgId]);
            orgKeys.set(orgId, new SymmetricCryptoKey(decValue));
            setKey = true;
        }

        if (setKey) {
            this.orgKeys = orgKeys;
        }

        return this.orgKeys;
    }

    async getOrgKey(orgId: string): Promise<SymmetricCryptoKey> {
        if (orgId == null) {
            return null;
        }

        const orgKeys = await this.getOrgKeys();
        if (orgKeys == null || !orgKeys.has(orgId)) {
            return null;
        }

        return orgKeys.get(orgId);
    }

    clearKey(): Promise<any> {
        this.key = this.legacyEtmKey = null;
        return this.secureStorageService.remove(Keys.key);
    }

    clearKeyHash(): Promise<any> {
        this.keyHash = null;
        return this.storageService.remove(Keys.keyHash);
    }

    clearEncKey(memoryOnly?: boolean): Promise<any> {
        this.encKey = null;
        if (memoryOnly) {
            return Promise.resolve();
        }
        return this.storageService.remove(Keys.encKey);
    }

    clearPrivateKey(memoryOnly?: boolean): Promise<any> {
        this.privateKey = null;
        if (memoryOnly) {
            return Promise.resolve();
        }
        return this.storageService.remove(Keys.encPrivateKey);
    }

    clearOrgKeys(memoryOnly?: boolean): Promise<any> {
        this.orgKeys = null;
        if (memoryOnly) {
            return Promise.resolve();
        }
        return this.storageService.remove(Keys.encOrgKeys);
    }

    clearKeys(): Promise<any> {
        return Promise.all([
            this.clearKey(),
            this.clearKeyHash(),
            this.clearOrgKeys(),
            this.clearEncKey(),
            this.clearPrivateKey(),
        ]);
    }

    async toggleKey(): Promise<any> {
        const key = await this.getKey();
        const option = await this.storageService.get(ConstantsService.lockOptionKey);
        if (option != null || option === 0) {
            // if we have a lock option set, clear the key
            await this.clearKey();
            this.key = key;
            return;
        }

        await this.setKey(key);
    }

    async makeKey(password: string, salt: string): Promise<SymmetricCryptoKey> {
        const key = await this.cryptoFunctionService.pbkdf2(password, salt, 'sha256', 5000);
        return new SymmetricCryptoKey(key);
    }

    async hashPassword(password: string, key: SymmetricCryptoKey): Promise<string> {
        const storedKey = await this.getKey();
        key = key || storedKey;
        if (password == null || key == null) {
            throw new Error('Invalid parameters.');
        }

        const hash = await this.cryptoFunctionService.pbkdf2(key.key, password, 'sha256', 1);
        return Utils.fromBufferToB64(hash);
    }

    async makeEncKey(key: SymmetricCryptoKey): Promise<CipherString> {
        const bytes = await this.cryptoFunctionService.randomBytes(64);
        return this.encrypt(bytes, key);
    }

    async encrypt(plainValue: string | ArrayBuffer, key?: SymmetricCryptoKey): Promise<CipherString> {
        if (plainValue == null) {
            return Promise.resolve(null);
        }

        let plainBuf: ArrayBuffer;
        if (typeof (plainValue) === 'string') {
            plainBuf = Utils.fromUtf8ToArray(plainValue).buffer;
        } else {
            plainBuf = plainValue;
        }

        const encObj = await this.aesEncrypt(plainBuf, key);
        const iv = Utils.fromBufferToB64(encObj.iv);
        const ct = Utils.fromBufferToB64(encObj.ct);
        const mac = encObj.mac != null ? Utils.fromBufferToB64(encObj.mac) : null;
        return new CipherString(encObj.key.encType, iv, ct, mac);
    }

    async encryptToBytes(plainValue: ArrayBuffer, key?: SymmetricCryptoKey): Promise<ArrayBuffer> {
        const encValue = await this.aesEncrypt(plainValue, key);
        let macLen = 0;
        if (encValue.mac != null) {
            macLen = encValue.mac.byteLength;
        }

        const encBytes = new Uint8Array(1 + encValue.iv.byteLength + macLen + encValue.ct.byteLength);
        encBytes.set([encValue.key.encType]);
        encBytes.set(new Uint8Array(encValue.iv), 1);
        if (encValue.mac != null) {
            encBytes.set(new Uint8Array(encValue.mac), 1 + encValue.iv.byteLength);
        }

        encBytes.set(new Uint8Array(encValue.ct), 1 + encValue.iv.byteLength + macLen);
        return encBytes.buffer;
    }

    async decrypt(cipherString: CipherString, key?: SymmetricCryptoKey): Promise<ArrayBuffer> {
        const iv = Utils.fromB64ToArray(cipherString.initializationVector).buffer;
        const ct = Utils.fromB64ToArray(cipherString.cipherText).buffer;
        const mac = cipherString.mac ? Utils.fromB64ToArray(cipherString.mac).buffer : null;
        const decipher = await this.aesDecrypt(cipherString.encryptionType, ct, iv, mac, key);
        if (decipher == null) {
            return null;
        }

        return decipher;
    }

    async decryptToUtf8(cipherString: CipherString, key?: SymmetricCryptoKey): Promise<string> {
        const decipher = await this.decrypt(cipherString, key);
        return Utils.fromBufferToUtf8(decipher);
    }

    async decryptFromBytes(encBuf: ArrayBuffer, key: SymmetricCryptoKey): Promise<ArrayBuffer> {
        if (encBuf == null) {
            throw new Error('no encBuf.');
        }

        const encBytes = new Uint8Array(encBuf);
        const encType = encBytes[0];
        let ctBytes: Uint8Array = null;
        let ivBytes: Uint8Array = null;
        let macBytes: Uint8Array = null;

        switch (encType) {
            case EncryptionType.AesCbc128_HmacSha256_B64:
            case EncryptionType.AesCbc256_HmacSha256_B64:
                if (encBytes.length <= 49) { // 1 + 16 + 32 + ctLength
                    return null;
                }

                ivBytes = encBytes.slice(1, 17);
                macBytes = encBytes.slice(17, 49);
                ctBytes = encBytes.slice(49);
                break;
            case EncryptionType.AesCbc256_B64:
                if (encBytes.length <= 17) { // 1 + 16 + ctLength
                    return null;
                }

                ivBytes = encBytes.slice(1, 17);
                ctBytes = encBytes.slice(17);
                break;
            default:
                return null;
        }

        return await this.aesDecryptLarge(encType, ctBytes.buffer, ivBytes.buffer,
            macBytes != null ? macBytes.buffer : null, key);
    }

    async sha1(password: string): Promise<string> {
        const hash = await this.cryptoFunctionService.hash(password, 'sha1');
        return Utils.fromBufferToHex(hash);
    }

    // Helpers

    private async aesEncrypt(plainValue: ArrayBuffer, key: SymmetricCryptoKey): Promise<EncryptedObject> {
        const obj = new EncryptedObject();
        obj.key = await this.getKeyForEncryption(key);
        obj.iv = await this.cryptoFunctionService.randomBytes(16);
        obj.ct = await this.cryptoFunctionService.aesEncrypt(plainValue, obj.iv, obj.key.encKey);

        if (obj.key.macKey != null) {
            const macData = new Uint8Array(obj.iv.byteLength + obj.ct.byteLength);
            macData.set(new Uint8Array(obj.iv), 0);
            macData.set(new Uint8Array(obj.ct), obj.iv.byteLength);
            obj.mac = await this.cryptoFunctionService.hmac(macData.buffer, obj.key.macKey, 'sha256');
        }

        return obj;
    }

    private async aesDecrypt(encType: EncryptionType, ct: ArrayBuffer, iv: ArrayBuffer, mac: ArrayBuffer,
        key: SymmetricCryptoKey): Promise<ArrayBuffer> {
        const keyForEnc = await this.getKeyForEncryption(key);
        const theKey = this.resolveLegacyKey(encType, keyForEnc);

        if (theKey.macKey != null && mac == null) {
            // tslint:disable-next-line
            console.error('mac required.');
            return null;
        }

        if (encType !== theKey.encType) {
            // tslint:disable-next-line
            console.error('encType unavailable.');
            return null;
        }

        if (theKey.macKey != null && mac != null) {
            const macData = new Uint8Array(iv.byteLength + ct.byteLength);
            macData.set(new Uint8Array(iv), 0);
            macData.set(new Uint8Array(ct), iv.byteLength);
            const computedMac = await this.cryptoFunctionService.hmac(new Uint8Array(iv).buffer,
                theKey.macKey, 'sha256');
            if (!this.macsEqual(computedMac, mac)) {
                // tslint:disable-next-line
                console.error('mac failed.');
                return null;
            }
        }

        return this.cryptoFunctionService.aesDecryptSmall(ct, iv, theKey.encKey);
    }

    private async aesDecryptLarge(encType: EncryptionType, ct: ArrayBuffer, iv: ArrayBuffer,
        mac: ArrayBuffer, key: SymmetricCryptoKey): Promise<ArrayBuffer> {
        const theKey = await this.getKeyForEncryption(key);
        if (theKey.macKey == null || mac == null) {
            return null;
        }

        const macData = new Uint8Array(iv.byteLength + ct.byteLength);
        macData.set(new Uint8Array(iv), 0);
        macData.set(new Uint8Array(ct), iv.byteLength);
        const computedMac = await this.cryptoFunctionService.hmac(new Uint8Array(iv).buffer,
            theKey.macKey, 'sha256');
        if (computedMac === null) {
            return null;
        }

        const macsMatch = await this.macsEqual(mac, computedMac);
        if (macsMatch === false) {
            // tslint:disable-next-line
            console.error('mac failed.');
            return null;
        }

        return await this.cryptoFunctionService.aesDecryptLarge(ct, iv, theKey.encKey);
    }

    private async rsaDecrypt(encValue: string): Promise<ArrayBuffer> {
        const headerPieces = encValue.split('.');
        let encType: EncryptionType = null;
        let encPieces: string[];

        if (headerPieces.length === 1) {
            encType = EncryptionType.Rsa2048_OaepSha256_B64;
            encPieces = [headerPieces[0]];
        } else if (headerPieces.length === 2) {
            try {
                encType = parseInt(headerPieces[0], null);
                encPieces = headerPieces[1].split('|');
            } catch (e) { }
        }

        switch (encType) {
            case EncryptionType.Rsa2048_OaepSha256_B64:
            case EncryptionType.Rsa2048_OaepSha1_B64:
                if (encPieces.length !== 1) {
                    throw new Error('Invalid cipher format.');
                }
                break;
            case EncryptionType.Rsa2048_OaepSha256_HmacSha256_B64:
            case EncryptionType.Rsa2048_OaepSha1_HmacSha256_B64:
                if (encPieces.length !== 2) {
                    throw new Error('Invalid cipher format.');
                }
                break;
            default:
                throw new Error('encType unavailable.');
        }

        if (encPieces == null || encPieces.length <= 0) {
            throw new Error('encPieces unavailable.');
        }

        const ct = Utils.fromB64ToArray(encPieces[0]).buffer;
        const key = await this.getEncKey();
        if (key != null && key.macKey != null && encPieces.length > 1) {
            const mac = Utils.fromB64ToArray(encPieces[1]).buffer;
            const computedMac = await this.cryptoFunctionService.hmac(ct, key.macKey, 'sha256');
            const macsEqual = await this.macsEqual(mac, computedMac);
            if (!macsEqual) {
                throw new Error('MAC failed.');
            }
        }

        const privateKey = await this.getPrivateKey();
        if (privateKey == null) {
            throw new Error('No private key.');
        }

        let alg: 'sha1' | 'sha256' = 'sha1';
        switch (encType) {
            case EncryptionType.Rsa2048_OaepSha256_B64:
            case EncryptionType.Rsa2048_OaepSha256_HmacSha256_B64:
                alg = 'sha256';
                break;
            case EncryptionType.Rsa2048_OaepSha1_B64:
            case EncryptionType.Rsa2048_OaepSha1_HmacSha256_B64:
                break;
            default:
                throw new Error('encType unavailable.');
        }

        return this.cryptoFunctionService.rsaDecrypt(ct, privateKey, alg);
    }

    // Safely compare two MACs in a way that protects against timing attacks (Double HMAC Verification).
    // ref: https://www.nccgroup.trust/us/about-us/newsroom-and-events/blog/2011/february/double-hmac-verification/
    // ref: https://paragonie.com/blog/2015/11/preventing-timing-attacks-on-string-comparison-with-double-hmac-strategy
    private async macsEqual(mac1: ArrayBuffer, mac2: ArrayBuffer): Promise<boolean> {
        const key = await this.cryptoFunctionService.randomBytes(32);
        const newMac1 = await this.cryptoFunctionService.hmac(mac1, key, 'sha256');
        const newMac2 = await this.cryptoFunctionService.hmac(mac2, key, 'sha256');
        if (newMac1.byteLength !== newMac2.byteLength) {
            return false;
        }

        const arr1 = new Uint8Array(newMac1);
        const arr2 = new Uint8Array(newMac2);
        for (let i = 0; i < arr2.length; i++) {
            if (arr1[i] !== arr2[i]) {
                return false;
            }
        }

        return true;
    }

    private async getKeyForEncryption(key?: SymmetricCryptoKey): Promise<SymmetricCryptoKey> {
        if (key != null) {
            return key;
        }

        const encKey = await this.getEncKey();
        if (encKey != null) {
            return encKey;
        }

        return await this.getKey();
    }

    private resolveLegacyKey(encType: EncryptionType, key: SymmetricCryptoKey): SymmetricCryptoKey {
        if (encType === EncryptionType.AesCbc128_HmacSha256_B64 &&
            key.encType === EncryptionType.AesCbc256_B64) {
            // Old encrypt-then-mac scheme, make a new key
            if (this.legacyEtmKey == null) {
                this.legacyEtmKey = new SymmetricCryptoKey(key.key, EncryptionType.AesCbc128_HmacSha256_B64);
            }
            return this.legacyEtmKey;
        }

        return key;
    }
}
