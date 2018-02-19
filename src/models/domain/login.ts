import { LoginData } from '../data';

import { LoginView } from '../view';

import { CipherString } from './cipherString';
import Domain from './domain';

export class Login extends Domain {
    uri: CipherString;
    username: CipherString;
    password: CipherString;
    totp: CipherString;

    constructor(obj?: LoginData, alreadyEncrypted: boolean = false) {
        super();
        if (obj == null) {
            return;
        }

        this.buildDomainModel(this, obj, {
            uri: null,
            username: null,
            password: null,
            totp: null,
        }, alreadyEncrypted, []);
    }

    decrypt(orgId: string): Promise<LoginView> {
        return this.decryptObj(new LoginView(this), {
            uri: null,
            username: null,
            password: null,
            totp: null,
        }, orgId);
    }
}
