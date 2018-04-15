export abstract class CryptoFunctionService {
    pbkdf2: (password: Buffer, salt: Buffer, iterations: number, length: number) => Promise<ArrayBuffer>
}
