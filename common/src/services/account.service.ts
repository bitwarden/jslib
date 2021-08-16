import { AccountService as AccountServiceAbstraction } from '../abstractions/account.service';
import { StorageService } from '../abstractions/storage.service';
import { AccountStorageKey } from '../enums/accountStorageKey';

import { Account } from '../models/domain/account';
import { SettingStorageOptions } from '../models/domain/settingStorageOptions';

export class AccountService implements AccountServiceAbstraction {
    private accounts: Account[] = [];

    get activeAccount(): Account {
        return this.accounts.find(account => account.selected);
    }

    constructor(private storageService: StorageService, private secureStorageService: StorageService) {
    }

    async addAccount(account: Account): Promise<void> {
        if (this.accounts.indexOf(account) != -1) {
            return;
        }
        
        this.accounts.push(account);
        await this.saveAccountToStorage(account);
        await this.switchAccount(account);
    };

    async switchAccount(account: Account): Promise<void> {
        if (this.accounts.indexOf(account) === -1) {
            return
        }

        return this.accounts.forEach((value: Account, index: number) => {
           this.accounts[index].selected = value === account ? true : false;  
        })
    }

    findAccount(userId: string): Account {
        return this.accounts.find(account => account.settings.get(AccountStorageKey.UserId) === userId);
    }

    async saveSetting(key: AccountStorageKey | string, obj: any, options?: SettingStorageOptions): Promise<void> {
        if (!options?.skipMemory)
        {
            this.activeAccount.settings.set(key, obj);
        }

        if (!options?.skipDisk)
        {
            await this.saveToStorage(key, obj, options);
        }
    }

    async hasSetting(key: AccountStorageKey | string, options?: SettingStorageOptions) {
        if (options?.skipDisk) {
           return this.activeAccount.settings.has(key); 
        }
        if (options?.skipMemory) {
            return await this.hasInStorage(key, options);
        }
        return this.activeAccount.settings.has(key) || await this.hasInStorage(key, options);
    }

    async getSetting<T>(key: AccountStorageKey | string, options?: SettingStorageOptions): Promise<T> {
        if (options?.skipDisk) {
            return this.activeAccount.settings.get(key) as T;
        }
        if (options?.skipMemory) {
            return await this.getFromStorage<T>(key, options);
        }
        return this.activeAccount.settings.has(key) ?
            this.activeAccount.settings.get(key) as T :
            await this.getFromStorage<T>(key, options);
    }

    async removeSetting(key: AccountStorageKey | string, options?: SettingStorageOptions) {
        if (!options?.skipMemory) {
            this.activeAccount.settings.delete(key);
        }

        if (!options?.skipDisk) {
            await this.removeFromStorage(key, options);
        }
    }

    private async saveToStorage(key: AccountStorageKey | string, obj: any, options?: SettingStorageOptions): Promise<any> {
        if (options.useSecureStorage) {
            return await this.secureStorageService.save(this.prefixKey(key), obj, options);
        } else {
            return await this.storageService.save(this.prefixKey(key), obj, options);
        }
    }

    private async removeFromStorage(key: AccountStorageKey | string, options?: SettingStorageOptions): Promise<any> {
        if (options.useSecureStorage) {
            return await this.secureStorageService.remove(this.prefixKey(key), options);
        } else {
            return await this.storageService.remove(this.prefixKey(key), options);
        }
    }

    private async getFromStorage<T>(key: AccountStorageKey | string, options?: SettingStorageOptions): Promise<T> {
        if (options.useSecureStorage) {
            return await this.secureStorageService.get<T>(this.prefixKey(key), options);
        } else {
            return await this.storageService.get<T>(this.prefixKey(key), options);
        }
    }

    private async hasInStorage(key: AccountStorageKey | string, options?: SettingStorageOptions): Promise<boolean> {
        if (options.useSecureStorage) {
            return await this.secureStorageService.has(this.prefixKey(key), options);
        } else {
            return await this.storageService.has(this.prefixKey(key), options);
        }
    }

    private async saveAccountToStorage(account: Account): Promise<void> {
        return account.settings.forEach(async (value: string, key: AccountStorageKey) => {
            await this.saveToStorage(key, value);
        })
    }

    private prefixKey(key: AccountStorageKey | string): string {
        return `${this.activeAccount.settings.get(AccountStorageKey.UserId)}.${key}`;
    }
}

