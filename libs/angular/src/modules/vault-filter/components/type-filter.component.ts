import { Directive, EventEmitter, Input, Output } from "@angular/core";

import { CipherType } from "jslib-common/enums/cipherType";
import { ITreeNodeObject } from "jslib-common/models/domain/treeNode";

import { TopLevelTreeNode } from "../models/top-level-tree-node.model";
import { VaultFilter } from "../models/vault-filter.model";

@Directive()
export class TypeFilterComponent {
  @Input() hide = false;
  @Input() collapsedFilterNodes: Set<string>;
  @Input() selectedCipherType: CipherType = null;
  @Input() activeFilter: VaultFilter;

  @Output() onNodeCollapseStateChange: EventEmitter<ITreeNodeObject> =
    new EventEmitter<ITreeNodeObject>();
  @Output() onFilterChange: EventEmitter<VaultFilter> = new EventEmitter<VaultFilter>();

  readonly typesNode: TopLevelTreeNode = {
    id: "types",
    name: "types",
  };

  cipherTypeEnum = CipherType; // used in the template

  get isCollapsed() {
    return this.collapsedFilterNodes.has(this.typesNode.id);
  }

  applyFilter(cipherType: CipherType) {
    this.activeFilter.resetFilter();
    this.activeFilter.cipherType = cipherType;
    this.onFilterChange.emit(this.activeFilter);
  }

  async toggleCollapse() {
    this.onNodeCollapseStateChange.emit(this.typesNode);
  }
}
