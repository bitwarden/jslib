import { Directive, EventEmitter, Input, OnInit, Output } from "@angular/core";

import { Organization } from "jslib-common/models/domain/organization";
import { ITreeNodeObject } from "jslib-common/models/domain/treeNode";
import { CollectionView } from "jslib-common/models/view/collectionView";
import { FolderView } from "jslib-common/models/view/folderView";

import { DynamicTreeNode } from "./models/dynamic-tree-node.model";
import { VaultFilter } from "./models/vault-filter.model";
import { VaultFilterService } from "./vault-filter.service";

@Directive()
export class VaultFilterComponent implements OnInit {
  @Input() activeFilter: VaultFilter = new VaultFilter();
  @Input() hideFolders = false;
  @Input() hideCollections = false;
  @Input() hideFavorites = false;
  @Input() hideTrash = false;
  @Input() hideOrganizations = false;

  @Output() onFilterChange = new EventEmitter<VaultFilter>();
  @Output() onAddFolder = new EventEmitter<never>();
  @Output() onEditFolder = new EventEmitter<FolderView>();

  isLoaded = false;
  collapsedFilterNodes: Set<string>;
  organizations: Organization[];
  activePersonalOwnershipPolicy: boolean;
  activeSingleOrganizationPolicy: boolean;
  collections: DynamicTreeNode<CollectionView>;
  folders: DynamicTreeNode<FolderView>;

  constructor(protected vaultFilterService: VaultFilterService) {}

  get displayCollections() {
    return this.collections?.fullList != null && this.collections.fullList.length > 0;
  }

  async ngOnInit(): Promise<void> {
    this.collapsedFilterNodes = await this.vaultFilterService.buildCollapsedFilterNodes();
    this.organizations = await this.vaultFilterService.buildOrganizations();
    if (this.organizations != null && this.organizations.length > 0) {
      this.activePersonalOwnershipPolicy =
        await this.vaultFilterService.checkForPersonalOwnershipPolicy();
      this.activeSingleOrganizationPolicy =
        await this.vaultFilterService.checkForSingleOrganizationPolicy();
    }
    this.folders = await this.vaultFilterService.buildFolders();
    this.collections = await this.initCollections();
    this.isLoaded = true;
  }

  // overwritten in web for organization vaults
  async initCollections() {
    return await this.vaultFilterService.buildCollections();
  }

  async toggleFilterNodeCollapseState(node: ITreeNodeObject) {
    if (this.collapsedFilterNodes.has(node.id)) {
      this.collapsedFilterNodes.delete(node.id);
    } else {
      this.collapsedFilterNodes.add(node.id);
    }
    await this.vaultFilterService.storeCollapsedFilterNodes(this.collapsedFilterNodes);
  }

  async applyFilter(filter: VaultFilter) {
    if (filter.refreshCollectionsAndFolders) {
      await this.reloadCollectionsAndFolders(filter);
      filter = this.pruneInvalidatedFilterSelections(filter);
    }
    this.onFilterChange.emit(filter);
  }

  async reloadCollectionsAndFolders(filter: VaultFilter) {
    this.folders = await this.vaultFilterService.buildFolders(filter.selectedOrganizationId);
    this.collections = filter.myVaultOnly
      ? null
      : await this.vaultFilterService.buildCollections(filter.selectedOrganizationId);
  }

  async reloadOrganizations() {
    this.organizations = await this.vaultFilterService.buildOrganizations();
    this.activePersonalOwnershipPolicy =
      await this.vaultFilterService.checkForPersonalOwnershipPolicy();
    this.activeSingleOrganizationPolicy =
      await this.vaultFilterService.checkForSingleOrganizationPolicy();
  }

  addFolder() {
    this.onAddFolder.emit();
  }

  editFolder(folder: FolderView) {
    this.onEditFolder.emit(folder);
  }

  protected pruneInvalidatedFilterSelections(filter: VaultFilter): VaultFilter {
    filter = this.pruneInvalidFolderSelection(filter);
    filter = this.pruneInvalidCollectionSelection(filter);
    return filter;
  }

  protected pruneInvalidFolderSelection(filter: VaultFilter): VaultFilter {
    if (filter.selectedFolder && !this.folders?.hasId(filter.selectedFolderId)) {
      filter.selectedFolder = false;
      filter.selectedFolderId = null;
    }
    return filter;
  }

  protected pruneInvalidCollectionSelection(filter: VaultFilter): VaultFilter {
    if (
      filter.selectedCollectionId != null &&
      !this.collections?.hasId(filter.selectedCollectionId)
    ) {
      filter.selectedCollectionId = null;
    }
    return filter;
  }
}
