export enum Permissions {
    AccessBusinessPortal = 0,
    AccessEventLogs = 1,
    AccessImportExport = 2,
    AccessReports = 3,
    /**
     * @deprecated Sep 29 2021: This permission has been split out to `createNewCollections`, `editAnyCollection`, and
     * `deleteAnyCollection`. It exists here for backwards compatibility with Server versions <= 1.43.0
     */
    ManageAllCollections = 4,
    /**
     * @deprecated Sep 29 2021: This permission has been split out to `editAssignedCollections` and
     * `deleteAssignedCollections`. It exists here for backwards compatibility with Server versions <= 1.43.0
     */
    ManageAssignedCollections = 5,
    ManageGroups = 6,
    ManageOrganization = 7,
    ManagePolicies = 8,
    ManageProvider = 9,
    ManageUsers = 10,
    ManageUsersPassword = 11,
    CreateNewCollections = 12,
    EditAnyCollection = 13,
    DeleteAnyCollection = 14,
    EditAssignedCollections = 15,
    DeleteAssignedCollections = 16,
}
