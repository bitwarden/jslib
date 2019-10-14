import { View } from './view';

import { Collection } from '../domain/collection';
import { ITreeNodeObject } from '../domain/treeNode';

import { CollectionGroupDetailsResponse } from '../response/collectionResponse';

export class CollectionView implements View, ITreeNodeObject {
    id: string = null;
    organizationId: string = null;
    name: string = null;
    externalId: string = null;
    readOnly: boolean = null;

    constructor(c?: Collection | CollectionGroupDetailsResponse) {
        if (!c) {
            return;
        }

        this.id = c.id;
        this.organizationId = c.organizationId;
        this.externalId = c.externalId;
        if (c instanceof Collection) {
            this.readOnly = c.readOnly;
        }
    }
}
