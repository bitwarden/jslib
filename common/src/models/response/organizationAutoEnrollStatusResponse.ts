import { BaseResponse } from './baseResponse';

export class OrganizationAutoEnrollStatusResponse extends BaseResponse {
    id: string;
    autoEnrollEnabled: boolean;

    constructor(response: any) {
        super(response);
        this.id = this.getResponseProperty('Id');
        this.autoEnrollEnabled = this.getResponseProperty('AutoEnrollEnabled');
    }
}
