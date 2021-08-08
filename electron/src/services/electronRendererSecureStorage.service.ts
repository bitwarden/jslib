import { ipcRenderer } from 'electron';

import { StorageService, StorageServiceOptions } from 'jslib-common/abstractions/storage.service';

export class ElectronRendererSecureStorageService implements StorageService {
    async get<T>(key: string, options?: StorageServiceOptions): Promise<T> {
        const val = ipcRenderer.sendSync('keytar', {
            action: 'getPassword',
            key: key,
            keySuffix: options?.keySuffix ?? '',
        });
        return Promise.resolve(val != null ? JSON.parse(val) as T : null);
    }

    async has(key: string, options?: StorageServiceOptions): Promise<boolean> {
        const val = ipcRenderer.sendSync('keytar', {
            action: 'hasPassword',
            key: key,
            keySuffix: options?.keySuffix ?? '',
        });
        return Promise.resolve(!!val);
    }

    async save(key: string, obj: any, options?: StorageServiceOptions): Promise<any> {
        ipcRenderer.sendSync('keytar', {
            action: 'setPassword',
            key: key,
            keySuffix: options?.keySuffix ?? '',
            value: JSON.stringify(obj),
        });
        return Promise.resolve();
    }

    async remove(key: string, options?: StorageServiceOptions): Promise<any> {
        ipcRenderer.sendSync('keytar', {
            action: 'deletePassword',
            key: key,
            keySuffix: options?.keySuffix ?? '',
        });
        return Promise.resolve();
    }
}
