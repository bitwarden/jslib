import { TokenRequest } from './tokenRequest';

import { TwoFactorProviderType } from '../../../enums/twoFactorProviderType';

import { DeviceRequest } from '../deviceRequest';

import { Utils } from '../../../misc/utils';

export class PasswordTokenRequest extends TokenRequest {
    email: string;
    masterPasswordHash: string;

    constructor(email: string, masterPasswordHash: string, public provider: TwoFactorProviderType, public token: string,
        public remember: boolean, public captchaResponse: string, device?: DeviceRequest) {
        super(provider, token, remember, captchaResponse, device);

        this.email = email;
        this.masterPasswordHash = masterPasswordHash;
    }

    toIdentityToken(clientId: string) {
        const obj = super.toIdentityToken(clientId);

        obj.grant_type = 'password';
        obj.username = this.email;
        obj.password = this.masterPasswordHash;

        return obj;
    }

    alterIdentityTokenHeaders(headers: Headers) {
        headers.set('Auth-Email', Utils.fromUtf8ToUrlB64(this.email));
    }
}
