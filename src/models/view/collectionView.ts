import { View } from './view';

import { Collection } from '../domain';

export class CollectionView implements View {
    id: string;
    organizationId: string;
    name: string;

    constructor(c?: Collection) {
        if (!c) {
            return;
        }

        this.id = c.id;
        this.organizationId = c.organizationId;
    }
}
