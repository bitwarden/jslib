import { Organization } from "jslib-common/models/domain/organization";
import { CollectionView } from "jslib-common/models/view/collectionView";
import { FolderView } from "jslib-common/models/view/folderView";

import { DynamicTreeNode } from "./models/dynamic-tree-node.model";

export abstract class VaultFilterServiceInterface {
  storeCollapsedFilterNodes: (collapsedFilterNodes: Set<string>) => Promise<void>;
  buildCollapsedFilterNodes: () => Promise<Set<string>>;
  buildOrganizations: () => Promise<Organization[]>;
  buildFolders: (organizationId?: string) => Promise<DynamicTreeNode<FolderView>>;
  buildCollections: (organizationId?: string) => Promise<DynamicTreeNode<CollectionView>>;
  checkForSingleOrganizationPolicy: () => Promise<boolean>;
  checkForPersonalOwnershipPolicy: () => Promise<boolean>;
}
