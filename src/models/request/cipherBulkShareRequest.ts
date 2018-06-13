import { CipherRequest } from './cipherRequest';

import { Cipher } from '../domain/cipher';

export class CipherBulkShareRequest {
    ciphers: CipherRequest[];
    collectionIds: string[];

    constructor(ciphers: Cipher[], collectionIds: string[]) {
        if (ciphers != null) {
            this.ciphers = [];
            ciphers.forEach((c) => {
                this.ciphers.push(new CipherRequest(c));
            });
        }
        this.collectionIds = collectionIds;
    }
}
