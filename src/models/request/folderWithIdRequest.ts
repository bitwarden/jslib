import { FolderRequest } from './folderRequest';

import { Folder } from '../domain/folder';

export class FolderWithIdRequest extends FolderRequest {
    id: string;

    constructor(folder: Folder) {
        super(folder);
        this.id = folder.id;
    }
}
