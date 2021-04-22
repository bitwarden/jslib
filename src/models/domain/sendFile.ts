import Domain from './domainBase';
import { EncString } from './encString';
import { SymmetricCryptoKey } from './symmetricCryptoKey';

import { SendFileData } from '../data/sendFileData';

import { SendFileView } from '../view/sendFileView';

export class SendFile extends Domain {
    id: string;
    size: string;
    sizeName: string;
    fileName: EncString;

    constructor(obj?: SendFileData, alreadyEncrypted: boolean = false) {
        super();
        if (obj == null) {
            return;
        }

        this.size = obj.size;
        this.buildDomainModel(this, obj, {
            id: null,
            sizeName: null,
            fileName: null,
        }, alreadyEncrypted, ['id', 'sizeName']);
    }

    async decrypt(key: SymmetricCryptoKey): Promise<SendFileView> {
        const view = await this.decryptObj(new SendFileView(this), {
            fileName: null,
        }, null, key);
        return view;
    }
}
