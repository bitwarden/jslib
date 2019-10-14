import * as fs from 'fs';

import { StorageService } from '../../abstractions/storage.service';

import { NodeUtils } from '../../misc/nodeUtils';

// tslint:disable-next-line
const Store = require('electron-store');

export class ElectronStorageService implements StorageService {
    private store: any;

    constructor(dir: string, defaults = {}) {
        if (!fs.existsSync(dir)) {
            NodeUtils.mkdirpSync(dir, '700');
        }
        const storeConfig: any = {
            defaults: defaults,
            name: 'data',
        };
        this.store = new Store(storeConfig);
    }

    get<T>(key: string): Promise<T> {
        const val = this.store.get(key) as T;
        return Promise.resolve(val != null ? val : null);
    }

    save(key: string, obj: any): Promise<any> {
        this.store.set(key, obj);
        return Promise.resolve();
    }

    remove(key: string): Promise<any> {
        this.store.delete(key);
        return Promise.resolve();
    }
}
