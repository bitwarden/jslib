import { Collection } from '../domain/collection';

import { SelectionReadOnlyRequest } from './selectionReadOnlyRequest';

export class CollectionRequest {
    name: string;
    groups: SelectionReadOnlyRequest[] = [];

    constructor(collection: Collection) {
        this.name = collection.name ? collection.name.encryptedString : null;
    }
}
