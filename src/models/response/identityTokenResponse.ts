import { BaseResponse } from './baseResponse';

export class IdentityTokenResponse extends BaseResponse {
    accessToken: string;
    expiresIn: number;
    refreshToken: string;
    tokenType: string;

    privateKey: string;
    key: string;
    twoFactorToken: string;

    constructor(response: any) {
        super(response);
        this.accessToken = response.access_token;
        this.expiresIn = response.expires_in;
        this.refreshToken = response.refresh_token;
        this.tokenType = response.token_type;

        this.privateKey = this.getResponseProperty('PrivateKey');
        this.key = this.getResponseProperty('Key');
        this.twoFactorToken = this.getResponseProperty('TwoFactorToken');
    }
}
