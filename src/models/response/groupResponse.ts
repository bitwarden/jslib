import { SelectionReadOnlyResponse } from './selectionReadOnlyResponse';

export class GroupResponse {
    id: string;
    organizationId: string;
    name: string;
    accessAll: boolean;
    externalId: string;

    constructor(response: any) {
        this.id = response.Id;
        this.organizationId = response.OrganizationId;
        this.name = response.Name;
        this.accessAll = response.AccessAll;
        this.externalId = response.ExternalId;
    }
}

export class GroupDetailsResponse extends GroupResponse {
    collections: SelectionReadOnlyResponse[] = [];

    constructor(response: any) {
        super(response);
        if (response.Collections != null) {
            this.collections = response.Collections.map((c: any) => new SelectionReadOnlyResponse(c));
        }
    }
}
