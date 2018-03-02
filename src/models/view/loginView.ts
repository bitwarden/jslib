import { LoginUriView } from './loginUriView';
import { View } from './view';

import { Login } from '../domain/login';

import { PlatformUtilsService } from '../../abstractions/platformUtils.service';

export class LoginView implements View {
    username: string;
    totp: string;
    uris: LoginUriView[];

    // tslint:disable
    private _username: string;
    private _password: string;
    private _maskedPassword: string;
    // tslint:enable

    constructor(l?: Login) {
        // ctor
    }

    get password(): string {
        return this._password;
    }
    set password(value: string) {
        this._password = value;
        this._maskedPassword = null;
    }

    get uri(): string {
        return this.hasUris ? this.uris[0].uri : null;
    }

    get maskedPassword(): string {
        if (this._maskedPassword == null && this.password != null) {
            this._maskedPassword = '';
            for (let i = 0; i < this.password.length; i++) {
                this._maskedPassword += '•';
            }
        }

        return this._maskedPassword;
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
