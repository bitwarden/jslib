import { View } from './view';

import { Login } from '../domain/login';

import { PlatformUtilsService } from '../../abstractions/platformUtils.service';

export class LoginView implements View {
    username: string;
    totp: string;

    // tslint:disable
    private _uri: string;
    private _username: string;
    private _password: string;
    private _domain: string;
    private _maskedPassword: string;
    // tslint:enable

    constructor(l?: Login) {
        // ctor
    }

    get uri(): string {
        return this._uri;
    }
    set uri(value: string) {
        this._uri = value;
        this._domain = null;
    }

    get password(): string {
        return this._password;
    }
    set password(value: string) {
        this._password = value;
        this._maskedPassword = null;
    }

    get domain(): string {
        if (this._domain == null && this.uri != null) {
            const containerService = (window as any).bitwardenContainerService;
            if (containerService) {
                const platformUtilsService: PlatformUtilsService = containerService.getPlatformUtilsService();
                this._domain = platformUtilsService.getDomain(this.uri);
            } else {
                throw new Error('window.bitwardenContainerService not initialized.');
            }
        }

        return this._domain;
    }

    get maskedPassword(): string {
        if (this._maskedPassword == null && this.password != null) {
            this._maskedPassword = '';
            for (var i = 0; i < this.password.length; i++) {
                this._maskedPassword += '•';
            }
        }

        return this._maskedPassword;
    }

    get subTitle(): string {
        return this.username;
    }
}
