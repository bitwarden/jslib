import { PolicyData } from '../models/data/policyData';

import { MasterPasswordPolicyOptions } from '../models/domain/masterPasswordPolicyOptions';
import { Organization } from '../models/domain/organization';
import { Policy } from '../models/domain/policy';
import { ResetPasswordPolicyOptions } from '../models/domain/resetPasswordPolicyOptions';

import { PolicyType } from '../enums/policyType';

import { ListResponse } from '../models/response/listResponse';
import { PolicyResponse } from '../models/response/policyResponse';

export abstract class BasePolicy {
    abstract name: string;
    abstract description: string;
    abstract type: PolicyType;
    abstract component: any;

    display(organization: Organization) {
        return true;
    }
}

export abstract class PolicyService {
    policyCache: Policy[];
    policies: BasePolicy[];

    clearCache: () => void;
    getAll: (type?: PolicyType) => Promise<Policy[]>;
    replace: (policies: { [id: string]: PolicyData; }) => Promise<any>;
    clear: (userId: string) => Promise<any>;
    getMasterPasswordPolicyOptions: (policies?: Policy[]) => Promise<MasterPasswordPolicyOptions>;
    evaluateMasterPassword: (passwordStrength: number, newPassword: string,
        enforcedPolicyOptions?: MasterPasswordPolicyOptions) => boolean;
    getResetPasswordPolicyOptions: (policies: Policy[], orgId: string) => [ResetPasswordPolicyOptions, boolean];
    mapPoliciesFromToken: (policiesResponse: ListResponse<PolicyResponse>) => Policy[];
}
