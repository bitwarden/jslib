import { ipcRenderer } from 'electron';

import { StorageService } from '../../abstractions/storage.service';

export class ElectronRendererSecureStorageService implements StorageService {
    async get<T>(key: string): Promise<T> {
        const val = ipcRenderer.sendSync('keytar', {
            action: 'getPassword',
            key: key,
        });
        return Promise.resolve(val != null ? JSON.parse(val) as T : null);
    }

    async save(key: string, obj: any): Promise<any> {
        ipcRenderer.sendSync('keytar', {
            action: 'setPassword',
            key: key,
            value: JSON.stringify(obj),
        });
        return Promise.resolve();
    }

    async remove(key: string): Promise<any> {
        ipcRenderer.sendSync('keytar', {
            action: 'deletePassword',
            key: key,
        });
        return Promise.resolve();
    }
}
