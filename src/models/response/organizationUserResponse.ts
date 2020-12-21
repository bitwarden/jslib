import { OrganizationUserStatusType } from '../../enums/organizationUserStatusType';
import { OrganizationUserType } from '../../enums/organizationUserType';

import { PermissionsInterface } from '../interfaces/permissions';

import { BaseResponse } from './baseResponse';
import { SelectionReadOnlyResponse } from './selectionReadOnlyResponse';

export class OrganizationUserResponse extends BaseResponse implements PermissionsInterface {
    id: string;
    userId: string;
    type: OrganizationUserType;
    status: OrganizationUserStatusType;
    accessBusinessPortal: boolean;
    accessEventLogs: boolean;
    accessImportExport: boolean;
    accessReports: boolean;
    manageAllCollections: boolean;
    manageAssignedCollections: boolean;
    manageGroups: boolean;
    managePolicies: boolean;
    manageUsers: boolean;
    accessAll: boolean;

    constructor(response: any) {
        super(response);
        this.id = this.getResponseProperty('Id');
        this.userId = this.getResponseProperty('UserId');
        this.type = this.getResponseProperty('Type');
        this.status = this.getResponseProperty('Status');
        this.accessBusinessPortal = this.getResponseProperty('AccessBusinessPortal');
        this.accessEventLogs = this.getResponseProperty('AccessEventLogs');
        this.accessImportExport = this.getResponseProperty('AccessImportExport');
        this.accessReports = this.getResponseProperty('AccessReports');
        this.manageAllCollections = this.getResponseProperty('ManageAllCollections');
        this.manageAssignedCollections = this.getResponseProperty('ManageAssignedCollections');
        this.manageGroups = this.getResponseProperty('ManageGroups');
        this.managePolicies = this.getResponseProperty('ManagePolicies');
        this.manageUsers = this.getResponseProperty('ManageUsers');
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
