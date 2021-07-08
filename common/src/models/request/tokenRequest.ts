import { TwoFactorProviderType } from '../../enums/twoFactorProviderType';

import { DeviceRequest } from './deviceRequest';

export class TokenRequest {
    email: string;
    masterPasswordHash: string;
    code: string;
    codeVerifier: string;
    redirectUri: string;
    clientId: string;
    clientSecret: string;
    token: string;
    provider: TwoFactorProviderType;
    remember: boolean;
    device?: DeviceRequest;

    constructor(credentials: string[], codes: string[], clientIdClientSecret: string[], provider: TwoFactorProviderType,
        token: string, remember: boolean, device?: DeviceRequest) {
        if (credentials != null && credentials.length > 1) {
            this.email = credentials[0];
            this.masterPasswordHash = credentials[1];
        } else if (codes != null && codes.length > 2) {
            this.code = codes[0];
            this.codeVerifier = codes[1];
            this.redirectUri = codes[2];
        } else if (clientIdClientSecret != null && clientIdClientSecret.length > 1) {
            this.clientId = clientIdClientSecret[0];
            this.clientSecret = clientIdClientSecret[1];
        }
        this.token = token;
        this.provider = provider;
        this.remember = remember;
        this.device = device != null ? device : null;
    }

    toIdentityToken(clientId: string) {
        const obj: any = {
            scope: 'api offline_access',
            client_id: clientId,
        };

        if (this.clientSecret != null) {
            obj.scope = clientId.startsWith('organization') ? 'api.organization' : 'api';
            obj.grant_type = 'client_credentials';
            obj.client_secret = this.clientSecret;
        } else if (this.masterPasswordHash != null && this.email != null) {
            obj.grant_type = 'password';
            obj.username = this.email;
            obj.password = this.masterPasswordHash;
        } else if (this.code != null && this.codeVerifier != null && this.redirectUri != null) {
            obj.grant_type = 'authorization_code';
            obj.code = this.code;
            obj.code_verifier = this.codeVerifier;
            obj.redirect_uri = this.redirectUri;
        } else {
            throw new Error('must provide credentials or codes');
        }

        if (this.device) {
            obj.deviceType = this.device.type;
            obj.deviceIdentifier = this.device.identifier;
            obj.deviceName = this.device.name;
            // no push tokens for browser apps yet
            // obj.devicePushToken = this.device.pushToken;
        }

        if (this.token && this.provider != null) {
            obj.twoFactorToken = this.token;
            obj.twoFactorProvider = this.provider;
            obj.twoFactorRemember = this.remember ? '1' : '0';
        }

        return obj;
    }

    alterIdentityTokenHeaders(headers: Headers) {
        if (this.clientSecret == null && this.masterPasswordHash != null && this.email != null) {
            headers.set('Auth-Email', this.email);
        }
    }
}
