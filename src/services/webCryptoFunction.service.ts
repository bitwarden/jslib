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
            // TODO
            return new Uint8Array([]).buffer;
        }

        let passwordBuf: ArrayBuffer;
        if (typeof (password) === 'string') {
            passwordBuf = UtilsService.fromUtf8ToArray(password).buffer;
        } else {
            passwordBuf = password;
        }

        let saltBuf: ArrayBuffer;
        if (typeof (salt) === 'string') {
            saltBuf = UtilsService.fromUtf8ToArray(salt).buffer;
        } else {
            saltBuf = salt;
        }

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

    async hash(value: string | ArrayBuffer, algorithm: 'sha1' | 'sha256'): Promise<ArrayBuffer> {
        if (this.platformUtilsService.isEdge()) {
            // TODO
            return new Uint8Array([]).buffer;
        }

        let valueBuf: ArrayBuffer;
        if (typeof (value) === 'string') {
            valueBuf = UtilsService.fromUtf8ToArray(value).buffer;
        } else {
            valueBuf = value;
        }

        return await this.subtle.digest({
            name: algorithm === 'sha256' ? 'SHA-256' : 'SHA-1'
        }, valueBuf);
    }
}
