import { PolicyService as PolicyServiceAbstraction } from '../abstractions/policy.service';
import { StorageService } from '../abstractions/storage.service';
import { UserService } from '../abstractions/user.service';

import { PolicyData } from '../models/data/policyData';

import { Policy } from '../models/domain/policy';
import { MasterPasswordPolicyOptions } from '../models/domain/masterPasswordPolicyOptions'

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

    async getMasterPasswordPolicyOptions(): Promise<MasterPasswordPolicyOptions> {
        const policies: Policy[] = await this.getAll(PolicyType.MasterPassword);
        let enforcedOptions: MasterPasswordPolicyOptions = null;

        if (policies == null || policies.length === 0) {
            return enforcedOptions;
        }

        policies.forEach((currentPolicy) => {
            if (!currentPolicy.enabled || currentPolicy.data == null) {
                return;
            }

            if (enforcedOptions == null) {
                enforcedOptions = new MasterPasswordPolicyOptions();
            }

            if (currentPolicy.data.minComplexity != null
                && currentPolicy.data.minComplexity > enforcedOptions.minComplexity) {
                enforcedOptions.minComplexity = currentPolicy.data.minComplexity;
            }

            if (currentPolicy.data.minLength != null
                && currentPolicy.data.minLength > enforcedOptions.minLength) {
                enforcedOptions.minLength = currentPolicy.data.minLength;
            }

            if (currentPolicy.data.requireUpper) {
                enforcedOptions.requireUpper = true;
            }

            if (currentPolicy.data.requireLower) {
                enforcedOptions.requireLower = true;
            }

            if (currentPolicy.data.requireNumbers) {
                enforcedOptions.requireNumbers = true;
            }

            if (currentPolicy.data.requireSpecial) {
                enforcedOptions.requireSpecial = true;
            }
        });

        return enforcedOptions;
    }

    async evaluateMasterPassword(passwordStrength: number, newPassword: string,
        enforcedPolicyOptions: MasterPasswordPolicyOptions): Promise<boolean> {
        if (enforcedPolicyOptions == null) {
            return true;
        }

        if (enforcedPolicyOptions.minComplexity > 0 && enforcedPolicyOptions.minComplexity > passwordStrength) {
            return false;
        }

        if (enforcedPolicyOptions.minLength > 0 && enforcedPolicyOptions.minLength > newPassword.length) {
            return false;
        }

        if (enforcedPolicyOptions.requireUpper && newPassword.toLowerCase() === newPassword) {
            return false;
        }

        if (enforcedPolicyOptions.requireLower && newPassword.toUpperCase() === newPassword) {
            return false;
        }

        if (enforcedPolicyOptions.requireNumbers && !(/[0-9]/.test(newPassword))) {
            return false;
        }

        if (enforcedPolicyOptions.requireSpecial && !(/[!@#$%\^&*]/g.test(newPassword))) {
            return false;
        }

        return true;
    }
}
