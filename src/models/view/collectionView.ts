import { View } from './view';

import { Collection } from '../domain/collection';
import { ITreeNodeObject } from '../domain/treeNode';

export class CollectionView implements View, ITreeNodeObject {
    id: string = null;
    organizationId: string = null;
    name: string = null;
    externalId: string = null;
    readOnly: boolean = null;

    constructor(c?: Collection) {
        if (!c) {
            return;
        }

        this.id = c.id;
        this.organizationId = c.organizationId;
        this.readOnly = c.readOnly;
        this.externalId = c.externalId;
    }
}
