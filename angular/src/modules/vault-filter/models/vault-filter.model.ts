import { CipherType } from "jslib-common/enums/cipherType";

import { CipherStatus } from "./cipher-status.model";

export class VaultFilter {
  cipherType?: CipherType;
  selectedCollectionId?: string;
  status?: CipherStatus;
  selectedFolder = false; // This is needed because of how the "No Folder" folder works. It has a null id.
  selectedFolderId?: string;
  selectedOrganizationId?: string;
  myVaultOnly = false;
  refreshCollectionsAndFolders = false;

  constructor(init?: Partial<VaultFilter>) {
    Object.assign(this, init);
  }

  resetFilter() {
    this.cipherType = null;
    this.status = null;
    this.selectedCollectionId = null;
    this.selectedFolder = false;
    this.selectedFolderId = null;
  }

  resetOrganization() {
    this.myVaultOnly = false;
    this.selectedOrganizationId = null;
    this.resetFilter();
  }
}
