import { ipcRenderer } from 'electron';

import { StorageService } from 'jslib-common/abstractions/storage.service';

import { SettingStorageOptions } from 'jslib-common/models/domain/settingStorageOptions';

export class ElectronRendererSecureStorageService implements StorageService {
    async get<T>(key: string, options?: SettingStorageOptions): Promise<T> {
        const val = ipcRenderer.sendSync('keytar', {
            action: 'getPassword',
            key: key,
            keySuffix: options?.keySuffix ?? '',
        });
        return Promise.resolve(val != null ? JSON.parse(val) as T : null);
    }

    async has(key: string, options?: SettingStorageOptions): Promise<boolean> {
        const val = ipcRenderer.sendSync('keytar', {
            action: 'hasPassword',
            key: key,
            keySuffix: options?.keySuffix ?? '',
        });
        return Promise.resolve(!!val);
    }

    async save(key: string, obj: any, options?: SettingStorageOptions): Promise<any> {
        ipcRenderer.sendSync('keytar', {
            action: 'setPassword',
            key: key,
            keySuffix: options?.keySuffix ?? '',
            value: JSON.stringify(obj),
        });
        return Promise.resolve();
    }

    async remove(key: string, options?: SettingStorageOptions): Promise<any> {
        ipcRenderer.sendSync('keytar', {
            action: 'deletePassword',
            key: key,
            keySuffix: options?.keySuffix ?? '',
        });
        return Promise.resolve();
    }
}
