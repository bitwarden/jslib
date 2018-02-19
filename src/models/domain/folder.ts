import { FolderData } from '../data';

import { FolderView } from '../view';

import { CipherString } from './cipherString';
import Domain from './domain';

export class Folder extends Domain {
    id: string;
    name: CipherString;

    constructor(obj?: FolderData, alreadyEncrypted: boolean = false) {
        super();
        if (obj == null) {
            return;
        }

        this.buildDomainModel(this, obj, {
            id: null,
            name: null,
        }, alreadyEncrypted, ['id']);
    }

    decrypt(): Promise<FolderView> {
        return this.decryptObj(new FolderView(this), {
            name: null,
        }, null);
    }
}
