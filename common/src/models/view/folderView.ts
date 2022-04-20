import { CryptoService } from "jslib-common/abstractions/crypto.service";

import { Folder } from "../domain/folder";
import { ITreeNodeObject } from "../domain/treeNode";

export class FolderView implements ITreeNodeObject {
  id: string = null;
  name: string = null;
  revisionDate: Date = null;

  async encrypt(cryptoService: CryptoService): Promise<Folder> {
    return {
      id: this.id,
      name: await cryptoService.encrypt(this.name),
      revisionDate: null,
    };
  }

  static async fromFolder(cryptoService: CryptoService, folder: Folder): Promise<FolderView> {
    const view = new FolderView();
    view.id = folder.id;
    view.name = await folder.name.decryptWithCryptoService(cryptoService);
    view.revisionDate = folder.revisionDate;

    return view;
  }
}
