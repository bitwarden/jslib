import { Collection } from '../domain/collection';

export class CollectionRequest {
    name: string;

    constructor(collection: Collection) {
        this.name = collection.name ? collection.name.encryptedString : null;
    }
}
