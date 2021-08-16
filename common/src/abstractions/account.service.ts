import { StorageKey } from '../enums/storageKey';

import { Account } from '../models/domain/account';
import { Organization } from '../models/domain/organization';
import { Provider } from '../models/domain/provider';
import { SettingStorageOptions } from '../models/domain/settingStorageOptions';

export abstract class AccountService {
    activeAccount: Account;
    addAccount: (account: Account) => Promise<void>;
    switchAccount: (userId: string) => Promise<void>;
    findAccount: (userId: string) => Account;
    saveSetting: (key: StorageKey | string, obj: any, options?: SettingStorageOptions) => Promise<any>;
    removeSetting: (key: StorageKey | string, options?: SettingStorageOptions) => Promise<any>;
    hasSetting: (key: StorageKey | string, options?: SettingStorageOptions) => Promise<boolean>;
    getSetting: <T>(key: StorageKey | string, options?: SettingStorageOptions) => Promise<T>;
    getOrganization: (id: string) => Promise<Organization>;
    getOrganizationByIdentifier: (identifier: string) => Promise<Organization>;
    getAllOrganizations: () => Promise<Organization[]>;
    getProvider: (id: string) => Promise<Provider>;
}
