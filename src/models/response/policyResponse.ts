import { BaseResponse } from './baseResponse';

import { PolicyType } from '../../enums/policyType';

export class PolicyResponse extends BaseResponse {
    id: string;
    organizationId: string;
    type: PolicyType;
    data: any;
    enabled: boolean;

    constructor(response: any) {
        super(response);
        this.id = this.getResponseProperty('Id');
        this.organizationId = this.getResponseProperty('OrganizationId');
        this.type = this.getResponseProperty('Type');
        this.data = this.getResponseProperty('Data');
        this.enabled = this.getResponseProperty('Enabled');
    }
}
