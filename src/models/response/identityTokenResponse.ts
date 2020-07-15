import { BaseResponse } from './baseResponse';

import { KdfType } from '../../enums/kdfType';

export class IdentityTokenResponse extends BaseResponse {
    accessToken: string;
    expiresIn: number;
    refreshToken: string;
    tokenType: string;

    resetMasterPassword: boolean;
    privateKey: string;
    key: string;
    twoFactorToken: string;
    kdf: KdfType;
    kdfIterations: number;

    constructor(response: any) {
        super(response);
        this.accessToken = response.access_token;
        this.expiresIn = response.expires_in;
        this.refreshToken = response.refresh_token;
        this.tokenType = response.token_type;

        this.resetMasterPassword = this.getResponseProperty('ResetMasterPassword');
        this.privateKey = this.getResponseProperty('PrivateKey');
        this.key = this.getResponseProperty('Key');
        this.twoFactorToken = this.getResponseProperty('TwoFactorToken');
        this.kdf = this.getResponseProperty('Kdf');
        this.kdfIterations = this.getResponseProperty('KdfIterations');
    }
}
