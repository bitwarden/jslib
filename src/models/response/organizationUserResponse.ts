import { OrganizationUserStatusType } from '../../enums/organizationUserStatusType';
import { OrganizationUserType } from '../../enums/organizationUserType';
import { SelectionReadOnlyResponse } from './selectionReadOnlyResponse';

export class OrganizationUserResponse {
    id: string;
    userId: string;
    type: OrganizationUserType;
    status: OrganizationUserStatusType;
    accessAll: boolean;

    constructor(response: any) {
        this.id = response.Id;
        this.userId = response.UserId;
        this.type = response.Type;
        this.status = response.Status;
        this.accessAll = response.AccessAll;
    }
}

export class OrganizationUserUserDetailsResponse extends OrganizationUserResponse {
    name: string;
    email: string;
    twoFactorEnabled: string;

    constructor(response: any) {
        super(response);
        this.name = response.Name;
        this.email = response.Email;
        this.twoFactorEnabled = response.TwoFactorEnabled;
    }
}

export class OrganizationUserDetailsResponse extends OrganizationUserResponse {
    collections: SelectionReadOnlyResponse[] = [];

    constructor(response: any) {
        super(response);
        if (response.Collections != null) {
            this.collections = response.Collections.map((c: any) => new SelectionReadOnlyResponse(c));
        }
    }
}
