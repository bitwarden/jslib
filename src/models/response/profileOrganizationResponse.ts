import { BaseResponse } from './baseResponse';

import { OrganizationUserStatusType } from '../../enums/organizationUserStatusType';
import { OrganizationUserType } from '../../enums/organizationUserType';

export class ProfileOrganizationResponse extends BaseResponse {
    id: string;
    name: string;
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
    key: string;
    status: OrganizationUserStatusType;
    type: OrganizationUserType;
    enabled: boolean;

    constructor(response: any) {
        super(response);
        this.id = this.getResponseProperty('Id');
        this.name = this.getResponseProperty('Name');
        this.useGroups = this.getResponseProperty('UseGroups');
        this.useDirectory = this.getResponseProperty('UseDirectory');
        this.useEvents = this.getResponseProperty('UseEvents');
        this.useTotp = this.getResponseProperty('UseTotp');
        this.use2fa = this.getResponseProperty('Use2fa');
        this.useApi = this.getResponseProperty('UseApi');
        this.selfHost = this.getResponseProperty('SelfHost');
        this.usersGetPremium = this.getResponseProperty('UsersGetPremium');
        this.seats = this.getResponseProperty('Seats');
        this.maxCollections = this.getResponseProperty('MaxCollections');
        this.maxStorageGb = this.getResponseProperty('MaxStorageGb');
        this.key = this.getResponseProperty('Key');
        this.status = this.getResponseProperty('Status');
        this.type = this.getResponseProperty('Type');
        this.enabled = this.getResponseProperty('Enabled');
    }
}
