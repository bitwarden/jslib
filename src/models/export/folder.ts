import { FolderView } from '../view/folderView';

import { Folder as FolderDomain } from '../domain/folder';

export class Folder {
    static template(): Folder {
        const req = new Folder();
        req.name = 'Folder name';
        return req;
    }

    static toView(req: Folder, view = new FolderView()) {
        view.name = req.name;
        return view;
    }

    name: string;

    // Use build method instead of ctor so that we can control order of JSON stringify for pretty print
    build(o: FolderView | FolderDomain) {
        if (o instanceof FolderView) {
            this.name = o.name;
        } else {
            this.name = o.name?.encryptedString;
        }
    }
}
