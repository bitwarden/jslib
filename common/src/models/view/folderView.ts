import { ITreeNodeObject } from "../domain/treeNode";

import { View } from "./view";

export class FolderView implements View, ITreeNodeObject {
  id: string = null;
  name: string = null;
  revisionDate: Date = null;
}
