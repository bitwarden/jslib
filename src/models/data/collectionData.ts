import { CollectionResponse } from '../response';

export class CollectionData {
    id: string;
    organizationId: string;
    name: string;

    constructor(response: CollectionResponse) {
        this.id = response.id;
        this.organizationId = response.organizationId;
        this.name = response.name;
    }
}
