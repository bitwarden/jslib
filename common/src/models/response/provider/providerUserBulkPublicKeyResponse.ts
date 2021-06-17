import { BaseResponse } from '../baseResponse';

export class ProviderUserBulkPublicKeyResponse extends BaseResponse {
    id: string;
    key: string;

    constructor(response: any) {
        super(response);
        this.id = this.getResponseProperty('Id');
        this.key = this.getResponseProperty('Key');
    }
}
