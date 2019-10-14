import { CollectionData } from '../data/collectionData';

import { CollectionView } from '../view/collectionView';

import { CipherString } from './cipherString';
import Domain from './domainBase';

export class Collection extends Domain {
    id: string;
    organizationId: string;
    name: CipherString;
    externalId: string;
    readOnly: boolean;

    constructor(obj?: CollectionData, alreadyEncrypted: boolean = false) {
        super();
        if (obj == null) {
            return;
        }

        this.buildDomainModel(this, obj, {
            id: null,
            organizationId: null,
            name: null,
            externalId: null,
            readOnly: null,
        }, alreadyEncrypted, ['id', 'organizationId', 'externalId', 'readOnly']);
    }

    decrypt(): Promise<CollectionView> {
        return this.decryptObj(new CollectionView(this), {
            name: null,
        }, this.organizationId);
    }
}
