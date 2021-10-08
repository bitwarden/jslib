import { BaseResponse } from './baseResponse';

export class CryptoAgentUserKeyResponse extends BaseResponse {
    key: string;

    constructor(response: any) {
        super(response);
        this.key = this.getResponseProperty('Key');
    }
}
