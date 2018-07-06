import { CollectionDetailsResponse } from '../response/collectionResponse';

export class CollectionData {
    id: string;
    organizationId: string;
    name: string;
    readOnly: boolean;

    constructor(response: CollectionDetailsResponse) {
        this.id = response.id;
        this.organizationId = response.organizationId;
        this.name = response.name;
        this.readOnly = response.readOnly;
    }
}
