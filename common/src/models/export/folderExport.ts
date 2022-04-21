import { EncString } from "../domain/encString";
import { Folder as FolderDomain } from "../domain/folder";
import { FolderDecrypted } from "../view/folderDecrypted";

export class FolderExport {
  static template(): FolderExport {
    const req = new FolderExport();
    req.name = "Folder name";
    return req;
  }

  static toView(req: FolderExport, view = new FolderDecrypted()) {
    view.name = req.name;
    return view;
  }

  static toDomain(req: FolderExport, domain: FolderDomain = {} as FolderDomain) {
    domain.name = req.name != null ? new EncString(req.name) : null;
    return domain;
  }

  name: string;

  // Use build method instead of ctor so that we can control order of JSON stringify for pretty print
  build(o: FolderDecrypted | FolderDomain) {
    if (o instanceof FolderDecrypted) {
      this.name = o.name;
    } else {
      this.name = o.name?.encryptedString;
    }
  }
}
