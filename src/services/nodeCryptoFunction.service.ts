import * as crypto from 'crypto';

import { CryptoFunctionService } from '../abstractions/cryptoFunction.service';

export class NodeCryptoFunctionService implements CryptoFunctionService {
    async pbkdf2(password: Buffer, salt: Buffer, iterations: number, length: number): Promise<ArrayBuffer> {
        return new Promise<ArrayBuffer>((resolve, reject) => {
            crypto.pbkdf2(password, salt, iterations, length, 'sha256', (error, key) => {
                if (error != null) {
                    reject(error);
                } else {
                    resolve(key.buffer);
                }
            });
        });
    }
}
