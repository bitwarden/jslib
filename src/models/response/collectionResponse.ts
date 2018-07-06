import { SelectionReadOnlyResponse } from './selectionReadOnlyResponse';

export class CollectionResponse {
    id: string;
    organizationId: string;
    name: string;

    constructor(response: any) {
        this.id = response.Id;
        this.organizationId = response.OrganizationId;
        this.name = response.Name;
    }
}

export class CollectionDetailsResponse extends CollectionResponse {
    readOnly: boolean;

    constructor(response: any) {
        super(response);
        this.readOnly = response.ReadOnly || false;
    }
}

export class CollectionGroupDetailsResponse extends CollectionResponse {
    groups: SelectionReadOnlyResponse[] = [];

    constructor(response: any) {
        super(response);
        if (response.Groups != null) {
            this.groups = response.Collections.map((g: any) => new SelectionReadOnlyResponse(g));
        }
    }
}
