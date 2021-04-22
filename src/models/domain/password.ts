import { PasswordHistoryData } from '../data/passwordHistoryData';

import Domain from './domainBase';
import { EncString } from './encString';

import { PasswordHistoryView } from '../view/passwordHistoryView';
import { SymmetricCryptoKey } from './symmetricCryptoKey';

export class Password extends Domain {
    password: EncString;
    lastUsedDate: Date;

    constructor(obj?: PasswordHistoryData, alreadyEncrypted: boolean = false) {
        super();
        if (obj == null) {
            return;
        }

        this.buildDomainModel(this, obj, {
            password: null,
        }, alreadyEncrypted);
        this.lastUsedDate = new Date(obj.lastUsedDate);
    }

    decrypt(orgId: string, encKey?: SymmetricCryptoKey): Promise<PasswordHistoryView> {
         return this.decryptObj(new PasswordHistoryView(this), {
            password: null,
        }, orgId, encKey);
    }

    toPasswordHistoryData(): PasswordHistoryData {
        const ph = new PasswordHistoryData();
        ph.lastUsedDate = this.lastUsedDate.toISOString();
        this.buildDataModel(this, ph, {
            password: null,
        });
        return ph;
    }
}
