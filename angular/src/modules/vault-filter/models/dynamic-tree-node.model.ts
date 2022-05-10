import { TreeNode } from "jslib-common/models/domain/treeNode";
import { CollectionView } from "jslib-common/models/view/collectionView";
import { FolderView } from "jslib-common/models/view/folderView";

export class DynamicTreeNode<T extends CollectionView | FolderView> {
  fullList: T[];
  nestedList: TreeNode<T>[];

  hasId(id: string): boolean {
    return this.fullList != null && this.fullList.filter((i: T) => i.id === id).length > 0;
  }

  constructor(init?: Partial<DynamicTreeNode<T>>) {
    Object.assign(this, init);
  }
}
