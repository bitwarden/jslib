import { PasswordHistoryData } from '../data/passwordHistoryData';

import { CipherString } from './cipherString';
import Domain from './domain';

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
            lastUsedDate: null,
        }, alreadyEncrypted, ['lastUsedDate']);
    }

    async decrypt(orgId: string): Promise<PasswordHistoryView> {
        const view = await this.decryptObj(new PasswordHistoryView(this), {
            password: null,
        }, orgId);
        return view;
    }

    toPasswordHistoryData(): PasswordHistoryData {
        const ph = new PasswordHistoryData();
        ph.lastUsedDate = this.lastUsedDate;
        this.buildDataModel(this, ph, {
            password: null,
        });
        return ph;
    }
}
