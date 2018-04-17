import * as forge from 'node-forge';

import { CryptoFunctionService } from '../abstractions/cryptoFunction.service';
import { PlatformUtilsService } from '../abstractions/platformUtils.service';

import { UtilsService } from '../services/utils.service';

export class WebCryptoFunctionService implements CryptoFunctionService {
    private crypto: Crypto;
    private subtle: SubtleCrypto;

    constructor(private win: Window, private platformUtilsService: PlatformUtilsService) {
        this.crypto = win.crypto;
        this.subtle = win.crypto.subtle;
    }

    async pbkdf2(password: string | ArrayBuffer, salt: string | ArrayBuffer, algorithm: 'sha256' | 'sha512',
        iterations: number, length: number): Promise<ArrayBuffer> {
        if (this.platformUtilsService.isEdge()) {
            const passwordBytes = this.toForgeBytes(password);
            const saltBytes = this.toForgeBytes(salt);
            const derivedKeyBytes = (forge as any).pbkdf2(passwordBytes, saltBytes, iterations, length / 8, algorithm);
            return this.fromForgeBytesToBuf(derivedKeyBytes);
        }

        const passwordBuf = this.toBuf(password);
        const saltBuf = this.toBuf(salt);

        const importedKey = await this.subtle.importKey('raw', passwordBuf, { name: 'PBKDF2' },
            false, ['deriveKey', 'deriveBits']);

        const alg: Pbkdf2Params = {
            name: 'PBKDF2',
            salt: saltBuf,
            iterations: iterations,
            hash: { name: algorithm === 'sha256' ? 'SHA-256' : 'SHA-512' },
        };

        const keyType: AesDerivedKeyParams = {
            name: 'AES-CBC',
            length: length,
        };

        const derivedKey = await this.subtle.deriveKey(alg, importedKey, keyType, true, ['encrypt', 'decrypt']);
        return await this.subtle.exportKey('raw', derivedKey);
    }

    async hash(value: string | ArrayBuffer, algorithm: 'sha1' | 'sha256' | 'sha512'): Promise<ArrayBuffer> {
        if (this.platformUtilsService.isEdge()) {
            let md: forge.md.MessageDigest;
            if (algorithm === 'sha1') {
                md = forge.md.sha1.create();
            } else if (algorithm === 'sha256') {
                md = forge.md.sha256.create();
            } else {
                md = (forge as any).md.sha512.create();
            }

            const valueBytes = this.toForgeBytes(value);
            md.update(valueBytes, 'raw');
            return this.fromForgeBytesToBuf(md.digest().data);
        }

        const valueBuf = this.toBuf(value);
        return await this.subtle.digest({
            name: algorithm === 'sha1' ? 'SHA-1' : algorithm === 'sha256' ? 'SHA-256' : 'SHA-512'
        }, valueBuf);
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

    private toForgeBytes(value: string | ArrayBuffer): string {
        let bytes: string;
        if (typeof (value) === 'string') {
            bytes = forge.util.encodeUtf8(value);
        } else {
            const value64 = UtilsService.fromBufferToB64(value);
            bytes = forge.util.encode64(value64);
        }
        return bytes;
    }

    private fromForgeBytesToBuf(byteString: string): ArrayBuffer {
        const b64 = forge.util.decode64(byteString);
        return UtilsService.fromB64ToArray(b64).buffer;
    }
}
