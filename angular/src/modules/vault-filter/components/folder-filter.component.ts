import { Directive, EventEmitter, Input, Output } from "@angular/core";

import { ITreeNodeObject } from "jslib-common/models/domain/treeNode";
import { FolderView } from "jslib-common/models/view/folderView";

import { DynamicTreeNode } from "../models/dynamic-tree-node.model";
import { TopLevelTreeNode } from "../models/top-level-tree-node.model";
import { VaultFilter } from "../models/vault-filter.model";

@Directive()
export class FolderFilterComponent {
  @Input() hide = false;
  @Input() collapsedFilterNodes: Set<string>;
  @Input() folderNodes: DynamicTreeNode<FolderView>;
  @Input() activeFilter: VaultFilter;

  @Output() onNodeCollapseStateChange: EventEmitter<ITreeNodeObject> =
    new EventEmitter<ITreeNodeObject>();
  @Output() onFilterChange: EventEmitter<VaultFilter> = new EventEmitter<VaultFilter>();
  @Output() onAddFolder = new EventEmitter();
  @Output() onEditFolder = new EventEmitter<FolderView>();

  get folders() {
    return this.folderNodes?.fullList;
  }

  get nestedFolders() {
    return this.folderNodes?.nestedList;
  }

  readonly foldersGrouping: TopLevelTreeNode = {
    id: "folders",
    name: "folders",
  };

  applyFilter(folder: FolderView) {
    this.activeFilter.resetFilter();
    this.activeFilter.selectedFolder = true;
    this.activeFilter.selectedFolderId = folder.id;
    this.onFilterChange.emit(this.activeFilter);
  }

  addFolder() {
    this.onAddFolder.emit();
  }

  editFolder(folder: FolderView) {
    this.onEditFolder.emit(folder);
  }

  isCollapsed(node: ITreeNodeObject) {
    return this.collapsedFilterNodes.has(node.id);
  }

  async toggleCollapse(node: ITreeNodeObject) {
    this.onNodeCollapseStateChange.emit(node);
  }
}
