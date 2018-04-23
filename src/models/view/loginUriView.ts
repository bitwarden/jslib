import { UriMatchType } from '../../enums/uriMatchType';

import { View } from './view';

import { LoginUri } from '../domain/loginUri';

import { PlatformUtilsService } from '../../abstractions/platformUtils.service';

import { Utils } from '../../misc/utils';

export class LoginUriView implements View {
    match: UriMatchType = null;

    // tslint:disable
    private _uri: string;
    private _domain: string;
    private _hostname: string;
    // tslint:enable

    constructor(u?: LoginUri) {
        if (!u) {
            return;
        }

        this.match = u.match;
    }

    get uri(): string {
        return this._uri;
    }
    set uri(value: string) {
        this._uri = value;
        this._domain = null;
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

    get hostname(): string {
        if (this._hostname == null && this.uri != null) {
            this._hostname = Utils.getHostname(this.uri);
            if (this._hostname === '') {
                this._hostname = null;
            }
        }

        return this._hostname;
    }

    get hostnameOrUri(): string {
        return this.hostname != null ? this.hostname : this.uri;
    }

    get isWebsite(): boolean {
        return this.uri != null && (this.uri.indexOf('http://') === 0 || this.uri.indexOf('https://') === 0);
    }

    get canLaunch(): boolean {
        return this.uri != null && this.uri.indexOf('://') > -1;
    }
}
