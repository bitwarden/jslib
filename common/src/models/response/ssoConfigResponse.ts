import { BaseResponse } from './baseResponse';

export class SsoConfigResponse extends BaseResponse {
    cryptoAgentUrl: string;

    constructor(response: any) {
        super(response);
        this.cryptoAgentUrl = this.getResponseProperty('CryptoAgentUrl');
    }
}
