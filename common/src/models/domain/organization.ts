import { OrganizationData } from '../data/organizationData';

import { OrganizationUserStatusType } from '../../enums/organizationUserStatusType';
import { OrganizationUserType } from '../../enums/organizationUserType';
import { PermissionsApi } from '../api/permissionsApi';


export class Organization {
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
        this.useResetPassword = obj.useResetPassword;
        this.selfHost = obj.selfHost;
        this.usersGetPremium = obj.usersGetPremium;
        this.seats = obj.seats;
        this.maxCollections = obj.maxCollections;
        this.maxStorageGb = obj.maxStorageGb;
        this.ssoBound = obj.ssoBound;
        this.identifier = obj.identifier;
        this.permissions = obj.permissions;
        this.resetPasswordEnrolled = obj.resetPasswordEnrolled;
        this.userId = obj.userId;
        this.hasPublicAndPrivateKeys = obj.hasPublicAndPrivateKeys;
        this.providerId = obj.providerId;
        this.providerName = obj.providerName;
        this.isProviderUser = obj.isProviderUser;
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
        return this.isAdmin || this.permissions.accessBusinessPortal;
    }

    get canAccessEventLogs() {
        return this.isAdmin || this.permissions.accessEventLogs;
    }

    get canAccessImportExport() {
        return this.isAdmin || this.permissions.accessImportExport;
    }

    get canAccessReports() {
        return this.isAdmin || this.permissions.accessReports;
    }

    get canManageAllCollections() {
        return this.isAdmin || this.permissions.manageAllCollections;
    }

    get canManageAssignedCollections() {
        return this.isManager || this.permissions.manageAssignedCollections;
    }

    get canManageGroups() {
        return this.isAdmin || this.permissions.manageGroups;
    }

    get canManageSso() {
        return this.isAdmin || this.permissions.manageSso;
    }

    get canManagePolicies() {
        return this.isAdmin || this.permissions.managePolicies;
    }

    get canManageUsers() {
        return this.isAdmin || this.permissions.manageUsers;
    }

    get canManageUsersPassword() {
        return this.isAdmin || this.permissions.manageResetPassword;
    }
}
