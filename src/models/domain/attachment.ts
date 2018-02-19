import { AttachmentData } from '../data';

import { CipherString } from './cipherString';
import Domain from './domain';

import { AttachmentView } from '../view';

export class Attachment extends Domain {
    id: string;
    url: string;
    size: number;
    sizeName: string;
    fileName: CipherString;

    constructor(obj?: AttachmentData, alreadyEncrypted: boolean = false) {
        super();
        if (obj == null) {
            return;
        }

        this.size = obj.size;
        this.buildDomainModel(this, obj, {
            id: null,
            url: null,
            sizeName: null,
            fileName: null,
        }, alreadyEncrypted, ['id', 'url', 'sizeName']);
    }

    decrypt(orgId: string): Promise<AttachmentView> {
        return this.decryptObj(new AttachmentView(this), {
            fileName: null,
        }, orgId);
    }
}
