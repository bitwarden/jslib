import { View } from './view';

import { Folder } from '../domain/folder';

export class FolderView implements View {
    id: string = null;
    name: string;
    revisionDate: Date;

    constructor(f?: Folder) {
        if (!f) {
            return;
        }

        this.id = f.id;
        this.revisionDate = f.revisionDate;
    }
}
