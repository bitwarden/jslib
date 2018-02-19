import { CollectionData } from '../models/data';

import { Collection } from '../models/domain';

import { CollectionView } from '../models/view';

export abstract class CollectionService {
    decryptedCollectionCache: CollectionView[];

    clearCache: () => void;
    get: (id: string) => Promise<Collection>;
    getAll: () => Promise<Collection[]>;
    getAllDecrypted: () => Promise<CollectionView[]>;
    upsert: (collection: CollectionData | CollectionData[]) => Promise<any>;
    replace: (collections: { [id: string]: CollectionData; }) => Promise<any>;
    clear: (userId: string) => Promise<any>;
    delete: (id: string | string[]) => Promise<any>;
}
