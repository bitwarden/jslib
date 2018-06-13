import { CipherWithIdRequest } from './cipherWithIdRequest';

import { Cipher } from '../domain/cipher';

export class CipherBulkShareRequest {
    ciphers: CipherWithIdRequest[];
    collectionIds: string[];

    constructor(ciphers: Cipher[], collectionIds: string[]) {
        if (ciphers != null) {
            this.ciphers = [];
            ciphers.forEach((c) => {
                this.ciphers.push(new CipherWithIdRequest(c));
            });
        }
        this.collectionIds = collectionIds;
    }
}
