export abstract class CryptoFunctionService {
    pbkdf2: (password: string | ArrayBuffer, salt: string | ArrayBuffer, algorithm: 'sha256' | 'sha512',
        iterations: number, length: number) => Promise<ArrayBuffer>;
}
