export class CollectionResponse {
    id: string;
    organizationId: string;
    name: string;
    readOnly: boolean;

    constructor(response: any) {
        this.id = response.Id;
        this.organizationId = response.OrganizationId;
        this.name = response.Name;
        this.readOnly = response.ReadOnly || false;
    }
}
