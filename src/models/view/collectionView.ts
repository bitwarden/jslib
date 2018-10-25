import { View } from './view';

import { Collection } from '../domain/collection';
import { ITreeNodeObject } from '../domain/treeNode';

export class CollectionView implements View, ITreeNodeObject {
    id: string;
    organizationId: string;
    name: string;
    readOnly: boolean;

    constructor(c?: Collection) {
        if (!c) {
            return;
        }

        this.id = c.id;
        this.organizationId = c.organizationId;
        this.readOnly = c.readOnly;
    }
}
