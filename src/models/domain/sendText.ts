import Domain from './domainBase';
import { EncString } from './encString';
import { SymmetricCryptoKey } from './symmetricCryptoKey';

import { SendTextData } from '../data/sendTextData';

import { SendTextView } from '../view/sendTextView';

export class SendText extends Domain {
    text: EncString;
    hidden: boolean;

    constructor(obj?: SendTextData, alreadyEncrypted: boolean = false) {
        super();
        if (obj == null) {
            return;
        }

        this.hidden = obj.hidden;
        this.buildDomainModel(this, obj, {
            text: null,
        }, alreadyEncrypted, []);
    }

    decrypt(key: SymmetricCryptoKey): Promise<SendTextView> {
        return this.decryptObj(new SendTextView(this), {
            text: null,
        }, null, key);
    }
}
