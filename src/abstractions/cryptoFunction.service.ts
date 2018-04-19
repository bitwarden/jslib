export abstract class CryptoFunctionService {
    pbkdf2: (password: string | ArrayBuffer, salt: string | ArrayBuffer, algorithm: 'sha256' | 'sha512',
        iterations: number) => Promise<ArrayBuffer>;
    hash: (value: string | ArrayBuffer, algorithm: 'sha1' | 'sha256' | 'sha512') => Promise<ArrayBuffer>;
    hmac: (value: ArrayBuffer, key: ArrayBuffer, algorithm: 'sha1' | 'sha256' | 'sha512') => Promise<ArrayBuffer>;
    rsaDecrypt: (data: ArrayBuffer, key: ArrayBuffer, algorithm: 'sha1' | 'sha256') => Promise<ArrayBuffer>;
}
