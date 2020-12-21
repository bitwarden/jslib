import { SelectionReadOnlyRequest } from './selectionReadOnlyRequest';

import { PermissionsInterface } from '../interfaces/permissions';

import { OrganizationUserType } from '../../enums/organizationUserType';

export class OrganizationUserUpdateRequest implements PermissionsInterface {
    type: OrganizationUserType;
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
    collections: SelectionReadOnlyRequest[] = [];
}
