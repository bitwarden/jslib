import { LoginUriView } from './loginUriView';
import { View } from './view';

import { Login } from '../domain/login';

export class LoginView implements View {
    username: string = null;
    password: string = null;
    passwordRevisionDate?: Date = null;
    totp: string = null;
    uris: LoginUriView[] = null;

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
        return this.hasUris && this.uris.some((u) => u.canLaunch);
    }

    get launchUri(): string {
        if (this.hasUris) {
            const uri = this.uris.find((u) => u.canLaunch);
            if (uri != null) {
                return uri.launchUri;
            }
        }
        return null;
    }

    get hasUris(): boolean {
        return this.uris != null && this.uris.length > 0;
    }
}
