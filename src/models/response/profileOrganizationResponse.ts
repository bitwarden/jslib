import { OrganizationUserStatusType } from '../../enums/organizationUserStatusType';
import { OrganizationUserType } from '../../enums/organizationUserType';

export class ProfileOrganizationResponse {
    id: string;
    name: string;
    useGroups: boolean;
    useDirectory: boolean;
    useEvents: boolean;
    useTotp: boolean;
    use2fa: boolean;
    seats: number;
    maxCollections: number;
    maxStorageGb?: number;
    key: string;
    status: OrganizationUserStatusType;
    type: OrganizationUserType;
    enabled: boolean;

    constructor(response: any) {
        this.id = response.Id;
        this.name = response.Name;
        this.useGroups = response.UseGroups;
        this.useDirectory = response.UseDirectory;
        this.useEvents = response.UseEvents;
        this.useTotp = response.UseTotp;
        this.use2fa = response.Use2fa;
        this.seats = response.Seats;
        this.maxCollections = response.MaxCollections;
        this.maxStorageGb = response.MaxStorageGb;
        this.key = response.Key;
        this.status = response.Status;
        this.type = response.Type;
        this.enabled = response.Enabled;
    }
}
