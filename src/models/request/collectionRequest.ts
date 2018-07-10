import { Collection } from '../domain/collection';

import { SelectionReadOnlyRequest } from './selectionReadOnlyRequest';

export class CollectionRequest {
    name: string;
    groups: SelectionReadOnlyRequest[] = [];

    constructor(collection?: Collection) {
        if (collection == null) {
            return;
        }
        this.name = collection.name ? collection.name.encryptedString : null;
    }
}
