import { BaseResponse } from './baseResponse';

export class DefaultUsernamesResponse extends BaseResponse {
    defaultUsernames: string[];

    constructor(response: any) {
        super(response);
        this.defaultUsernames = this.getResponseProperty('DefaultUsernames');
    }
}
