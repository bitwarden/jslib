import * as fs from 'fs';
import * as lowdb from 'lowdb';
import * as FileSync from 'lowdb/adapters/FileSync';
import * as path from 'path';

import { StorageService } from '../abstractions/storage.service';

import { NodeUtils } from '../misc/nodeUtils';
import { Utils } from '../misc/utils';

export class LowdbStorageService implements StorageService {
    private db: lowdb.LowdbSync<any>;
    private defaults: any;

    constructor(defaults?: any, dir?: string, private allowCache = false) {
        this.defaults = defaults;

        let adapter: lowdb.AdapterSync<any>;
        if (Utils.isNode && dir != null) {
            if (!fs.existsSync(dir)) {
                NodeUtils.mkdirpSync(dir, '700');
            }
            const p = path.join(dir, 'data.json');
            adapter = new FileSync(p);
        }
        this.db = lowdb(adapter);
    }

    init() {
        if (this.defaults != null) {
            if (!this.allowCache) {
                this.db.read();
            }
            this.db.defaults(this.defaults).write();
        }
    }

    get<T>(key: string): Promise<T> {
        if (!this.allowCache) {
            this.db.read();
        }
        const val = this.db.get(key).value();
        if (val == null) {
            return Promise.resolve(null);
        }
        return Promise.resolve(val as T);
    }

    save(key: string, obj: any): Promise<any> {
        if (!this.allowCache) {
            this.db.read();
        }
        this.db.set(key, obj).write();
        return Promise.resolve();
    }

    remove(key: string): Promise<any> {
        if (!this.allowCache) {
            this.db.read();
        }
        this.db.unset(key).write();
        return Promise.resolve();
    }
}
