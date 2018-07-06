import { OrganizationUserStatusType } from '../../enums/organizationUserStatusType';
import { OrganizationUserType } from '../../enums/organizationUserType';

export class CollectionUserResponse {
    organizationUserId: string;
    accessAll: boolean;
    name: string;
    email: string;
    type: OrganizationUserType;
    status: OrganizationUserStatusType;
    readOnly: boolean;

    constructor(response: any) {
        this.organizationUserId = response.OrganizationUserId;
        this.accessAll = response.AccessAll;
        this.name = response.Name;
        this.email = response.Email;
        this.type = response.Type;
        this.status = response.Status;
        this.readOnly = response.ReadOnly;
    }
}
