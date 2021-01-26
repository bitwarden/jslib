import { SelectionReadOnlyRequest } from './selectionReadOnlyRequest';

import { OrganizationUserType } from '../../enums/organizationUserType';
import { PermissionsApi } from '../api/permissionsApi';

export class OrganizationUserInviteRequest {
    emails: string[] = [];
    type: OrganizationUserType;
    accessAll: boolean;
    collections: SelectionReadOnlyRequest[] = [];
    permissions: PermissionsApi;
}
