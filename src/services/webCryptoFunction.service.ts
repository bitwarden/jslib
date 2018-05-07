import * as forge from 'node-forge';

import { CryptoFunctionService } from '../abstractions/cryptoFunction.service';
import { PlatformUtilsService } from '../abstractions/platformUtils.service';

import { Utils } from '../misc/utils';

import { SymmetricCryptoKey } from '../models/domain';
import { DecryptParameters } from '../models/domain/decryptParameters';

export class WebCryptoFunctionService implements CryptoFunctionService {
    private crypto: Crypto;
    private subtle: SubtleCrypto;
    private isEdge: boolean;

    constructor(private win: Window, private platformUtilsService: PlatformUtilsService) {
        this.crypto = win.crypto;
        this.subtle = win.crypto.subtle;
        this.isEdge = platformUtilsService.isEdge();
    }

    async pbkdf2(password: string | ArrayBuffer, salt: string | ArrayBuffer, algorithm: 'sha256' | 'sha512',
        iterations: number): Promise<ArrayBuffer> {
        if (this.isEdge) {
            const forgeLen = algorithm === 'sha256' ? 32 : 64;
            const passwordBytes = this.toByteString(password);
            const saltBytes = this.toByteString(salt);
            const derivedKeyBytes = (forge as any).pbkdf2(passwordBytes, saltBytes, iterations, forgeLen, algorithm);
            return Utils.fromByteStringToArray(derivedKeyBytes).buffer;
        }

        const wcLen = algorithm === 'sha256' ? 256 : 512;
        const passwordBuf = this.toBuf(password);
        const saltBuf = this.toBuf(salt);

        const pbkdf2Params: Pbkdf2Params = {
            name: 'PBKDF2',
            salt: saltBuf,
            iterations: iterations,
            hash: { name: this.toWebCryptoAlgorithm(algorithm) },
        };

        const impKey = await this.subtle.importKey('raw', passwordBuf, { name: 'PBKDF2' }, false, ['deriveBits']);
        return await this.subtle.deriveBits(pbkdf2Params, impKey, wcLen);
    }

    async hash(value: string | ArrayBuffer, algorithm: 'sha1' | 'sha256' | 'sha512'): Promise<ArrayBuffer> {
        if (this.isEdge && algorithm === 'sha1') {
            const md = forge.md.sha1.create();
            const valueBytes = this.toByteString(value);
            md.update(valueBytes, 'raw');
            return Utils.fromByteStringToArray(md.digest().data).buffer;
        }

        const valueBuf = this.toBuf(value);
        return await this.subtle.digest({ name: this.toWebCryptoAlgorithm(algorithm) }, valueBuf);
    }

    async hmac(value: ArrayBuffer, key: ArrayBuffer, algorithm: 'sha1' | 'sha256' | 'sha512'): Promise<ArrayBuffer> {
        const signingAlgorithm = {
            name: 'HMAC',
            hash: { name: this.toWebCryptoAlgorithm(algorithm) },
        };

        const impKey = await this.subtle.importKey('raw', key, signingAlgorithm, false, ['sign']);
        return await this.subtle.sign(signingAlgorithm, impKey, value);
    }

    // Safely compare two values in a way that protects against timing attacks (Double HMAC Verification).
    // ref: https://www.nccgroup.trust/us/about-us/newsroom-and-events/blog/2011/february/double-hmac-verification/
    // ref: https://paragonie.com/blog/2015/11/preventing-timing-attacks-on-string-comparison-with-double-hmac-strategy
    async timeSafeEqual(a: ArrayBuffer, b: ArrayBuffer): Promise<boolean> {
        const macKey = await this.randomBytes(32);
        const signingAlgorithm = {
            name: 'HMAC',
            hash: { name: 'SHA-256' },
        };
        const impKey = await this.subtle.importKey('raw', macKey, signingAlgorithm, false, ['sign']);
        const mac1 = await this.subtle.sign(signingAlgorithm, impKey, a);
        const mac2 = await this.subtle.sign(signingAlgorithm, impKey, b);

        if (mac1.byteLength !== mac2.byteLength) {
            return false;
        }

        const arr1 = new Uint8Array(mac1);
        const arr2 = new Uint8Array(mac2);
        for (let i = 0; i < arr2.length; i++) {
            if (arr1[i] !== arr2[i]) {
                return false;
            }
        }

        return true;
    }

    hmacFast(value: string, key: string, algorithm: 'sha1' | 'sha256' | 'sha512'): Promise<string> {
        const hmac = (forge as any).hmac.create();
        hmac.start(algorithm, key);
        hmac.update(value);
        const bytes = hmac.digest().getBytes();
        return Promise.resolve(bytes);
    }

    async timeSafeEqualFast(a: string, b: string): Promise<boolean> {
        const rand = await this.randomBytes(32);
        const bytes = new Uint32Array(rand);
        const buffer = forge.util.createBuffer();
        for (let i = 0; i < bytes.length; i++) {
            buffer.putInt32(bytes[i]);
        }
        const macKey = buffer.getBytes();

        const hmac = (forge as any).hmac.create();
        hmac.start('sha256', macKey);
        hmac.update(a);
        const mac1 = hmac.digest().getBytes();

        hmac.start(null, null);
        hmac.update(b);
        const mac2 = hmac.digest().getBytes();

        const equals = mac1 === mac2;
        return equals;
    }

    async aesEncrypt(data: ArrayBuffer, iv: ArrayBuffer, key: ArrayBuffer): Promise<ArrayBuffer> {
        const impKey = await this.subtle.importKey('raw', key, { name: 'AES-CBC' }, false, ['encrypt']);
        return await this.subtle.encrypt({ name: 'AES-CBC', iv: iv }, impKey, data);
    }

    aesDecryptFastParameters(data: string, iv: string, mac: string, key: SymmetricCryptoKey):
        DecryptParameters<string> {
        const p = new DecryptParameters<string>();
        p.encKey = forge.util.decode64(key.encKeyB64);
        p.data = forge.util.decode64(data);
        p.iv = forge.util.decode64(iv);
        p.macData = p.iv + p.data;
        if (key.macKeyB64 != null) {
            p.macKey = forge.util.decode64(key.macKeyB64);
        }
        if (mac != null) {
            p.mac = forge.util.decode64(mac);
        }
        return p;
    }

    aesDecryptFast(parameters: DecryptParameters<string>): Promise<string> {
        const dataBuffer = (forge as any).util.createBuffer(parameters.data);
        const decipher = (forge as any).cipher.createDecipher('AES-CBC', parameters.encKey);
        decipher.start({ iv: parameters.iv });
        decipher.update(dataBuffer);
        decipher.finish();
        const val = decipher.output.toString('utf8');
        return Promise.resolve(val);
    }

    async aesDecryptLarge(data: ArrayBuffer, iv: ArrayBuffer, key: ArrayBuffer): Promise<ArrayBuffer> {
        const impKey = await this.subtle.importKey('raw', key, { name: 'AES-CBC' }, false, ['decrypt']);
        return await this.subtle.decrypt({ name: 'AES-CBC', iv: iv }, impKey, data);
    }

    async rsaEncrypt(data: ArrayBuffer, publicKey: ArrayBuffer, algorithm: 'sha1' | 'sha256'): Promise<ArrayBuffer> {
        // Note: Edge browser requires that we specify name and hash for both key import and decrypt.
        // We cannot use the proper types here.
        const rsaParams = {
            name: 'RSA-OAEP',
            hash: { name: this.toWebCryptoAlgorithm(algorithm) },
        };
        const impKey = await this.subtle.importKey('spki', publicKey, rsaParams, false, ['encrypt']);
        return await this.subtle.encrypt(rsaParams, impKey, data);
    }

    async rsaDecrypt(data: ArrayBuffer, privateKey: ArrayBuffer, algorithm: 'sha1' | 'sha256'): Promise<ArrayBuffer> {
        // Note: Edge browser requires that we specify name and hash for both key import and decrypt.
        // We cannot use the proper types here.
        const rsaParams = {
            name: 'RSA-OAEP',
            hash: { name: this.toWebCryptoAlgorithm(algorithm) },
        };
        const impKey = await this.subtle.importKey('pkcs8', privateKey, rsaParams, false, ['decrypt']);
        return await this.subtle.decrypt(rsaParams, impKey, data);
    }

    randomBytes(length: number): Promise<ArrayBuffer> {
        const arr = new Uint8Array(length);
        this.crypto.getRandomValues(arr);
        return Promise.resolve(arr.buffer);
    }

    private toBuf(value: string | ArrayBuffer): ArrayBuffer {
        let buf: ArrayBuffer;
        if (typeof (value) === 'string') {
            buf = Utils.fromUtf8ToArray(value).buffer;
        } else {
            buf = value;
        }
        return buf;
    }

    private toByteString(value: string | ArrayBuffer): string {
        let bytes: string;
        if (typeof (value) === 'string') {
            bytes = forge.util.encodeUtf8(value);
        } else {
            bytes = Utils.fromBufferToByteString(value);
        }
        return bytes;
    }

    private toWebCryptoAlgorithm(algorithm: 'sha1' | 'sha256' | 'sha512'): string {
        return algorithm === 'sha1' ? 'SHA-1' : algorithm === 'sha256' ? 'SHA-256' : 'SHA-512';
    }
}
