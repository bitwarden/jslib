import { View } from './view';

import { Folder } from '../domain/folder';
import { ITreeNodeObject } from '../domain/treeNode';

export class FolderView implements View, ITreeNodeObject {
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
