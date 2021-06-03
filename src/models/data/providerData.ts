import { ProfileOrganizationResponse } from '../response/profileOrganizationResponse';

import { ProviderUserStatusType } from '../../enums/providerUserStatusType';
import { ProviderUserType } from '../../enums/providerUserType';

export class ProviderData {
    id: string;
    name: string;
    status: ProviderUserStatusType;
    type: ProviderUserType;
    enabled: boolean;
    userId: string;

    constructor(response: ProfileOrganizationResponse) {
        this.id = response.id;
        this.name = response.name;
        this.enabled = response.enabled;
        this.userId = response.userId;
    }
}
