import { BaseResponse } from './baseResponse';

import { OrganizationUserStatusType } from '../../enums/organizationUserStatusType';
import { OrganizationUserType } from '../../enums/organizationUserType';
import { PermissionsApi } from '../api/permissionsApi';

export class ProfileOrganizationResponse extends BaseResponse {
    id: string;
    name: string;
    usePolicies: boolean;
    useGroups: boolean;
    useDirectory: boolean;
    useEvents: boolean;
    useTotp: boolean;
    use2fa: boolean;
    useApi: boolean;
    useBusinessPortal: boolean;
    useSso: boolean;
    useResetPassword: boolean;
    selfHost: boolean;
    usersGetPremium: boolean;
    seats: number;
    maxCollections: number;
    maxStorageGb?: number;
    key: string;
    hasPublicAndPrivateKeys: boolean;
    status: OrganizationUserStatusType;
    type: OrganizationUserType;
    enabled: boolean;
    ssoBound: boolean;
    identifier: string;
    permissions: PermissionsApi;
    resetPasswordEnrolled: boolean;
    userId: string;
    providerId: string;
    providerName: string;

    constructor(response: any) {
        super(response);
        this.id = this.getResponseProperty('Id');
        this.name = this.getResponseProperty('Name');
        this.usePolicies = this.getResponseProperty('UsePolicies');
        this.useGroups = this.getResponseProperty('UseGroups');
        this.useDirectory = this.getResponseProperty('UseDirectory');
        this.useEvents = this.getResponseProperty('UseEvents');
        this.useTotp = this.getResponseProperty('UseTotp');
        this.use2fa = this.getResponseProperty('Use2fa');
        this.useApi = this.getResponseProperty('UseApi');
        this.useBusinessPortal = this.getResponseProperty('UseBusinessPortal');
        this.useSso = this.getResponseProperty('UseSso');
        this.useResetPassword = this.getResponseProperty('UseResetPassword');
        this.selfHost = this.getResponseProperty('SelfHost');
        this.usersGetPremium = this.getResponseProperty('UsersGetPremium');
        this.seats = this.getResponseProperty('Seats');
        this.maxCollections = this.getResponseProperty('MaxCollections');
        this.maxStorageGb = this.getResponseProperty('MaxStorageGb');
        this.key = this.getResponseProperty('Key');
        this.hasPublicAndPrivateKeys = this.getResponseProperty('HasPublicAndPrivateKeys');
        this.status = this.getResponseProperty('Status');
        this.type = this.getResponseProperty('Type');
        this.enabled = this.getResponseProperty('Enabled');
        this.ssoBound = this.getResponseProperty('SsoBound');
        this.identifier = this.getResponseProperty('Identifier');
        this.permissions = new PermissionsApi(this.getResponseProperty('permissions'));
        this.resetPasswordEnrolled = this.getResponseProperty('ResetPasswordEnrolled');
        this.userId = this.getResponseProperty('UserId');
        this.providerId = this.getResponseProperty('ProviderId');
        this.providerName = this.getResponseProperty('ProviderName');
    }
}
