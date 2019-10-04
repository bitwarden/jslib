import { OrganizationUserStatusType } from '../../enums/organizationUserStatusType';
import { OrganizationUserType } from '../../enums/organizationUserType';

import { BaseResponse } from './baseResponse';
import { SelectionReadOnlyResponse } from './selectionReadOnlyResponse';

export class OrganizationUserResponse extends BaseResponse {
    id: string;
    userId: string;
    type: OrganizationUserType;
    status: OrganizationUserStatusType;
    accessAll: boolean;

    constructor(response: any) {
        super(response);
        this.id = this.getResponseProperty('Id');
        this.userId = this.getResponseProperty('UserId');
        this.type = this.getResponseProperty('Type');
        this.status = this.getResponseProperty('Status');
        this.accessAll = this.getResponseProperty('AccessAll');
    }
}

export class OrganizationUserUserDetailsResponse extends OrganizationUserResponse {
    name: string;
    email: string;
    twoFactorEnabled: boolean;

    constructor(response: any) {
        super(response);
        this.name = this.getResponseProperty('Name');
        this.email = this.getResponseProperty('Email');
        this.twoFactorEnabled = this.getResponseProperty('TwoFactorEnabled');
    }
}

export class OrganizationUserDetailsResponse extends OrganizationUserResponse {
    collections: SelectionReadOnlyResponse[] = [];

    constructor(response: any) {
        super(response);
        const collections = this.getResponseProperty('Collections');
        if (collections != null) {
            this.collections = collections.map((c: any) => new SelectionReadOnlyResponse(c));
        }
    }
}
