import { Folder } from './folder';

import { FolderView } from '../view/folderView';

export class FolderWithId extends Folder {
    id: string;

    // Use build method instead of ctor so that we can control order of JSON stringify for pretty print
    build(o: FolderView) {
        this.id = o.id;
        super.build(o);
    }
}
