import { OrganizationData } from '../data/organizationData';

import { PermissionsInterface } from '../interfaces/permissions';

import { OrganizationUserStatusType } from '../../enums/organizationUserStatusType';
import { OrganizationUserType } from '../../enums/organizationUserType';


export class Organization implements PermissionsInterface {
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
    useBusinessPortal: boolean;
    useSso: boolean;
    selfHost: boolean;
    usersGetPremium: boolean;
    seats: number;
    maxCollections: number;
    maxStorageGb?: number;
    ssoBound: boolean;
    identifier: string;
    accessBusinessPortal: boolean;
    accessEventLogs: boolean;
    accessImportExport: boolean;
    accessReports: boolean;
    manageAllCollections: boolean;
    manageAssignedCollections: boolean;
    manageGroups: boolean;
    managePolicies: boolean;
    manageUsers: boolean;

    constructor(obj?: OrganizationData) {
        if (obj == null) {
            return;
        }

        this.id = obj.id;
        this.name = obj.name;
        this.status = obj.status;
        this.type = obj.type;
        this.enabled = obj.enabled;
        this.usePolicies = obj.usePolicies;
        this.useGroups = obj.useGroups;
        this.useDirectory = obj.useDirectory;
        this.useEvents = obj.useEvents;
        this.useTotp = obj.useTotp;
        this.use2fa = obj.use2fa;
        this.useApi = obj.useApi;
        this.useBusinessPortal = obj.useBusinessPortal;
        this.useSso = obj.useSso;
        this.selfHost = obj.selfHost;
        this.usersGetPremium = obj.usersGetPremium;
        this.seats = obj.seats;
        this.maxCollections = obj.maxCollections;
        this.maxStorageGb = obj.maxStorageGb;
        this.ssoBound = obj.ssoBound;
        this.identifier = obj.identifier;
        this.accessBusinessPortal = obj.accessBusinessPortal;
        this.accessEventLogs = obj.accessEventLogs;
        this.accessImportExport = obj.accessImportExport;
        this.accessReports = obj.accessReports;
        this.manageAllCollections = obj.manageAllCollections;
        this.manageAssignedCollections = obj.manageAssignedCollections;
        this.manageGroups = obj.manageGroups;
        this.managePolicies = obj.managePolicies;
        this.manageUsers = obj.manageUsers;
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

    get canAccessBusinessPortal() {
        return this.isAdmin || this.accessBusinessPortal;
    }

    get canAccessEventLogs() {
        return this.isAdmin || this.accessEventLogs;
    }

    get canAccessImportExport() {
        return this.isAdmin || this.accessImportExport;
    }

    get canAccessReports() {
        return this.isAdmin || this.accessReports;
    }

    get canManageAllCollections() {
        return this.isAdmin || this.manageAllCollections;
    }

    get canManageAssignedCollections() {
        return this.isManager || this.manageAssignedCollections;
    }

    get canManageGroups() {
        return this.isAdmin || this.manageGroups;
    }

    get canManagePolicies() {
        return this.isAdmin || this.managePolicies;
    }

    get canManageUsers() {
        return this.isAdmin || this.manageUsers;
    }
}
