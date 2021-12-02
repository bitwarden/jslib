import { CipherType } from '../../enums/cipherType';
import { CipherView } from '../view/cipherView';
import { CollectionView } from '../view/collectionView';
import { FolderView } from '../view/folderView';
import { BrowserComponentState } from './browserComponentState';

export class BrowserGroupingsComponentState extends BrowserComponentState {
    favoriteCiphers: CipherView[];
    noFolderCiphers: CipherView[];
    collectionCounts: Map<string, number>;
    typeCounts: Map<CipherType, number>;
    folders: FolderView[];
    collections: CollectionView[];
    deletedCount: number;
}
