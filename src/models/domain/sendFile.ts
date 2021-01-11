import { CipherString } from './cipherString';
import Domain from './domainBase';
import { SymmetricCryptoKey } from './symmetricCryptoKey';

import { SendFileData } from '../data/sendFileData';

import { SendFileView } from '../view/sendFileView';

export class SendFile extends Domain {
    id: string;
    url: string;
    size: string;
    sizeName: string;
    fileName: CipherString;

    constructor(obj?: SendFileData, alreadyEncrypted: boolean = false) {
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

    async decrypt(key: SymmetricCryptoKey): Promise<SendFileView> {
        const view = await this.decryptObj(new SendFileView(this), {
            fileName: null,
        }, null, key);
        return view;
    }
}
