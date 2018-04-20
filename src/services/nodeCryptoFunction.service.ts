import * as constants from 'constants';
import * as crypto from 'crypto';
import * as forge from 'node-forge';

import { CryptoFunctionService } from '../abstractions/cryptoFunction.service';

import { Utils } from '../misc/utils';

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
                    resolve(this.toArrayBuffer(key));
                }
            });
        });
    }

    hash(value: string | ArrayBuffer, algorithm: 'sha1' | 'sha256' | 'sha512'): Promise<ArrayBuffer> {
        const nodeValue = this.toNodeValue(value);
        const hash = crypto.createHash(algorithm);
        hash.update(nodeValue);
        return Promise.resolve(this.toArrayBuffer(hash.digest()));
    }

    hmac(value: ArrayBuffer, key: ArrayBuffer, algorithm: 'sha1' | 'sha256' | 'sha512'): Promise<ArrayBuffer> {
        const nodeValue = this.toNodeBuffer(value);
        const nodeKey = this.toNodeBuffer(value);
        const hmac = crypto.createHmac(algorithm, nodeKey);
        hmac.update(nodeValue);
        return Promise.resolve(this.toArrayBuffer(hmac.digest()));
    }

    aesEncrypt(data: ArrayBuffer, iv: ArrayBuffer, key: ArrayBuffer): Promise<ArrayBuffer> {
        const nodeData = this.toNodeBuffer(data);
        const nodeIv = this.toNodeBuffer(iv);
        const nodeKey = this.toNodeBuffer(key);
        const cipher = crypto.createCipheriv('aes-256-cbc', nodeKey, nodeIv);
        const encBuf = Buffer.concat([cipher.update(nodeData), cipher.final()]);
        return Promise.resolve(this.toArrayBuffer(encBuf));
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
        return Promise.resolve(this.toArrayBuffer(decBuf));
    }

    rsaEncrypt(data: ArrayBuffer, publicKey: ArrayBuffer, algorithm: 'sha1' | 'sha256'): Promise<ArrayBuffer> {
        let md: forge.md.MessageDigest;
        if (algorithm === 'sha256') {
            md = forge.md.sha256.create();
        } else {
            md = forge.md.sha1.create();
        }

        const dataBytes = Utils.fromBufferToByteString(data);
        const key = this.toForgePublicKey(publicKey);
        const decBytes: string = key.encrypt(dataBytes, 'RSA-OAEP', { md: md });
        return Promise.resolve(Utils.fromByteStringToArray(decBytes).buffer);
    }

    rsaDecrypt(data: ArrayBuffer, privateKey: ArrayBuffer, algorithm: 'sha1' | 'sha256'): Promise<ArrayBuffer> {
        let md: forge.md.MessageDigest;
        if (algorithm === 'sha256') {
            md = forge.md.sha256.create();
        } else {
            md = forge.md.sha1.create();
        }

        const dataBytes = Utils.fromBufferToByteString(data);
        const key = this.toForgePrivateKey(privateKey);
        const decBytes: string = key.decrypt(dataBytes, 'RSA-OAEP', { md: md });
        return Promise.resolve(Utils.fromByteStringToArray(decBytes).buffer);
    }

    randomBytes(length: number): Promise<ArrayBuffer> {
        return new Promise<ArrayBuffer>((resolve, reject) => {
            crypto.randomBytes(length, (error, bytes) => {
                if (error != null) {
                    reject(error);
                } else {
                    resolve(this.toArrayBuffer(bytes));
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

    private toArrayBuffer(buf: Buffer): ArrayBuffer {
        return new Uint8Array(buf).buffer;
    }

    private toForgePrivateKey(key: ArrayBuffer): any {
        const byteString = Utils.fromBufferToByteString(key);
        const asn1 = forge.asn1.fromDer(byteString);
        return (forge as any).pki.privateKeyFromAsn1(asn1);
    }

    private toForgePublicKey(key: ArrayBuffer): any {
        const byteString = Utils.fromBufferToByteString(key);
        const asn1 = forge.asn1.fromDer(byteString);
        return (forge as any).pki.publicKeyFromAsn1(asn1);
    }
}
