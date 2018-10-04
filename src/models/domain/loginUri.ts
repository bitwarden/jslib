import { UriMatchType } from '../../enums/uriMatchType';

import { LoginUriData } from '../data/loginUriData';

import { LoginUriView } from '../view/loginUriView';

import { CipherString } from './cipherString';
import Domain from './domainBase';

export class LoginUri extends Domain {
    uri: CipherString;
    match: UriMatchType;

    constructor(obj?: LoginUriData, alreadyEncrypted: boolean = false) {
        super();
        if (obj == null) {
            return;
        }

        this.match = obj.match;
        this.buildDomainModel(this, obj, {
            uri: null,
        }, alreadyEncrypted, []);
    }

    decrypt(orgId: string): Promise<LoginUriView> {
        return this.decryptObj(new LoginUriView(this), {
            uri: null,
        }, orgId);
    }

    toLoginUriData(): LoginUriData {
        const u = new LoginUriData();
        this.buildDataModel(this, u, {
            uri: null,
        }, ['match']);
        return u;
    }
}
