import { CryptoService } from "jslib-common/abstractions/crypto.service";

import { Folder } from "../domain/folder";
import { SymmetricCryptoKey } from "../domain/symmetricCryptoKey";
import { ITreeNodeObject } from "../domain/treeNode";

export class FolderView implements ITreeNodeObject {
  id: string = null;
  name: string = null;
  revisionDate: Date = null;

  static async fromFolder(
    cryptoService: CryptoService,
    folder: Folder,
    key?: SymmetricCryptoKey
  ): Promise<FolderView> {
    const view = new FolderView();
    view.id = folder.id;
    view.name = await folder.name.decryptWithCryptoService(cryptoService, null, key);
    view.revisionDate = folder.revisionDate;

    return view;
  }
}
