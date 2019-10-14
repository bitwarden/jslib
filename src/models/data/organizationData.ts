import { ProfileOrganizationResponse } from '../response/profileOrganizationResponse';

import { OrganizationUserStatusType } from '../../enums/organizationUserStatusType';
import { OrganizationUserType } from '../../enums/organizationUserType';

export class OrganizationData {
    id: string;
    name: string;
    status: OrganizationUserStatusType;
    type: OrganizationUserType;
    enabled: boolean;
    useGroups: boolean;
    useDirectory: boolean;
    useEvents: boolean;
    useTotp: boolean;
    use2fa: boolean;
    useApi: boolean;
    selfHost: boolean;
    usersGetPremium: boolean;
    seats: number;
    maxCollections: number;
    maxStorageGb?: number;

    constructor(response: ProfileOrganizationResponse) {
        this.id = response.id;
        this.name = response.name;
        this.status = response.status;
        this.type = response.type;
        this.enabled = response.enabled;
        this.useGroups = response.useGroups;
        this.useDirectory = response.useDirectory;
        this.useEvents = response.useEvents;
        this.useTotp = response.useTotp;
        this.use2fa = response.use2fa;
        this.useApi = response.useApi;
        this.selfHost = response.selfHost;
        this.usersGetPremium = response.usersGetPremium;
        this.seats = response.seats;
        this.maxCollections = response.maxCollections;
        this.maxStorageGb = response.maxStorageGb;
    }
}
