import { CollectionData } from '../data';

import { CollectionView } from '../view';

import { CipherString } from './cipherString';
import Domain from './domain';

export class Collection extends Domain {
    id: string;
    organizationId: string;
    name: CipherString;

    constructor(obj?: CollectionData, alreadyEncrypted: boolean = false) {
        super();
        if (obj == null) {
            return;
        }

        this.buildDomainModel(this, obj, {
            id: null,
            organizationId: null,
            name: null,
        }, alreadyEncrypted, ['id', 'organizationId']);
    }

    decrypt(): Promise<CollectionView> {
        return this.decryptObj(new CollectionView(this), {
            name: null,
        }, this.organizationId);
    }
}
