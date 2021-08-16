import { SettingStorageOptions } from '../models/domain/settingStorageOptions';

export abstract class StorageService {
    get: <T>(key: string, options?: SettingStorageOptions) => Promise<T>;
    has: (key: string, options?: SettingStorageOptions) => Promise<boolean>;
    save: (key: string, obj: any, options?: SettingStorageOptions) => Promise<any>;
    remove: (key: string, options?: SettingStorageOptions) => Promise<any>;
}

