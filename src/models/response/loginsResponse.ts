import { BaseResponse } from './baseResponse';
import { GlobalDomainResponse } from './globalDomainResponse';

export class LoginsResponse extends BaseResponse {
    defaultLogins: string[];

    constructor(response: any) {
        super(response);
        this.defaultLogins = this.getResponseProperty('DefaultLogins');
    }
}
