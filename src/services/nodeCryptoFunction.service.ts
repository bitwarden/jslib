import * as crypto from 'crypto';

import { CryptoFunctionService } from '../abstractions/cryptoFunction.service';

export class NodeCryptoFunctionService implements CryptoFunctionService {
    async pbkdf2(password: string | ArrayBuffer, salt: string | ArrayBuffer, algorithm: 'sha256' | 'sha512',
        iterations: number, length: number): Promise<ArrayBuffer> {
        let nodePassword: string | Buffer;
        if (typeof (password) === 'string') {
            nodePassword = password;
        } else {
            nodePassword = Buffer.from(new Uint8Array(password) as any);
        }

        let nodeSalt: string | Buffer;
        if (typeof (salt) === 'string') {
            nodeSalt = salt;
        } else {
            nodeSalt = Buffer.from(new Uint8Array(salt) as any);
        }

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
}
