import { EncString } from "../domain/encString";
import { Folder } from "../domain/folder";

export class FolderData {
  id: string;
  name: string;
  revisionDate: string;

  constructor(f?: Folder) {
    if (f) {
      this.id = f.id;
      this.name = f.name.encryptedString;
      this.revisionDate = f.revisionDate.toISOString();
    }
  }

  toFolder(): Folder {
    return {
      id: this.id,
      name: new EncString(this.name),
      revisionDate: new Date(this.revisionDate),
    };
  }
}
