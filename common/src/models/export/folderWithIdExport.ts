import { Folder as FolderDomain } from "../domain/folder";
import { FolderView } from "../view/folderView";

import { FolderExport } from "./folderExport";

export class FolderWithIdExport extends FolderExport {
  id: string;

  // Use build method instead of ctor so that we can control order of JSON stringify for pretty print
  build(o: FolderView | FolderDomain) {
    this.id = o.id;
    super.build(o);
  }
}
