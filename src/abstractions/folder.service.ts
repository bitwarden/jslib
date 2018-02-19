import { FolderData } from '../models/data';

import { Folder } from '../models/domain';

import { FolderView } from '../models/view';

export abstract class FolderService {
    decryptedFolderCache: FolderView[];

    clearCache: () => void;
    encrypt: (model: FolderView) => Promise<Folder>;
    get: (id: string) => Promise<Folder>;
    getAll: () => Promise<Folder[]>;
    getAllDecrypted: () => Promise<FolderView[]>;
    saveWithServer: (folder: Folder) => Promise<any>;
    upsert: (folder: FolderData | FolderData[]) => Promise<any>;
    replace: (folders: { [id: string]: FolderData; }) => Promise<any>;
    clear: (userId: string) => Promise<any>;
    delete: (id: string | string[]) => Promise<any>;
    deleteWithServer: (id: string) => Promise<any>;
}
