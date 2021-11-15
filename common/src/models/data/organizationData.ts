import { ProfileOrganizationResponse } from '../response/profileOrganizationResponse';

import { OrganizationUserStatusType } from '../../enums/organizationUserStatusType';
import { OrganizationUserType } from '../../enums/organizationUserType';
import { PermissionsApi } from '../api/permissionsApi';

export class OrganizationData {
    id: string;
    name: string;
    status: OrganizationUserStatusType;
    type: OrganizationUserType;
    enabled: boolean;
    usePolicies: boolean;
    useGroups: boolean;
    useDirectory: boolean;
    useEvents: boolean;
    useTotp: boolean;
    use2fa: boolean;
    useApi: boolean;
    useSso: boolean;
    useKeyConnector: boolean;
    useResetPassword: boolean;
    selfHost: boolean;
    usersGetPremium: boolean;
    seats: number;
    maxCollections: number;
    maxStorageGb?: number;
    ssoBound: boolean;
    identifier: string;
    permissions: PermissionsApi;
    resetPasswordEnrolled: boolean;
    userId: string;
    hasPublicAndPrivateKeys: boolean;
    providerId: string;
    providerName: string;
    isProviderUser: boolean;
    usesKeyConnector: boolean;
    keyConnectorUrl: string;

    constructor(response: ProfileOrganizationResponse) {
        this.id = response.id;
        this.name = response.name;
        this.status = response.status;
        this.type = response.type;
        this.enabled = response.enabled;
        this.usePolicies = response.usePolicies;
        this.useGroups = response.useGroups;
        this.useDirectory = response.useDirectory;
        this.useEvents = response.useEvents;
        this.useTotp = response.useTotp;
        this.use2fa = response.use2fa;
        this.useApi = response.useApi;
        this.useSso = response.useSso;
        this.useKeyConnector = response.usesKeyConnector;
        this.useResetPassword = response.useResetPassword;
        this.selfHost = response.selfHost;
        this.usersGetPremium = response.usersGetPremium;
        this.seats = response.seats;
        this.maxCollections = response.maxCollections;
        this.maxStorageGb = response.maxStorageGb;
        this.ssoBound = response.ssoBound;
        this.identifier = response.identifier;
        this.permissions = response.permissions;
        this.resetPasswordEnrolled = response.resetPasswordEnrolled;
        this.userId = response.userId;
        this.hasPublicAndPrivateKeys = response.hasPublicAndPrivateKeys;
        this.providerId = response.providerId;
        this.providerName = response.providerName;
        this.usesKeyConnector = response.usesKeyConnector;
        this.keyConnectorUrl = response.keyConnectorUrl;
    }
}
