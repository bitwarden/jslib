import { LoginUriView } from './loginUriView';
import { View } from './view';

import { Login } from '../domain/login';

export class LoginView implements View {
    username: string;
    password: string;
    passwordRevisionDate?: Date;
    totp: string;
    uris: LoginUriView[];

    constructor(l?: Login) {
        if (!l) {
            return;
        }

        this.passwordRevisionDate = l.passwordRevisionDate;
    }

    get uri(): string {
        return this.hasUris ? this.uris[0].uri : null;
    }

    get maskedPassword(): string {
        return this.password != null ? '••••••••' : null;
    }

    get subTitle(): string {
        return this.username;
    }

    get canLaunch(): boolean {
        return this.hasUris && this.uris[0].canLaunch;
    }

    get hasUris(): boolean {
        return this.uris != null && this.uris.length > 0;
    }
}
