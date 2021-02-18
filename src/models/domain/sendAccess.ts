import { SendType } from '../../enums/sendType';

import { SendAccessResponse } from '../response/sendAccessResponse';

import { SendAccessView } from '../view/sendAccessView';

import { CipherString } from './cipherString';
import Domain from './domainBase';
import { SendFile } from './sendFile';
import { SendText } from './sendText';
import { SymmetricCryptoKey } from './symmetricCryptoKey';

export class SendAccess extends Domain {
    id: string;
    type: SendType;
    name: CipherString;
    file: SendFile;
    text: SendText;

    constructor(obj?: SendAccessResponse, alreadyEncrypted: boolean = false) {
        super();
        if (obj == null) {
            return;
        }

        this.buildDomainModel(this, obj, {
            id: null,
            name: null,
        }, alreadyEncrypted, ['id']);

        this.type = obj.type;

        switch (this.type) {
            case SendType.Text:
                this.text = new SendText(obj.text, alreadyEncrypted);
                break;
            case SendType.File:
                this.file = new SendFile(obj.file, alreadyEncrypted);
                break;
            default:
                break;
        }
    }

    async decrypt(key: SymmetricCryptoKey): Promise<SendAccessView> {
        const model = new SendAccessView(this);

        await this.decryptObj(model, {
            name: null,
        }, null, key);

        switch (this.type) {
            case SendType.File:
                model.file = await this.file.decrypt(key);
                break;
            case SendType.Text:
                model.text = await this.text.decrypt(key);
                break;
            default:
                break;
        }

        return model;
    }
}
