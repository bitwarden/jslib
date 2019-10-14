import { PasswordHistoryData } from '../data/passwordHistoryData';

import { CipherString } from './cipherString';
import Domain from './domainBase';

import { PasswordHistoryView } from '../view/passwordHistoryView';

export class Password extends Domain {
    password: CipherString;
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

    decrypt(orgId: string): Promise<PasswordHistoryView> {
         return this.decryptObj(new PasswordHistoryView(this), {
            password: null,
        }, orgId);
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
