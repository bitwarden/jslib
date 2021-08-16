import { AccountService } from '../abstractions/account.service';
import { PolicyService as PolicyServiceAbstraction } from '../abstractions/policy.service';

import { PolicyData } from '../models/data/policyData';

import { MasterPasswordPolicyOptions } from '../models/domain/masterPasswordPolicyOptions';
import { Policy } from '../models/domain/policy';
import { ResetPasswordPolicyOptions } from '../models/domain/resetPasswordPolicyOptions';
import { SettingStorageOptions } from '../models/domain/settingStorageOptions';

import { OrganizationUserStatusType } from '../enums/organizationUserStatusType';
import { StorageKey } from '../enums/storageKey';

import { PolicyType } from '../enums/policyType';

import { ListResponse } from '../models/response/listResponse';
import { PolicyResponse } from '../models/response/policyResponse';

export class PolicyService implements PolicyServiceAbstraction {
    constructor(private accountService: AccountService) {
    }

    async clearCache(): Promise<void> {
        await this.accountService.removeSetting(StorageKey.Policies, { skipDisk: true } as SettingStorageOptions);
    }

    async getAll(type?: PolicyType): Promise<Policy[]> {
        if (!await this.accountService.hasSetting(StorageKey.Policies, { skipDisk: true } as SettingStorageOptions)) {
            const policies = await this.accountService.getSetting<{ [id: string]: PolicyData; }>(
                StorageKey.Policies, { skipMemory: true } as SettingStorageOptions);
            const response: Policy[] = [];
            for (const id in policies) {
                if (policies.hasOwnProperty(id)) {
                    response.push(new Policy(policies[id]));
                }
            }
            await this.accountService.saveSetting(StorageKey.Policies, response, { skipDisk : true } as SettingStorageOptions);
        }
        const policyCache = await this.accountService.getSetting<Policy[]>(StorageKey.Policies);
        if (type != null) {
            return policyCache.filter(policy => policy.type === type);
        } else {
            return policyCache;
        }
    }

    async getPolicyForOrganization(policyType: PolicyType, organizationId: string): Promise<Policy> {
        const policies = await this.getAll(policyType);
        return policies.find(p => p.organizationId === organizationId);
    }

    async replace(policies: { [id: string]: PolicyData; }): Promise<any> {
        await this.accountService.removeSetting(StorageKey.Policies);
        await this.accountService.saveSetting(StorageKey.Policies, policies, { skipMemory: true } as SettingStorageOptions);
    }

    async clear(): Promise<any> {
        await this.accountService.removeSetting(StorageKey.Policies);
    }

    async getMasterPasswordPolicyOptions(policies?: Policy[]): Promise<MasterPasswordPolicyOptions> {
        let enforcedOptions: MasterPasswordPolicyOptions = null;

        if (policies == null) {
            policies = await this.getAll(PolicyType.MasterPassword);
        } else {
            policies = policies.filter(p => p.type === PolicyType.MasterPassword);
        }

        if (policies == null || policies.length === 0) {
            return enforcedOptions;
        }

        policies.forEach(currentPolicy => {
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

    evaluateMasterPassword(passwordStrength: number, newPassword: string,
        enforcedPolicyOptions: MasterPasswordPolicyOptions): boolean {
        if (enforcedPolicyOptions == null) {
            return true;
        }

        if (enforcedPolicyOptions.minComplexity > 0 && enforcedPolicyOptions.minComplexity > passwordStrength) {
            return false;
        }

        if (enforcedPolicyOptions.minLength > 0 && enforcedPolicyOptions.minLength > newPassword.length) {
            return false;
        }

        if (enforcedPolicyOptions.requireUpper && newPassword.toLocaleLowerCase() === newPassword) {
            return false;
        }

        if (enforcedPolicyOptions.requireLower && newPassword.toLocaleUpperCase() === newPassword) {
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

    getResetPasswordPolicyOptions(policies: Policy[], orgId: string): [ResetPasswordPolicyOptions, boolean] {
        const resetPasswordPolicyOptions = new ResetPasswordPolicyOptions();

        if (policies == null || orgId == null) {
            return [resetPasswordPolicyOptions, false];
        }

        const policy = policies.find(p => p.organizationId === orgId && p.type === PolicyType.ResetPassword && p.enabled);
        resetPasswordPolicyOptions.autoEnrollEnabled = policy?.data?.autoEnrollEnabled ?? false;

        return [resetPasswordPolicyOptions, policy?.enabled ?? false];
    }

    mapPoliciesFromToken(policiesResponse: ListResponse<PolicyResponse>): Policy[] {
        if (policiesResponse == null || policiesResponse.data == null) {
            return null;
        }

        const policiesData = policiesResponse.data.map(p => new PolicyData(p));
        return policiesData.map(p => new Policy(p));
    }

    async policyAppliesToUser(policyType: PolicyType, policyFilter?: (policy: Policy) => boolean) {
        const policies = await this.getAll(policyType);
        const organizations = await this.accountService.getAllOrganizations();
        let filteredPolicies;

        if (policyFilter != null) {
            filteredPolicies = policies.filter(p => p.enabled && policyFilter(p));
        }
        else {
            filteredPolicies = policies.filter(p => p.enabled);
        }

        const policySet = new Set(filteredPolicies.map(p => p.organizationId));

        return organizations.some(o =>
            o.enabled &&
            o.status >= OrganizationUserStatusType.Accepted &&
            o.usePolicies &&
            !o.isExemptFromPolicies &&
            policySet.has(o.id));
    }
}
