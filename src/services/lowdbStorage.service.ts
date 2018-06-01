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

    constructor(defaults?: any, dir?: string) {
        this.defaults = defaults;

        let adapter: lowdb.AdapterSync<any>;
        if (Utils.isNode && dir != null) {
            if (!fs.existsSync(dir)) {
                NodeUtils.mkdirpSync(dir, 755);
            }
            const p = path.join(dir, 'data.json');
            adapter = new FileSync(p);
        } else if (Utils.isBrowser && !Utils.isNode) {
            // local storage adapter for web
        }
        this.db = lowdb(adapter);
    }

    init() {
        if (this.defaults != null) {
            this.db.defaults(this.defaults).write();
        }
    }

    get<T>(key: string): Promise<T> {
        const val = this.db.read().get(key).value();
        if (val == null) {
            return Promise.resolve(null);
        }
        return Promise.resolve(val as T);
    }

    save(key: string, obj: any): Promise<any> {
        this.db.set(key, obj).write();
        return Promise.resolve();
    }

    remove(key: string): Promise<any> {
        this.db.unset(key).write();
        return Promise.resolve();
    }
}
