import { Cipher } from './cipher';

import { CipherView } from '../view/cipherView';

export class CipherWithIds extends Cipher {
    id: string;
    collectionIds: string[];

    // Use build method instead of ctor so that we can control order of JSON stringify for pretty print
    build(o: CipherView) {
        this.id = o.id;
        super.build(o);
        this.collectionIds = o.collectionIds;
    }
}
