import { FolderData } from '../data/folderData';

import { FolderView } from '../view/folderView';

import { CipherString } from './cipherString';
import Domain from './domainBase';

export class Folder extends Domain {
    id: string;
    name: CipherString;
    revisionDate: Date;

    constructor(obj?: FolderData, alreadyEncrypted: boolean = false) {
        super();
        if (obj == null) {
            return;
        }

        this.buildDomainModel(this, obj, {
            id: null,
            name: null,
        }, alreadyEncrypted, ['id']);

        this.revisionDate = obj.revisionDate != null ? new Date(obj.revisionDate) : null;
    }

    decrypt(): Promise<FolderView> {
        return this.decryptObj(new FolderView(this), {
            name: null,
        }, null);
    }
}
