import * as forge from 'node-forge';

import { CryptoFunctionService } from '../abstractions/cryptoFunction.service';
import { PlatformUtilsService } from '../abstractions/platformUtils.service';

import { UtilsService } from '../services/utils.service';

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
            const len = algorithm === 'sha256' ? 32 : 64;
            const passwordBytes = this.toByteString(password);
            const saltBytes = this.toByteString(salt);
            const derivedKeyBytes = (forge as any).pbkdf2(passwordBytes, saltBytes, iterations, len, algorithm);
            return this.fromByteStringToBuf(derivedKeyBytes);
        }

        const len = algorithm === 'sha256' ? 256 : 512;
        const passwordBuf = this.toBuf(password);
        const saltBuf = this.toBuf(salt);

        const alg: Pbkdf2Params = {
            name: 'PBKDF2',
            salt: saltBuf,
            iterations: iterations,
            hash: { name: this.toWebCryptoAlgorithm(algorithm) },
        };

        const impKey = await this.subtle.importKey('raw', passwordBuf, { name: 'PBKDF2' }, false, ['deriveBits']);
        return await window.crypto.subtle.deriveBits(alg, impKey, len);
    }

    async hash(value: string | ArrayBuffer, algorithm: 'sha1' | 'sha256' | 'sha512'): Promise<ArrayBuffer> {
        if (this.isEdge) {
            let md: forge.md.MessageDigest;
            if (algorithm === 'sha1') {
                md = forge.md.sha1.create();
            } else if (algorithm === 'sha256') {
                md = forge.md.sha256.create();
            } else {
                md = (forge as any).md.sha512.create();
            }

            const valueBytes = this.toByteString(value);
            md.update(valueBytes, 'raw');
            return this.fromByteStringToBuf(md.digest().data);
        }

        const valueBuf = this.toBuf(value);
        return await this.subtle.digest({ name: this.toWebCryptoAlgorithm(algorithm) }, valueBuf);
    }

    async hmac(value: ArrayBuffer, key: ArrayBuffer, algorithm: 'sha1' | 'sha256' | 'sha512'): Promise<ArrayBuffer> {
        if (this.isEdge) {
            const valueBytes = this.toByteString(value);
            const keyBytes = this.toByteString(key);
            const hmac = (forge as any).hmac.create();
            hmac.start(algorithm, keyBytes);
            hmac.update(valueBytes);
            return this.fromByteStringToBuf(hmac.digest().getBytes());
        }

        const signingAlgorithm = {
            name: 'HMAC',
            hash: { name: this.toWebCryptoAlgorithm(algorithm) },
        };

        const impKey = await this.subtle.importKey('raw', key, signingAlgorithm, false, ['sign']);
        return await this.subtle.sign(signingAlgorithm, impKey, value);
    }

    private toBuf(value: string | ArrayBuffer): ArrayBuffer {
        let buf: ArrayBuffer;
        if (typeof (value) === 'string') {
            buf = UtilsService.fromUtf8ToArray(value).buffer;
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
            bytes = String.fromCharCode.apply(null, new Uint8Array(value));
        }
        return bytes;
    }

    private fromByteStringToBuf(byteString: string): ArrayBuffer {
        const arr = new Uint8Array(byteString.length);
        for (let i = 0; i < byteString.length; i++) {
            arr[i] = byteString.charCodeAt(i);
        }
        return arr.buffer;
    }

    private toWebCryptoAlgorithm(algorithm: 'sha1' | 'sha256' | 'sha512'): string {
        return algorithm === 'sha1' ? 'SHA-1' : algorithm === 'sha256' ? 'SHA-256' : 'SHA-512';
    }
}
