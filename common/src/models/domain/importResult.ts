import { CipherView } from "../view/cipherView";
import { CollectionView } from "../view/collectionView";
import { FolderDecrypted } from "../view/folderDecrypted";

export class ImportResult {
  success = false;
  missingPassword = false;
  errorMessage: string;
  ciphers: CipherView[] = [];
  folders: FolderDecrypted[] = [];
  folderRelationships: [number, number][] = [];
  collections: CollectionView[] = [];
  collectionRelationships: [number, number][] = [];
}
