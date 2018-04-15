import * as forge from 'node-forge';

import { CryptoFunctionService } from '../abstractions/cryptoFunction.service';
import { PlatformUtilsService } from '../abstractions/platformUtils.service';

export class WebCryptoFunctionService implements CryptoFunctionService {
    private crypto: Crypto;
    private subtle: SubtleCrypto;

    constructor(private win: Window, private platformUtilsService: PlatformUtilsService) {
        this.crypto = win.crypto;
        this.subtle = win.crypto.subtle;
    }

    async pbkdf2(password: Buffer, salt: Buffer, iterations: number, length: number): Promise<ArrayBuffer> {
        const importedKey = await this.subtle.importKey('raw', password, { name: 'PBKDF2' },
            false, ['deriveKey', 'deriveBits']);

        const alg: Pbkdf2Params = {
            name: 'PBKDF2',
            salt: salt,
            iterations: iterations,
            hash: { name: 'SHA-256' },
        };

        const keyType: AesDerivedKeyParams = {
            name: 'AES-CBC',
            length: length,
        };

        const derivedKey = await this.subtle.deriveKey(alg, importedKey, keyType, true, ['encrypt', 'decrypt']);
        return await this.subtle.exportKey('raw', derivedKey);
    }

    async sha1(value: Buffer): Promise<ArrayBuffer> {
        if (this.platformUtilsService.isEdge()) {
            return new Uint8Array([1]).buffer; // TODO: sha1 with forge
        } else {
            return await this.subtle.digest({ name: 'SHA-1' }, value);
        }
    }
}
