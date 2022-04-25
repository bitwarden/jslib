import { CryptoService } from "jslib-common/abstractions/crypto.service";

import { Folder } from "../domain/folder";
import { SymmetricCryptoKey } from "../domain/symmetricCryptoKey";
import { ITreeNodeObject } from "../domain/treeNode";

export class FolderDecrypted implements ITreeNodeObject {
  id: string = null;
  name: string = null;
  revisionDate: Date = null;

  async encrypt(cryptoService: CryptoService, key?: SymmetricCryptoKey): Promise<Folder> {
    return {
      id: this.id,
      name: await cryptoService.encrypt(this.name, key),
      revisionDate: null,
    };
  }

  static async fromFolder(cryptoService: CryptoService, folder: Folder): Promise<FolderDecrypted> {
    const view = new FolderDecrypted();
    view.id = folder.id;
    view.name = await folder.name.decryptWithCryptoService(cryptoService);
    view.revisionDate = folder.revisionDate;

    return view;
  }
}
