import { AccountStorageKey } from '../enums/accountStorageKey';

import { Account } from '../models/domain/account';
import { SettingStorageOptions } from '../models/domain/settingStorageOptions';

export abstract class AccountService {
    activeAccount: Account;
    addAccount: (account: Account) => Promise<void>;
    switchAccount: (userId: string) => Promise<void>;
    findAccount: (userId: string) => Account;
    saveSetting: (key: AccountStorageKey | string, obj: any, options?: SettingStorageOptions) => Promise<any>;
    removeSetting: (key: AccountStorageKey | string, options?: SettingStorageOptions) => Promise<any>;
    hasSetting: (key: AccountStorageKey | string, options?: SettingStorageOptions) => Promise<boolean>;
    getSetting: <T>(key: AccountStorageKey | string, options?: SettingStorageOptions) => Promise<T>;
}
