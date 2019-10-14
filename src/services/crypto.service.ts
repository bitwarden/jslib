import * as bigInt from 'big-integer';

import { EncryptionType } from '../enums/encryptionType';
import { KdfType } from '../enums/kdfType';

import { CipherString } from '../models/domain/cipherString';
import { EncryptedObject } from '../models/domain/encryptedObject';
import { SymmetricCryptoKey } from '../models/domain/symmetricCryptoKey';
import { ProfileOrganizationResponse } from '../models/response/profileOrganizationResponse';

import { CryptoService as CryptoServiceAbstraction } from '../abstractions/crypto.service';
import { CryptoFunctionService } from '../abstractions/cryptoFunction.service';
import { StorageService } from '../abstractions/storage.service';

import { ConstantsService } from './constants.service';

import { sequentialize } from '../misc/sequentialize';
import { Utils } from '../misc/utils';
import { EEFLongWordList } from '../misc/wordlist';

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
    private publicKey: ArrayBuffer;
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

        this.orgKeys = null;
        return this.storageService.save(Keys.encOrgKeys, orgKeys);
    }

    async getKey(): Promise<SymmetricCryptoKey> {
        if (this.key != null) {
            return this.key;
        }

        const key = await this.secureStorageService.get<string>(Keys.key);
        if (key != null) {
            this.key = new SymmetricCryptoKey(Utils.fromB64ToArray(key).buffer);
        }

        return key == null ? null : this.key;
    }

    async getKeyHash(): Promise<string> {
        if (this.keyHash != null) {
            return this.keyHash;
        }

        const keyHash = await this.storageService.get<string>(Keys.keyHash);
        if (keyHash != null) {
            this.keyHash = keyHash;
        }

        return keyHash == null ? null : this.keyHash;
    }

    @sequentialize(() => 'getEncKey')
    async getEncKey(key: SymmetricCryptoKey = null): Promise<SymmetricCryptoKey> {
        if (this.encKey != null) {
            return this.encKey;
        }

        const encKey = await this.storageService.get<string>(Keys.encKey);
        if (encKey == null) {
            return null;
        }

        if (key == null) {
            key = await this.getKey();
        }
        if (key == null) {
            return null;
        }

        let decEncKey: ArrayBuffer;
        const encKeyCipher = new CipherString(encKey);
        if (encKeyCipher.encryptionType === EncryptionType.AesCbc256_B64) {
            decEncKey = await this.decryptToBytes(encKeyCipher, key);
        } else if (encKeyCipher.encryptionType === EncryptionType.AesCbc256_HmacSha256_B64) {
            const newKey = await this.stretchKey(key);
            decEncKey = await this.decryptToBytes(encKeyCipher, newKey);
        } else {
            throw new Error('Unsupported encKey type.');
        }

        if (decEncKey == null) {
            return null;
        }
        this.encKey = new SymmetricCryptoKey(decEncKey);
        return this.encKey;
    }

    async getPublicKey(): Promise<ArrayBuffer> {
        if (this.publicKey != null) {
            return this.publicKey;
        }

        const privateKey = await this.getPrivateKey();
        if (privateKey == null) {
            return null;
        }

        this.publicKey = await this.cryptoFunctionService.rsaExtractPublicKey(privateKey);
        return this.publicKey;
    }

    async getPrivateKey(): Promise<ArrayBuffer> {
        if (this.privateKey != null) {
            return this.privateKey;
        }

        const encPrivateKey = await this.storageService.get<string>(Keys.encPrivateKey);
        if (encPrivateKey == null) {
            return null;
        }

        this.privateKey = await this.decryptToBytes(new CipherString(encPrivateKey), null);
        return this.privateKey;
    }

    async getFingerprint(userId: string, publicKey?: ArrayBuffer): Promise<string[]> {
        if (publicKey == null) {
            publicKey = await this.getPublicKey();
        }
        if (publicKey === null) {
            throw new Error('No public key available.');
        }
        const keyFingerprint = await this.cryptoFunctionService.hash(publicKey, 'sha256');
        const userFingerprint = await this.hkdfExpand(keyFingerprint, Utils.fromUtf8ToArray(userId), 32);
        return this.hashPhrase(userFingerprint.buffer);
    }

    @sequentialize(() => 'getOrgKeys')
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

    async hasKey(): Promise<boolean> {
        return (await this.getKey()) != null;
    }

    async hasEncKey(): Promise<boolean> {
        const encKey = await this.storageService.get<string>(Keys.encKey);
        return encKey != null;
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

    clearKeyPair(memoryOnly?: boolean): Promise<any> {
        this.privateKey = null;
        this.publicKey = null;
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

    clearPinProtectedKey(): Promise<any> {
        return this.storageService.remove(ConstantsService.pinProtectedKey);
    }

    clearKeys(): Promise<any> {
        return Promise.all([
            this.clearKey(),
            this.clearKeyHash(),
            this.clearOrgKeys(),
            this.clearEncKey(),
            this.clearKeyPair(),
            this.clearPinProtectedKey(),
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

    async makeKey(password: string, salt: string, kdf: KdfType, kdfIterations: number):
        Promise<SymmetricCryptoKey> {
        let key: ArrayBuffer = null;
        if (kdf == null || kdf === KdfType.PBKDF2_SHA256) {
            if (kdfIterations == null) {
                kdfIterations = 5000;
            } else if (kdfIterations < 5000) {
                throw new Error('PBKDF2 iteration minimum is 5000.');
            }
            key = await this.cryptoFunctionService.pbkdf2(password, salt, 'sha256', kdfIterations);
        } else {
            throw new Error('Unknown Kdf.');
        }
        return new SymmetricCryptoKey(key);
    }

    async makeKeyFromPin(pin: string, salt: string, kdf: KdfType, kdfIterations: number,
        protectedKeyCs: CipherString = null):
        Promise<SymmetricCryptoKey> {
        if (protectedKeyCs == null) {
            const pinProtectedKey = await this.storageService.get<string>(ConstantsService.pinProtectedKey);
            if (pinProtectedKey == null) {
                throw new Error('No PIN protected key found.');
            }
            protectedKeyCs = new CipherString(pinProtectedKey);
        }
        const pinKey = await this.makePinKey(pin, salt, kdf, kdfIterations);
        const decKey = await this.decryptToBytes(protectedKeyCs, pinKey);
        return new SymmetricCryptoKey(decKey);
    }

    async makeShareKey(): Promise<[CipherString, SymmetricCryptoKey]> {
        const shareKey = await this.cryptoFunctionService.randomBytes(64);
        const publicKey = await this.getPublicKey();
        const encShareKey = await this.rsaEncrypt(shareKey, publicKey);
        return [encShareKey, new SymmetricCryptoKey(shareKey)];
    }

    async makeKeyPair(key?: SymmetricCryptoKey): Promise<[string, CipherString]> {
        const keyPair = await this.cryptoFunctionService.rsaGenerateKeyPair(2048);
        const publicB64 = Utils.fromBufferToB64(keyPair[0]);
        const privateEnc = await this.encrypt(keyPair[1], key);
        return [publicB64, privateEnc];
    }

    async makePinKey(pin: string, salt: string, kdf: KdfType, kdfIterations: number): Promise<SymmetricCryptoKey> {
        const pinKey = await this.makeKey(pin, salt, kdf, kdfIterations);
        return await this.stretchKey(pinKey);
    }

    async hashPassword(password: string, key: SymmetricCryptoKey): Promise<string> {
        if (key == null) {
            key = await this.getKey();
        }
        if (password == null || key == null) {
            throw new Error('Invalid parameters.');
        }

        const hash = await this.cryptoFunctionService.pbkdf2(key.key, password, 'sha256', 1);
        return Utils.fromBufferToB64(hash);
    }

    async makeEncKey(key: SymmetricCryptoKey): Promise<[SymmetricCryptoKey, CipherString]> {
        const theKey = await this.getKeyForEncryption(key);
        const encKey = await this.cryptoFunctionService.randomBytes(64);
        return this.buildEncKey(theKey, encKey);
    }

    async remakeEncKey(key: SymmetricCryptoKey): Promise<[SymmetricCryptoKey, CipherString]> {
        const encKey = await this.getEncKey();
        return this.buildEncKey(key, encKey.key);
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
        const data = Utils.fromBufferToB64(encObj.data);
        const mac = encObj.mac != null ? Utils.fromBufferToB64(encObj.mac) : null;
        return new CipherString(encObj.key.encType, data, iv, mac);
    }

    async encryptToBytes(plainValue: ArrayBuffer, key?: SymmetricCryptoKey): Promise<ArrayBuffer> {
        const encValue = await this.aesEncrypt(plainValue, key);
        let macLen = 0;
        if (encValue.mac != null) {
            macLen = encValue.mac.byteLength;
        }

        const encBytes = new Uint8Array(1 + encValue.iv.byteLength + macLen + encValue.data.byteLength);
        encBytes.set([encValue.key.encType]);
        encBytes.set(new Uint8Array(encValue.iv), 1);
        if (encValue.mac != null) {
            encBytes.set(new Uint8Array(encValue.mac), 1 + encValue.iv.byteLength);
        }

        encBytes.set(new Uint8Array(encValue.data), 1 + encValue.iv.byteLength + macLen);
        return encBytes.buffer;
    }

    async rsaEncrypt(data: ArrayBuffer, publicKey?: ArrayBuffer): Promise<CipherString> {
        if (publicKey == null) {
            publicKey = await this.getPublicKey();
        }
        if (publicKey == null) {
            throw new Error('Public key unavailable.');
        }

        const encBytes = await this.cryptoFunctionService.rsaEncrypt(data, publicKey, 'sha1');
        return new CipherString(EncryptionType.Rsa2048_OaepSha1_B64, Utils.fromBufferToB64(encBytes));
    }

    async decryptToBytes(cipherString: CipherString, key?: SymmetricCryptoKey): Promise<ArrayBuffer> {
        const iv = Utils.fromB64ToArray(cipherString.iv).buffer;
        const data = Utils.fromB64ToArray(cipherString.data).buffer;
        const mac = cipherString.mac ? Utils.fromB64ToArray(cipherString.mac).buffer : null;
        const decipher = await this.aesDecryptToBytes(cipherString.encryptionType, data, iv, mac, key);
        if (decipher == null) {
            return null;
        }

        return decipher;
    }

    async decryptToUtf8(cipherString: CipherString, key?: SymmetricCryptoKey): Promise<string> {
        return await this.aesDecryptToUtf8(cipherString.encryptionType, cipherString.data,
            cipherString.iv, cipherString.mac, key);
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

        return await this.aesDecryptToBytes(encType, ctBytes.buffer, ivBytes.buffer,
            macBytes != null ? macBytes.buffer : null, key);
    }

    // EFForg/OpenWireless
    // ref https://github.com/EFForg/OpenWireless/blob/master/app/js/diceware.js
    async randomNumber(min: number, max: number): Promise<number> {
        let rval = 0;
        const range = max - min + 1;
        const bitsNeeded = Math.ceil(Math.log2(range));
        if (bitsNeeded > 53) {
            throw new Error('We cannot generate numbers larger than 53 bits.');
        }

        const bytesNeeded = Math.ceil(bitsNeeded / 8);
        const mask = Math.pow(2, bitsNeeded) - 1;
        // 7776 -> (2^13 = 8192) -1 == 8191 or 0x00001111 11111111

        // Fill a byte array with N random numbers
        const byteArray = new Uint8Array(await this.cryptoFunctionService.randomBytes(bytesNeeded));

        let p = (bytesNeeded - 1) * 8;
        for (let i = 0; i < bytesNeeded; i++) {
            rval += byteArray[i] * Math.pow(2, p);
            p -= 8;
        }

        // Use & to apply the mask and reduce the number of recursive lookups
        // tslint:disable-next-line
        rval = rval & mask;

        if (rval >= range) {
            // Integer out of acceptable range
            return this.randomNumber(min, max);
        }

        // Return an integer that falls within the range
        return min + rval;
    }

    // Helpers

    private async aesEncrypt(data: ArrayBuffer, key: SymmetricCryptoKey): Promise<EncryptedObject> {
        const obj = new EncryptedObject();
        obj.key = await this.getKeyForEncryption(key);
        obj.iv = await this.cryptoFunctionService.randomBytes(16);
        obj.data = await this.cryptoFunctionService.aesEncrypt(data, obj.iv, obj.key.encKey);

        if (obj.key.macKey != null) {
            const macData = new Uint8Array(obj.iv.byteLength + obj.data.byteLength);
            macData.set(new Uint8Array(obj.iv), 0);
            macData.set(new Uint8Array(obj.data), obj.iv.byteLength);
            obj.mac = await this.cryptoFunctionService.hmac(macData.buffer, obj.key.macKey, 'sha256');
        }

        return obj;
    }

    private async aesDecryptToUtf8(encType: EncryptionType, data: string, iv: string, mac: string,
        key: SymmetricCryptoKey): Promise<string> {
        const keyForEnc = await this.getKeyForEncryption(key);
        const theKey = this.resolveLegacyKey(encType, keyForEnc);

        if (theKey.macKey != null && mac == null) {
            // tslint:disable-next-line
            console.error('mac required.');
            return null;
        }

        if (theKey.encType !== encType) {
            // tslint:disable-next-line
            console.error('encType unavailable.');
            return null;
        }

        const fastParams = this.cryptoFunctionService.aesDecryptFastParameters(data, iv, mac, theKey);
        if (fastParams.macKey != null && fastParams.mac != null) {
            const computedMac = await this.cryptoFunctionService.hmacFast(fastParams.macData,
                fastParams.macKey, 'sha256');
            const macsEqual = await this.cryptoFunctionService.compareFast(fastParams.mac, computedMac);
            if (!macsEqual) {
                // tslint:disable-next-line
                console.error('mac failed.');
                return null;
            }
        }

        return this.cryptoFunctionService.aesDecryptFast(fastParams);
    }

    private async aesDecryptToBytes(encType: EncryptionType, data: ArrayBuffer, iv: ArrayBuffer,
        mac: ArrayBuffer, key: SymmetricCryptoKey): Promise<ArrayBuffer> {
        const keyForEnc = await this.getKeyForEncryption(key);
        const theKey = this.resolveLegacyKey(encType, keyForEnc);

        if (theKey.macKey != null && mac == null) {
            return null;
        }

        if (theKey.encType !== encType) {
            return null;
        }

        if (theKey.macKey != null && mac != null) {
            const macData = new Uint8Array(iv.byteLength + data.byteLength);
            macData.set(new Uint8Array(iv), 0);
            macData.set(new Uint8Array(data), iv.byteLength);
            const computedMac = await this.cryptoFunctionService.hmac(macData.buffer, theKey.macKey, 'sha256');
            if (computedMac === null) {
                return null;
            }

            const macsMatch = await this.cryptoFunctionService.compare(mac, computedMac);
            if (!macsMatch) {
                // tslint:disable-next-line
                console.error('mac failed.');
                return null;
            }
        }

        return await this.cryptoFunctionService.aesDecrypt(data, iv, theKey.encKey);
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
            // HmacSha256 types are deprecated
            case EncryptionType.Rsa2048_OaepSha256_HmacSha256_B64:
            case EncryptionType.Rsa2048_OaepSha1_HmacSha256_B64:
                break;
            default:
                throw new Error('encType unavailable.');
        }

        if (encPieces == null || encPieces.length <= 0) {
            throw new Error('encPieces unavailable.');
        }

        const data = Utils.fromB64ToArray(encPieces[0]).buffer;
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

        return this.cryptoFunctionService.rsaDecrypt(data, privateKey, alg);
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

    private async stretchKey(key: SymmetricCryptoKey): Promise<SymmetricCryptoKey> {
        const newKey = new Uint8Array(64);
        newKey.set(await this.hkdfExpand(key.key, Utils.fromUtf8ToArray('enc'), 32));
        newKey.set(await this.hkdfExpand(key.key, Utils.fromUtf8ToArray('mac'), 32), 32);
        return new SymmetricCryptoKey(newKey.buffer);
    }

    // ref: https://tools.ietf.org/html/rfc5869
    private async hkdfExpand(prk: ArrayBuffer, info: Uint8Array, size: number) {
        const hashLen = 32; // sha256
        const okm = new Uint8Array(size);
        let previousT = new Uint8Array(0);
        const n = Math.ceil(size / hashLen);
        for (let i = 0; i < n; i++) {
            const t = new Uint8Array(previousT.length + info.length + 1);
            t.set(previousT);
            t.set(info, previousT.length);
            t.set([i + 1], t.length - 1);
            previousT = new Uint8Array(await this.cryptoFunctionService.hmac(t.buffer, prk, 'sha256'));
            okm.set(previousT, i * hashLen);
        }
        return okm;
    }

    private async hashPhrase(hash: ArrayBuffer, minimumEntropy: number = 64) {
        const entropyPerWord = Math.log(EEFLongWordList.length) / Math.log(2);
        let numWords = Math.ceil(minimumEntropy / entropyPerWord);

        const hashArr = Array.from(new Uint8Array(hash));
        const entropyAvailable = hashArr.length * 4;
        if (numWords * entropyPerWord > entropyAvailable) {
            throw new Error('Output entropy of hash function is too small');
        }

        const phrase: string[] = [];
        let hashNumber = bigInt.fromArray(hashArr, 256);
        while (numWords--) {
            const remainder = hashNumber.mod(EEFLongWordList.length);
            hashNumber = hashNumber.divide(EEFLongWordList.length);
            phrase.push(EEFLongWordList[remainder as any]);
        }
        return phrase;
    }

    private async buildEncKey(key: SymmetricCryptoKey, encKey: ArrayBuffer)
        : Promise<[SymmetricCryptoKey, CipherString]> {
        let encKeyEnc: CipherString = null;
        if (key.key.byteLength === 32) {
            const newKey = await this.stretchKey(key);
            encKeyEnc = await this.encrypt(encKey, newKey);
        } else if (key.key.byteLength === 64) {
            encKeyEnc = await this.encrypt(encKey, key);
        } else {
            throw new Error('Invalid key size.');
        }
        return [new SymmetricCryptoKey(encKey), encKeyEnc];
    }
}
