import { LoginUri } from './loginUri';

import { LoginData } from '../data/loginData';

import { LoginView } from '../view/loginView';

import { CipherString } from './cipherString';
import Domain from './domainBase';

export class Login extends Domain {
    uris: LoginUri[];
    username: CipherString;
    password: CipherString;
    passwordRevisionDate?: Date;
    totp: CipherString;

    constructor(obj?: LoginData, alreadyEncrypted: boolean = false) {
        super();
        if (obj == null) {
            return;
        }

        this.passwordRevisionDate = obj.passwordRevisionDate != null ? new Date(obj.passwordRevisionDate) : null;
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

    toLoginData(): LoginData {
        const l = new LoginData();
        l.passwordRevisionDate = this.passwordRevisionDate != null ? this.passwordRevisionDate.toISOString() : null;
        this.buildDataModel(this, l, {
            username: null,
            password: null,
            totp: null,
        });

        if (this.uris != null && this.uris.length > 0) {
            l.uris = [];
            this.uris.forEach((u) => {
                l.uris.push(u.toLoginUriData());
            });
        }

        return l;
    }
}
