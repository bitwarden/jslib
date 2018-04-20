import * as constants from 'constants';
import * as crypto from 'crypto';

import { CryptoFunctionService } from '../abstractions/cryptoFunction.service';

export class NodeCryptoFunctionService implements CryptoFunctionService {
    pbkdf2(password: string | ArrayBuffer, salt: string | ArrayBuffer, algorithm: 'sha256' | 'sha512',
        iterations: number): Promise<ArrayBuffer> {
        const len = algorithm === 'sha256' ? 256 : 512;
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

    hash(value: string | ArrayBuffer, algorithm: 'sha1' | 'sha256' | 'sha512'): Promise<ArrayBuffer> {
        const nodeValue = this.toNodeValue(value);
        const hash = crypto.createHash(algorithm);
        hash.update(nodeValue);
        return Promise.resolve(hash.digest().buffer);
    }

    hmac(value: ArrayBuffer, key: ArrayBuffer, algorithm: 'sha1' | 'sha256' | 'sha512'): Promise<ArrayBuffer> {
        const nodeValue = this.toNodeBuffer(value);
        const nodeKey = this.toNodeBuffer(value);
        const hmac = crypto.createHmac(algorithm, nodeKey);
        hmac.update(nodeValue);
        return Promise.resolve(hmac.digest().buffer);
    }

    aesEncrypt(data: ArrayBuffer, iv: ArrayBuffer, key: ArrayBuffer): Promise<ArrayBuffer> {
        const nodeData = this.toNodeBuffer(data);
        const nodeIv = this.toNodeBuffer(iv);
        const nodeKey = this.toNodeBuffer(key);
        const cipher = crypto.createCipheriv('aes-256-cbc', nodeKey, nodeIv);
        const encBuf = Buffer.concat([cipher.update(nodeData), cipher.final()]);
        return Promise.resolve(encBuf.buffer);
    }

    aesDecryptSmall(data: ArrayBuffer, iv: ArrayBuffer, key: ArrayBuffer): Promise<ArrayBuffer> {
        return this.aesDecryptLarge(data, iv, key);
    }

    aesDecryptLarge(data: ArrayBuffer, iv: ArrayBuffer, key: ArrayBuffer): Promise<ArrayBuffer> {
        const nodeData = this.toNodeBuffer(data);
        const nodeIv = this.toNodeBuffer(iv);
        const nodeKey = this.toNodeBuffer(key);
        const decipher = crypto.createDecipheriv('aes-256-cbc', nodeKey, nodeIv);
        const decBuf = Buffer.concat([decipher.update(nodeData), decipher.final()]);
        return Promise.resolve(decBuf.buffer);
    }

    rsaDecrypt(data: ArrayBuffer, key: ArrayBuffer, algorithm: 'sha1' | 'sha256'): Promise<ArrayBuffer> {
        if (algorithm !== 'sha1') {
            throw new Error('only sha1 is supported on this platform.');
        }

        const nodeData = this.toNodeBuffer(data);
        const rsaKey: crypto.RsaPrivateKey = {
            key: this.toPem(key),
            padding: constants.RSA_PKCS1_OAEP_PADDING,
        };
        const decBuf = crypto.publicDecrypt(rsaKey, nodeData);
        return Promise.resolve(decBuf.buffer);
    }

    randomBytes(length: number): Promise<ArrayBuffer> {
        return new Promise<ArrayBuffer>((resolve, reject) => {
            crypto.randomBytes(length, (error, bytes) => {
                if (error != null) {
                    reject(error);
                } else {
                    resolve(bytes.buffer);
                }
            });
        });
    }

    private toNodeValue(value: string | ArrayBuffer): string | Buffer {
        let nodeValue: string | Buffer;
        if (typeof (value) === 'string') {
            nodeValue = value;
        } else {
            nodeValue = this.toNodeBuffer(value);
        }
        return nodeValue;
    }

    private toNodeBuffer(value: ArrayBuffer): Buffer {
        return Buffer.from(new Uint8Array(value) as any);
    }

    private toPem(key: ArrayBuffer): string {
        const b64Key = ''; // TODO: key to b84
        return '-----BEGIN PRIVATE KEY-----\n' + b64Key + '\n-----END PRIVATE KEY-----';
    }
}
