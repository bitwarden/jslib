import { View } from './view';

import { Login } from '../domain';

import { PlatformUtilsService } from '../../abstractions';

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
                if (this._domain === '') {
                    this._domain = null;
                }
            } else {
                throw new Error('window.bitwardenContainerService not initialized.');
            }
        }

        return this._domain;
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

    get domainOrUri(): string {
        return this.domain != null ? this.domain : this.uri;
    }

    get isWebsite(): boolean {
        return this.uri != null && (this.uri.indexOf('http://') === 0 || this.uri.indexOf('https://') === 0);
    }

    get canLaunch(): boolean {
        return this.uri != null && this.uri.indexOf('://') > -1;
    }
}
