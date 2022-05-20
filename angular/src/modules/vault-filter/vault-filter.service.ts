import { Injectable } from "@angular/core";

import { ApiService } from "jslib-common/abstractions/api.service";
import { CipherService } from "jslib-common/abstractions/cipher.service";
import { CollectionService } from "jslib-common/abstractions/collection.service";
import { FolderService } from "jslib-common/abstractions/folder.service";
import { OrganizationService } from "jslib-common/abstractions/organization.service";
import { PolicyService } from "jslib-common/abstractions/policy.service";
import { StateService } from "jslib-common/abstractions/state.service";
import { PolicyType } from "jslib-common/enums/policyType";
import { CollectionData } from "jslib-common/models/data/collectionData";
import { Collection } from "jslib-common/models/domain/collection";
import { Organization } from "jslib-common/models/domain/organization";
import { CollectionDetailsResponse } from "jslib-common/models/response/collectionResponse";
import { CollectionView } from "jslib-common/models/view/collectionView";
import { FolderView } from "jslib-common/models/view/folderView";

import { DynamicTreeNode } from "./models/dynamic-tree-node.model";
import { VaultFilter } from "./models/vault-filter.model";

@Injectable()
export class VaultFilterService {
  constructor(
    protected stateService: StateService,
    protected organizationService: OrganizationService,
    protected folderService: FolderService,
    protected cipherService: CipherService,
    protected collectionService: CollectionService,
    protected policyService: PolicyService,
    protected apiService: ApiService
  ) {}

  async storeCollapsedFilterNodes(collapsedFilterNodes: Set<string>): Promise<void> {
    await this.stateService.setCollapsedGroupings(Array.from(collapsedFilterNodes));
  }

  async buildCollapsedFilterNodes(): Promise<Set<string>> {
    return new Set(await this.stateService.getCollapsedGroupings());
  }

  async buildOrganizations(): Promise<Organization[]> {
    return await this.organizationService.getAll();
  }

  async buildFolders(organizationId?: string): Promise<DynamicTreeNode<FolderView>> {
    const storedFolders = await this.folderService.getAllDecrypted();
    let folders: FolderView[];
    if (organizationId != null) {
      const ciphers = await this.cipherService.getAllDecrypted();
      const orgCiphers = ciphers.filter((c) => c.organizationId == organizationId);
      folders = storedFolders.filter(
        (f) =>
          orgCiphers.filter((oc) => oc.folderId == f.id).length > 0 ||
          ciphers.filter((c) => c.folderId == f.id).length < 1
      );
    } else {
      folders = storedFolders;
    }
    const nestedFolders = await this.folderService.getAllNested(folders);
    return new DynamicTreeNode<FolderView>({
      fullList: folders,
      nestedList: nestedFolders,
    });
  }

  async buildCollections(vaultFilter: VaultFilter): Promise<DynamicTreeNode<CollectionView>> {
    const collections = vaultFilter.useAdminCollections
      ? await this.getAdminCollections(vaultFilter.selectedOrganizationId)
      : await this.getUserCollections(vaultFilter.selectedOrganizationId);

    const nestedCollections = await this.collectionService.getAllNested(collections);
    return new DynamicTreeNode<CollectionView>({
      fullList: collections,
      nestedList: nestedCollections,
    });
  }

  private async getAdminCollections(organizationId: string) {
    let result: CollectionView[] = [];

    const collectionResponse = await this.apiService.getCollections(organizationId);
    if (collectionResponse?.data != null && collectionResponse.data.length) {
      const collectionDomains = collectionResponse.data.map(
        (r: CollectionDetailsResponse) => new Collection(new CollectionData(r))
      );
      result = await this.collectionService.decryptMany(collectionDomains);
    }

    return result;
  }

  private async getUserCollections(organizationId?: string): Promise<CollectionView[]> {
    const storedCollections = await this.collectionService.getAllDecrypted();
    return organizationId != null
      ? storedCollections.filter((c) => c.organizationId === organizationId)
      : storedCollections;
  }

  async checkForSingleOrganizationPolicy(): Promise<boolean> {
    return await this.policyService.policyAppliesToUser(PolicyType.SingleOrg);
  }

  async checkForPersonalOwnershipPolicy(): Promise<boolean> {
    return await this.policyService.policyAppliesToUser(PolicyType.PersonalOwnership);
  }
}
