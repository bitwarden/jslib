import { CipherView } from '../view/cipherView';
import { CollectionView } from '../view/collectionView';
import { FolderView } from '../view/folderView';

export class ImportResult {
    success = false;
    errorMessage: string;
    ciphers: CipherView[] = [];
    folders: FolderView[] = [];
    folderRelationships: Map<number, number> = new Map<number, number>();
    collections: CollectionView[] = [];
    collectionRelationships: Map<number, number> = new Map<number, number>();
}
