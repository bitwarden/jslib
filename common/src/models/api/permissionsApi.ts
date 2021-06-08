import { BaseResponse } from '../response/baseResponse';

export class PermissionsApi extends BaseResponse {
    accessBusinessPortal: boolean;
    accessEventLogs: boolean;
    accessImportExport: boolean;
    accessReports: boolean;
    manageAllCollections: boolean;
    manageAssignedCollections: boolean;
    manageCiphers: boolean;
    manageGroups: boolean;
    manageSso: boolean;
    managePolicies: boolean;
    manageUsers: boolean;
    manageResetPassword: boolean;

    constructor(data: any = null) {
        super(data);
        if (data == null) {
            return this;
        }
        this.accessBusinessPortal = this.getResponseProperty('AccessBusinessPortal');
        this.accessEventLogs = this.getResponseProperty('AccessEventLogs');
        this.accessImportExport = this.getResponseProperty('AccessImportExport');
        this.accessReports = this.getResponseProperty('AccessReports');
        this.manageAllCollections = this.getResponseProperty('ManageAllCollections');
        this.manageAssignedCollections = this.getResponseProperty('ManageAssignedCollections');
        this.manageCiphers = this.getResponseProperty('ManageCiphers');
        this.manageGroups = this.getResponseProperty('ManageGroups');
        this.manageSso = this.getResponseProperty('ManageSso');
        this.managePolicies = this.getResponseProperty('ManagePolicies');
        this.manageUsers = this.getResponseProperty('ManageUsers');
        this.manageResetPassword = this.getResponseProperty('ManageResetPassword');
    }
}
