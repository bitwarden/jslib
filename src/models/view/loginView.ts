import { LoginUriView } from './loginUriView';
import { View } from './view';

import { Login } from '../domain/login';

import { PlatformUtilsService } from '../../abstractions/platformUtils.service';

export class LoginView implements View {
    username: string;
    password: string;
    totp: string;
    uris: LoginUriView[];

    // tslint:disable
    private _username: string;
    // tslint:enable

    constructor(l?: Login) {
        // ctor
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
