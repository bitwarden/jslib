import { OrganizationUserStatusType } from "../../enums/organizationUserStatusType";
import { OrganizationUserType } from "../../enums/organizationUserType";
import { Permissions } from "../../enums/permissions";
import { ProductType } from "../../enums/productType";
import { PermissionsApi } from "../api/permissionsApi";
import { OrganizationData } from "../data/organizationData";

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
  familySponsorshipFriendlyName: string;
  familySponsorshipAvailable: boolean;
  planProductType: ProductType;
  keyConnectorEnabled: boolean;
  keyConnectorUrl: string;
  familySponsorshipLastSyncDate?: Date;
  familySponsorshipValidUntil?: Date;
  familySponsorshipToDelete?: boolean;

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
    this.useSso = obj.useSso;
    this.useKeyConnector = obj.useKeyConnector;
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
    this.familySponsorshipFriendlyName = obj.familySponsorshipFriendlyName;
    this.familySponsorshipAvailable = obj.familySponsorshipAvailable;
    this.planProductType = obj.planProductType;
    this.keyConnectorEnabled = obj.keyConnectorEnabled;
    this.keyConnectorUrl = obj.keyConnectorUrl;
    this.familySponsorshipLastSyncDate = obj.familySponsorshipLastSyncDate;
    this.familySponsorshipValidUntil = obj.familySponsorshipValidUntil;
    this.familySponsorshipToDelete = obj.familySponsorshipToDelete;
  }

  get canAccess() {
    if (this.type === OrganizationUserType.Owner) {
      return true;
    }
    return this.enabled && this.status === OrganizationUserStatusType.Confirmed;
  }

  get isManager() {
    return (
      this.type === OrganizationUserType.Manager ||
      this.type === OrganizationUserType.Owner ||
      this.type === OrganizationUserType.Admin
    );
  }

  get isAdmin() {
    return this.type === OrganizationUserType.Owner || this.type === OrganizationUserType.Admin;
  }

  get isOwner() {
    return this.type === OrganizationUserType.Owner || this.isProviderUser;
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

  get canCreateNewCollections() {
    return (
      this.isManager ||
      (this.permissions.createNewCollections ?? this.permissions.manageAllCollections)
    );
  }

  get canEditAnyCollection() {
    return (
      this.isAdmin || (this.permissions.editAnyCollection ?? this.permissions.manageAllCollections)
    );
  }

  get canDeleteAnyCollection() {
    return (
      this.isAdmin ||
      (this.permissions.deleteAnyCollection ?? this.permissions.manageAllCollections)
    );
  }

  get canViewAllCollections() {
    return this.canCreateNewCollections || this.canEditAnyCollection || this.canDeleteAnyCollection;
  }

  get canEditAssignedCollections() {
    return (
      this.isManager ||
      (this.permissions.editAssignedCollections ?? this.permissions.manageAssignedCollections)
    );
  }

  get canDeleteAssignedCollections() {
    return (
      this.isManager ||
      (this.permissions.deleteAssignedCollections ?? this.permissions.manageAssignedCollections)
    );
  }

  get canViewAssignedCollections() {
    return this.canDeleteAssignedCollections || this.canEditAssignedCollections;
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

  get isExemptFromPolicies() {
    return this.canManagePolicies;
  }

  hasAnyPermission(permissions: Permissions[]) {
    const specifiedPermissions =
      (permissions.includes(Permissions.AccessEventLogs) && this.canAccessEventLogs) ||
      (permissions.includes(Permissions.AccessImportExport) && this.canAccessImportExport) ||
      (permissions.includes(Permissions.AccessReports) && this.canAccessReports) ||
      (permissions.includes(Permissions.CreateNewCollections) && this.canCreateNewCollections) ||
      (permissions.includes(Permissions.EditAnyCollection) && this.canEditAnyCollection) ||
      (permissions.includes(Permissions.DeleteAnyCollection) && this.canDeleteAnyCollection) ||
      (permissions.includes(Permissions.EditAssignedCollections) &&
        this.canEditAssignedCollections) ||
      (permissions.includes(Permissions.DeleteAssignedCollections) &&
        this.canDeleteAssignedCollections) ||
      (permissions.includes(Permissions.ManageGroups) && this.canManageGroups) ||
      (permissions.includes(Permissions.ManageOrganization) && this.isOwner) ||
      (permissions.includes(Permissions.ManagePolicies) && this.canManagePolicies) ||
      (permissions.includes(Permissions.ManageUsers) && this.canManageUsers) ||
      (permissions.includes(Permissions.ManageUsersPassword) && this.canManageUsersPassword) ||
      (permissions.includes(Permissions.ManageSso) && this.canManageSso) ||
      (permissions.includes(Permissions.ManageBilling) && this.canManageBilling);

    return specifiedPermissions && (this.enabled || this.isOwner);
  }

  get canManageBilling() {
    return this.isOwner && (this.isProviderUser || !this.hasProvider);
  }

  get hasProvider() {
    return this.providerId != null || this.providerName != null;
  }
}
