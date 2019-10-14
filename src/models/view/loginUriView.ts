import { UriMatchType } from '../../enums/uriMatchType';

import { View } from './view';

import { LoginUri } from '../domain/loginUri';

import { Utils } from '../../misc/utils';

const CanLaunchWhitelist = [
    'https://',
    'http://',
    'ssh://',
    'ftp://',
    'sftp://',
    'irc://',
    'vnc://',
    'chrome://',
    'iosapp://',
    'androidapp://',
];

export class LoginUriView implements View {
    match: UriMatchType = null;

    // tslint:disable
    private _uri: string = null;
    private _domain: string = null;
    private _hostname: string = null;
    private _canLaunch: boolean = null;
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
        this._canLaunch = null;
    }

    get domain(): string {
        if (this._domain == null && this.uri != null) {
            this._domain = Utils.getDomain(this.uri);
            if (this._domain === '') {
                this._domain = null;
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
        return this.uri != null && (this.uri.indexOf('http://') === 0 || this.uri.indexOf('https://') === 0 ||
            (this.uri.indexOf('://') < 0 && Utils.tldEndingRegex.test(this.uri)));
    }

    get canLaunch(): boolean {
        if (this._canLaunch != null) {
            return this._canLaunch;
        }
        if (this.uri != null && this.match !== UriMatchType.RegularExpression) {
            const uri = this.launchUri;
            for (let i = 0; i < CanLaunchWhitelist.length; i++) {
                if (uri.indexOf(CanLaunchWhitelist[i]) === 0) {
                    this._canLaunch = true;
                    return this._canLaunch;
                }
            }
        }
        this._canLaunch = false;
        return this._canLaunch;
    }

    get launchUri(): string {
        return this.uri.indexOf('://') < 0 && Utils.tldEndingRegex.test(this.uri) ? ('http://' + this.uri) : this.uri;
    }
}
