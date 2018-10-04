import { AttachmentData } from '../data/attachmentData';

import { CipherString } from './cipherString';
import Domain from './domainBase';

import { AttachmentView } from '../view/attachmentView';

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

    toAttachmentData(): AttachmentData {
        const a = new AttachmentData();
        this.buildDataModel(this, a, {
            id: null,
            url: null,
            sizeName: null,
            fileName: null,
        }, ['id', 'url', 'sizeName']);
        return a;
    }
}
