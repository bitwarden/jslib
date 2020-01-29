import { PolicyService as PolicyServiceAbstraction } from '../abstractions/policy.service';
import { StorageService } from '../abstractions/storage.service';
import { UserService } from '../abstractions/user.service';

import { PolicyData } from '../models/data/policyData';

import { Policy } from '../models/domain/policy';

import { PolicyType } from '../enums/policyType';

const Keys = {
    policiesPrefix: 'policies_',
};

export class PolicyService implements PolicyServiceAbstraction {
    policyCache: Policy[];

    constructor(private userService: UserService, private storageService: StorageService) {
    }

    clearCache(): void {
        this.policyCache = null;
    }

    async getAll(type?: PolicyType): Promise<Policy[]> {
        if (this.policyCache == null) {
            const userId = await this.userService.getUserId();
            const policies = await this.storageService.get<{ [id: string]: PolicyData; }>(
                Keys.policiesPrefix + userId);
            const response: Policy[] = [];
            for (const id in policies) {
                if (policies.hasOwnProperty(id)) {
                    response.push(new Policy(policies[id]));
                }
            }
            this.policyCache = response;
        }
        if (type != null) {
            return this.policyCache.filter((p) => p.type === type);
        } else {
            return this.policyCache;
        }
    }

    async replace(policies: { [id: string]: PolicyData; }): Promise<any> {
        const userId = await this.userService.getUserId();
        await this.storageService.save(Keys.policiesPrefix + userId, policies);
        this.policyCache = null;
    }

    async clear(userId: string): Promise<any> {
        await this.storageService.remove(Keys.policiesPrefix + userId);
        this.policyCache = null;
    }
}
