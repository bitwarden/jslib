import { PolicyResponse } from '../response/policyResponse';

import { PolicyType } from '../../enums/policyType';

export class PolicyData {
    id: string;
    organizationId: string;
    type: PolicyType;
    data: any;
    enabled: boolean;

    constructor(response: PolicyResponse) {
        this.id = response.id;
        this.organizationId = response.organizationId;
        this.type = response.type;
        this.data = response.data;
        this.enabled = response.enabled;
    }
}
