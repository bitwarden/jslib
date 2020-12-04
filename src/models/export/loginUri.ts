import { UriMatchType } from '../../enums/uriMatchType';

import { LoginUriView } from '../view/loginUriView';

import { CipherString } from '../domain/cipherString';
import { LoginUri as LoginUriDomain } from '../domain/loginUri';

export class LoginUri {
    static template(): LoginUri {
        const req = new LoginUri();
        req.uri = 'https://google.com';
        req.match = null;
        return req;
    }

    static toView(req: LoginUri, view = new LoginUriView()) {
        view.uri = req.uri;
        view.match = req.match;
        return view;
    }

    static toDomain(req: LoginUri, domain = new LoginUriDomain()) {
        domain.uri = req.uri != null ? new CipherString(req.uri) : null;
        domain.match = req.match;
        return domain;
    }

    uri: string;
    match: UriMatchType = null;

    constructor(o?: LoginUriView | LoginUriDomain) {
        if (o == null) {
            return;
        }

        if (o instanceof LoginUriView) {
            this.uri = o.uri;
        } else {
            this.uri = o.uri?.encryptedString;
        }
        this.match = o.match;
    }
}
