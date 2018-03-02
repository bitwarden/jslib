import { LoginUri } from './loginUri';

import { LoginData } from '../data/loginData';

import { LoginUriView } from '../view/loginUriView';
import { LoginView } from '../view/loginView';

import { CipherString } from './cipherString';
import Domain from './domain';

export class Login extends Domain {
    uris: LoginUri[];
    username: CipherString;
    password: CipherString;
    totp: CipherString;

    constructor(obj?: LoginData, alreadyEncrypted: boolean = false) {
        super();
        if (obj == null) {
            return;
        }

        this.buildDomainModel(this, obj, {
            username: null,
            password: null,
            totp: null,
        }, alreadyEncrypted, []);

        if (obj.uris) {
            this.uris = [];
            obj.uris.forEach((u) => {
                this.uris.push(new LoginUri(u, alreadyEncrypted));
            });
        }
    }

    async decrypt(orgId: string): Promise<LoginView> {
        const view = await this.decryptObj(new LoginView(this), {
            username: null,
            password: null,
            totp: null,
        }, orgId);

        if (this.uris != null) {
            view.uris = [];
            for (let i = 0; i < this.uris.length; i++) {
                const uri = await this.uris[i].decrypt(orgId);
                view.uris.push(uri);
            }
        }

        return view;
    }
}
