import { PolicyData } from '../models/data/policyData';

import { Policy } from '../models/domain/policy';

import { PolicyType } from '../enums/policyType';

export abstract class PolicyService {
    policyCache: Policy[];

    clearCache: () => void;
    getAll: (type?: PolicyType) => Promise<Policy[]>;
    replace: (policies: { [id: string]: PolicyData; }) => Promise<any>;
    clear: (userId: string) => Promise<any>;
}
