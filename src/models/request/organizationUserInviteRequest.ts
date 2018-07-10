import { OrganizationUserType } from '../../enums/organizationUserType';

import { SelectionReadOnlyRequest } from './selectionReadOnlyRequest';

export class OrganizationUserInviteRequest {
    emails: string[] = [];
    type: OrganizationUserType;
    accessAll: boolean;
    collections: SelectionReadOnlyRequest[] = [];
}
