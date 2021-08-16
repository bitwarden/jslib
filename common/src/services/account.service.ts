import { AccountService as AccountServiceAbstraction } from '../abstractions/account.service';
import { StorageService } from '../abstractions/storage.service';

import { OrganizationData } from '../models/data/organizationData';
import { ProviderData } from '../models/data/providerData';

import { Account } from '../models/domain/account';
import { Organization } from '../models/domain/organization';
import { Provider } from '../models/domain/provider';
import { SettingStorageOptions } from '../models/domain/settingStorageOptions';

import { StorageKey } from '../enums/storageKey';

export class AccountService implements AccountServiceAbstraction {
    private accounts: Record<string, Account> = {};
    private activeUserId: string;

    get activeAccount(): Account {
        return this.accounts[this.activeUserId];
    }

    constructor(private storageService: StorageService, private secureStorageService: StorageService) {
    }

    async addAccount(account: Account): Promise<void> {
        this.accounts[account.userId] = account;
        await this.switchAccount(account.userId);
        await this.saveAccountToStorage(account);
    }

    findAccount(userId: string): Account {
        return this.accounts[userId];
    }

    async switchAccount(userId: string): Promise<void> {
        if (!this.accounts[userId]) {
            return;
        }

        await this.storageService.save(StorageKey.PreviousUserId, this.activeAccount?.userId ?? userId);
        this.activeUserId = userId;
    }

    async removeAccount(userId: string): Promise<void> {
        await this.secureStorageService.remove(userId);
        await this.storageService.remove(userId);
        delete this.accounts[userId];
    }

    async saveSetting(key: StorageKey | string, obj: any, options?: SettingStorageOptions): Promise<void> {
        if (!options?.skipMemory && this.activeAccount != null) {
            this.activeAccount.settings.set(key, obj);
        }

        if (!options?.skipDisk) {
            await this.saveToStorage(key, obj, options);
        }
    }

    async hasSetting(key: StorageKey | string, options?: SettingStorageOptions) {
        if (options?.skipDisk) {
           return this.activeAccount?.settings.has(key);
        }

        if (options?.skipMemory) {
            return await this.hasInStorage(key, options);
        }
        return this.activeAccount?.settings.has(key) || await this.hasInStorage(key, options);
    }

    async getSetting<T>(key: StorageKey | string, options?: SettingStorageOptions): Promise<T> {
        if (options?.skipDisk) {
            return this.activeAccount?.settings.get(key) as T;
        }

        if (options?.skipMemory) {
            return await this.getFromStorage<T>(key, options);
        }

        return this.activeAccount?.settings.has(key) ?
            this.activeAccount?.settings.get(key) as T :
            await this.getFromStorage<T>(key, options) ?? null;
    }

    async removeSetting(key: StorageKey | string, options?: SettingStorageOptions) {
        if (!options?.skipMemory) {
            this.activeAccount.settings.delete(key);
        }

        if (!options?.skipDisk) {
            await this.removeFromStorage(key, options);
        }
    }

    async clearMemory(): Promise<void> {
        this.accounts[this.activeUserId].settings.clear();
    }

    async clearDisk(): Promise<void> {
        await this.secureStorageService.remove(this.activeUserId);
        await this.storageService.remove(this.activeUserId);
    }

    async getOrganization(id: string): Promise<Organization> {
        const organizations = await this.getSetting<{ [id: string]: OrganizationData; }>(
            StorageKey.Organizations);
        if (organizations == null || !organizations.hasOwnProperty(id)) {
            return null;
        }

        return new Organization(organizations[id]);
    }

    async getOrganizationByIdentifier(identifier: string): Promise<Organization> {
        const organizations = await this.getAllOrganizations();
        if (organizations == null || organizations.length === 0) {
            return null;
        }

        return organizations.find(o => o.identifier === identifier);
    }

    async getAllOrganizations(): Promise<Organization[]> {
        const organizations = await this.getSetting<{ [id: string]: OrganizationData; }>(
            StorageKey.Organizations);
        const response: Organization[] = [];
        for (const id in organizations) {
            if (organizations.hasOwnProperty(id) && !organizations[id].isProviderUser) {
                response.push(new Organization(organizations[id]));
            }
        }
        return response;
    }

    async getProvider(id: string): Promise<Provider> {
        const providers = await this.getSetting<{ [id: string]: ProviderData; }>(
            StorageKey.Providers);
        if (providers == null || !providers.hasOwnProperty(id)) {
            return null;
        }

        return new Provider(providers[id]);
    }

    async getAllProviders(): Promise<Provider[]> {
        const providers = await this.getSetting<{ [id: string]: ProviderData; }>(
            StorageKey.Providers);
        const response: Provider[] = [];
        for (const id in providers) {
            if (providers.hasOwnProperty(id)) {
                response.push(new Provider(providers[id]));
            }
        }
        return response;
    }

    private async saveToStorage(key: StorageKey | string, obj: any, options?: SettingStorageOptions): Promise<any> {
        if (options?.useSecureStorage) {
            return await this.secureStorageService.save(await this.prefixKey(key), obj, options);
        } else {
            return await this.storageService.save(await this.prefixKey(key), obj, options);
        }
    }

    private async removeFromStorage(key: StorageKey | string, options?: SettingStorageOptions): Promise<any> {
        if (options?.useSecureStorage) {
            return await this.secureStorageService.remove(await this.prefixKey(key), options);
        } else {
            return await this.storageService.remove(await this.prefixKey(key), options);
        }
    }

    private async getFromStorage<T>(key: StorageKey | string, options?: SettingStorageOptions): Promise<T> {
        if (options?.useSecureStorage) {
            return await this.secureStorageService.get<T>(await this.prefixKey(key), options);
        } else {
            return await this.storageService.get<T>(await this.prefixKey(key), options);
        }
    }

    private async hasInStorage(key: StorageKey | string, options?: SettingStorageOptions): Promise<boolean> {
        if (options?.useSecureStorage) {
            return await this.secureStorageService.has(await this.prefixKey(key), options);
        } else {
            return await this.storageService.has(await this.prefixKey(key), options);
        }
    }

    private async saveAccountToStorage(account: Account): Promise<void> {
        return account.settings.forEach(async (value: string, key: StorageKey) => {
            await this.saveToStorage(key, value);
        });
    }

    private async prefixKey(key: StorageKey | string): Promise<string> {
        let prefix = this.activeUserId;
        if (prefix == null) {
            prefix = await this.storageService.get<string>(StorageKey.PreviousUserId);
        }

        if (prefix == null) {
            return key;
        }

        return `${prefix}.${key}`;
    }
}
