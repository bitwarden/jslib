import { PolicyData } from '../models/data/policyData';

import { MasterPasswordPolicyOptions } from '../models/domain/masterPasswordPolicyOptions';
import { Policy } from '../models/domain/policy';

import { PolicyType } from '../enums/policyType';

export abstract class PolicyService {
    policyCache: Policy[];

    clearCache: () => void;
    getAll: (type?: PolicyType) => Promise<Policy[]>;
    replace: (policies: { [id: string]: PolicyData; }) => Promise<any>;
    clear: (userId: string) => Promise<any>;
    getMasterPasswordPolicyOptions: (policies?: Policy[]) => Promise<MasterPasswordPolicyOptions>;
    evaluateMasterPassword: (passwordStrength: number, newPassword: string,
        enforcedPolicyOptions?: MasterPasswordPolicyOptions) => boolean;
}
