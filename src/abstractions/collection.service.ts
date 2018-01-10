import { CollectionData } from '../models/data/collectionData';

import { Collection } from '../models/domain/collection';

export interface CollectionService {
    decryptedCollectionCache: any[];

    clearCache(): void;
    get(id: string): Promise<Collection>;
    getAll(): Promise<Collection[]>;
    getAllDecrypted(): Promise<any[]>;
    upsert(collection: CollectionData | CollectionData[]): Promise<any>;
    replace(collections: { [id: string]: CollectionData; }): Promise<any>;
    clear(userId: string): Promise<any>;
    delete(id: string | string[]): Promise<any>;
}
