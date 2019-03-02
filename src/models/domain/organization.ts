import { OrganizationData } from '../data/organizationData';

import { OrganizationUserStatusType } from '../../enums/organizationUserStatusType';
import { OrganizationUserType } from '../../enums/organizationUserType';

export class Organization {
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

    constructor(obj?: OrganizationData) {
        if (obj == null) {
            return;
        }

        this.id = obj.id;
        this.name = obj.name;
        this.status = obj.status;
        this.type = obj.type;
        this.enabled = obj.enabled;
        this.useGroups = obj.useGroups;
        this.useDirectory = obj.useDirectory;
        this.useEvents = obj.useEvents;
        this.useTotp = obj.useTotp;
        this.use2fa = obj.use2fa;
        this.useApi = obj.useApi;
        this.selfHost = obj.selfHost;
        this.usersGetPremium = obj.usersGetPremium;
        this.seats = obj.seats;
        this.maxCollections = obj.maxCollections;
        this.maxStorageGb = obj.maxStorageGb;
    }

    get canAccess() {
        if (this.type === OrganizationUserType.Owner) {
            return true;
        }
        return this.enabled && this.status === OrganizationUserStatusType.Confirmed;
    }

    get isManager() {
        return this.type === OrganizationUserType.Manager || this.type === OrganizationUserType.Owner ||
            this.type === OrganizationUserType.Admin;
    }

    get isAdmin() {
        return this.type === OrganizationUserType.Owner || this.type === OrganizationUserType.Admin;
    }

    get isOwner() {
        return this.type === OrganizationUserType.Owner;
    }
}
