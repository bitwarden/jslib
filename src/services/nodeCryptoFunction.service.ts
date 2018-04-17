import * as crypto from 'crypto';

import { CryptoFunctionService } from '../abstractions/cryptoFunction.service';

export class NodeCryptoFunctionService implements CryptoFunctionService {
    async pbkdf2(password: string | ArrayBuffer, salt: string | ArrayBuffer, algorithm: 'sha256' | 'sha512',
        iterations: number, length: number): Promise<ArrayBuffer> {
        const nodePassword = this.toNodeValue(password);
        const nodeSalt = this.toNodeValue(salt);
        return new Promise<ArrayBuffer>((resolve, reject) => {
            crypto.pbkdf2(nodePassword, nodeSalt, iterations, length, algorithm, (error, key) => {
                if (error != null) {
                    reject(error);
                } else {
                    resolve(key.buffer);
                }
            });
        });
    }

    async hash(value: string | ArrayBuffer, algorithm: 'sha1' | 'sha256' | 'sha512'): Promise<ArrayBuffer> {
        const nodeValue = this.toNodeValue(value);
        const hash = crypto.createHash(algorithm);
        hash.update(nodeValue);
        return hash.digest().buffer;
    }

    async hmac(value: ArrayBuffer, key: ArrayBuffer, algorithm: 'sha1' | 'sha256' | 'sha512'): Promise<ArrayBuffer> {
        return new Uint8Array([]).buffer;
    }

    private toNodeValue(value: string | ArrayBuffer): string | Buffer {
        let nodeValue: string | Buffer;
        if (typeof (value) === 'string') {
            nodeValue = value;
        } else {
            nodeValue = Buffer.from(new Uint8Array(value) as any);
        }
        return nodeValue;
    }
}
