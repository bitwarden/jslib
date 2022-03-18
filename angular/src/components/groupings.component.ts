import { Directive, EventEmitter, Input, Output } from "@angular/core";

import { CipherService } from "jslib-common/abstractions/cipher.service";
import { CollectionService } from "jslib-common/abstractions/collection.service";
import { FolderService } from "jslib-common/abstractions/folder.service";
import { OrganizationService } from "jslib-common/abstractions/organization.service";
import { StateService } from "jslib-common/abstractions/state.service";
import { CipherType } from "jslib-common/enums/cipherType";
import { Organization } from "jslib-common/models/domain/organization";
import { ITreeNodeObject, TreeNode } from "jslib-common/models/domain/treeNode";
import { CollectionView } from "jslib-common/models/view/collectionView";
import { FolderView } from "jslib-common/models/view/folderView";

export type TopLevelGroupingId = "vaults" | "types" | "collections" | "folders";
export class TopLevelGroupingView implements ITreeNodeObject {
  id: TopLevelGroupingId;
  name: string; // localizationString
}
@Directive()
export class GroupingsComponent {
  @Input() showFolders = true;
  @Input() showCollections = true;
  @Input() showFavorites = true;
  @Input() showTrash = true;
  @Input() showOrganizations = true;

  @Output() onAllClicked = new EventEmitter();
  @Output() onFavoritesClicked = new EventEmitter();
  @Output() onTrashClicked = new EventEmitter();
  @Output() onCipherTypeClicked = new EventEmitter<CipherType>();
  @Output() onFolderClicked = new EventEmitter<FolderView>();
  @Output() onAddFolder = new EventEmitter();
  @Output() onEditFolder = new EventEmitter<FolderView>();
  @Output() onCollectionClicked = new EventEmitter<CollectionView>();
  @Output() onOrganizationClicked = new EventEmitter<Organization>();
  @Output() onMyVaultClicked = new EventEmitter();
  @Output() onAllVaultsClicked = new EventEmitter();

  folders: FolderView[];
  nestedFolders: TreeNode<FolderView>[];
  collections: CollectionView[];
  nestedCollections: TreeNode<CollectionView>[];
  loaded = false;
  cipherType = CipherType;
  selectedAll = false;
  selectedFavorites = false;
  selectedTrash = false;
  selectedType: CipherType = null;
  selectedFolder = false;
  selectedFolderId: string = null;
  selectedCollectionId: string = null;
  selectedOrganizationId: string = null;
  organizations: Organization[];
  myVaultOnly = false;

  readonly vaultsGrouping: TopLevelGroupingView = {
    id: "vaults",
    name: "allVaults",
  };

  readonly typesGrouping: TopLevelGroupingView = {
    id: "types",
    name: "types",
  };

  readonly collectionsGrouping: TopLevelGroupingView = {
    id: "collections",
    name: "collections",
  };

  readonly foldersGrouping: TopLevelGroupingView = {
    id: "folders",
    name: "folders",
  };

  private collapsedGroupings: Set<string>;

  constructor(
    protected collectionService: CollectionService,
    protected folderService: FolderService,
    protected stateService: StateService,
    protected organizationService: OrganizationService,
    protected cipherService: CipherService
  ) {}

  async load(setLoaded = true) {
    const collapsedGroupings = await this.stateService.getCollapsedGroupings();
    if (collapsedGroupings == null) {
      this.collapsedGroupings = new Set<string>();
    } else {
      this.collapsedGroupings = new Set(collapsedGroupings);
    }

    await this.loadFolders();
    await this.loadCollections();
    await this.loadOrganizations();

    if (setLoaded) {
      this.loaded = true;
    }
  }

  async loadCollections(organizationId?: string) {
    if (!this.showCollections) {
      return;
    }
    const collections = await this.collectionService.getAllDecrypted();
    if (organizationId != null) {
      this.collections = collections.filter((c) => c.organizationId === organizationId);
    } else {
      this.collections = collections;
    }
    this.nestedCollections = await this.collectionService.getAllNested(this.collections);
  }

  async loadFolders(organizationId?: string) {
    if (!this.showFolders) {
      return;
    }
    const folders = await this.folderService.getAllDecrypted();
    if (organizationId != null) {
      const ciphers = await this.cipherService.getAllDecrypted();
      const orgCiphers = ciphers.filter((c) => c.organizationId == organizationId);
      this.folders = folders.filter(
        (f) =>
          f.id != null &&
          (orgCiphers.filter((oc) => oc.folderId == f.id).length > 0 ||
            ciphers.filter((c) => c.folderId == f.id).length < 1)
      );
    } else {
      this.folders = folders;
    }
    this.nestedFolders = await this.folderService.getAllNested(this.folders);
  }

  async loadOrganizations() {
    this.showOrganizations = await this.organizationService.hasOrganizations();
    if (!this.showOrganizations) {
      return;
    }
    this.organizations = await this.organizationService.getAll();
  }

  selectAll() {
    this.clearSelections();
    this.selectedAll = true;
    this.onAllClicked.emit();
  }

  selectFavorites() {
    this.clearSelections();
    this.selectedFavorites = true;
    this.onFavoritesClicked.emit();
  }

  selectTrash() {
    this.clearSelections();
    this.selectedTrash = true;
    this.onTrashClicked.emit();
  }

  selectType(type: CipherType) {
    this.clearSelections();
    this.selectedType = type;
    this.onCipherTypeClicked.emit(type);
  }

  selectFolder(folder: FolderView) {
    this.clearSelections();
    this.selectedFolder = true;
    this.selectedFolderId = folder.id;
    this.onFolderClicked.emit(folder);
  }

  addFolder() {
    this.onAddFolder.emit();
  }

  editFolder(folder: FolderView) {
    this.onEditFolder.emit(folder);
  }

  selectCollection(collection: CollectionView) {
    this.clearSelections();
    this.selectedCollectionId = collection.id;
    this.onCollectionClicked.emit(collection);
  }

  async selectOrganization(organization: Organization) {
    this.clearSelectedOrganization();
    this.selectedOrganizationId = organization.id;
    await this.reloadCollectionsAndFolders(this.selectedOrganizationId);
    this.onOrganizationClicked.emit(organization);
  }

  async selectMyVault() {
    this.clearSelectedOrganization();
    this.myVaultOnly = true;
    await this.reloadCollectionsAndFolders(this.selectedOrganizationId);
    this.onMyVaultClicked.emit();
  }

  async selectAllVaults() {
    this.clearSelectedOrganization();
    await this.reloadCollectionsAndFolders(this.selectedOrganizationId);
    this.onAllVaultsClicked.emit();
  }

  clearSelections() {
    this.selectedAll = false;
    this.selectedFavorites = false;
    this.selectedTrash = false;
    this.selectedType = null;
    this.selectedFolder = false;
    this.selectedFolderId = null;
    this.selectedCollectionId = null;
  }

  clearSelectedOrganization() {
    this.selectedOrganizationId = null;
    this.myVaultOnly = false;
    const clearingFolderOrCollectionSelection =
      this.selectedFolderId != null || this.selectedCollectionId != null;
    if (clearingFolderOrCollectionSelection) {
      this.selectedFolder = false;
      this.selectedFolderId = null;
      this.selectedCollectionId = null;
      this.selectedAll = true;
    }
  }

  async collapse(node: ITreeNodeObject, idPrefix = "") {
    if (node.id == null) {
      return;
    }
    const id = idPrefix + node.id;
    if (this.isCollapsed(node, idPrefix)) {
      this.collapsedGroupings.delete(id);
    } else {
      this.collapsedGroupings.add(id);
    }
    await this.stateService.setCollapsedGroupings(Array.from(this.collapsedGroupings));
  }

  isCollapsed(node: ITreeNodeObject, idPrefix = "") {
    return this.collapsedGroupings.has(idPrefix + node.id);
  }

  private async reloadCollectionsAndFolders(organizationId?: string) {
    await this.loadCollections(organizationId);
    await this.loadFolders(organizationId);
  }
}
