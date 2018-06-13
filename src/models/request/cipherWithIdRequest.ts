import { CipherRequest } from './cipherRequest';

import { Cipher } from '../domain/cipher';

export class CipherWithIdRequest extends CipherRequest {
    id: string;

    constructor(cipher: Cipher) {
        super(cipher);
        this.id = cipher.id;
    }
}
