export abstract class CryptoFunctionService {
    pbkdf2: (password: string | ArrayBuffer, salt: string | ArrayBuffer, algorithm: 'sha256' | 'sha512',
        iterations: number) => Promise<ArrayBuffer>;
    hash: (value: string | ArrayBuffer, algorithm: 'sha1' | 'sha256' | 'sha512') => Promise<ArrayBuffer>;
    hmac: (value: ArrayBuffer, key: ArrayBuffer, algorithm: 'sha1' | 'sha256' | 'sha512') => Promise<ArrayBuffer>;
    aesEncrypt: (data: ArrayBuffer, iv: ArrayBuffer, key: ArrayBuffer) => Promise<ArrayBuffer>;
    aesDecryptSmall: (data: ArrayBuffer, iv: ArrayBuffer, key: ArrayBuffer) => Promise<ArrayBuffer>;
    aesDecryptLarge: (data: ArrayBuffer, iv: ArrayBuffer, key: ArrayBuffer) => Promise<ArrayBuffer>;
    rsaEncrypt: (data: ArrayBuffer, publicKey: ArrayBuffer, algorithm: 'sha1' | 'sha256') => Promise<ArrayBuffer>;
    rsaDecrypt: (data: ArrayBuffer, key: ArrayBuffer, algorithm: 'sha1' | 'sha256') => Promise<ArrayBuffer>;
    randomBytes: (length: number) => Promise<ArrayBuffer>;
}
