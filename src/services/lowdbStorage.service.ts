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
    private dataFilePath: string;

    constructor(defaults?: any, dir?: string, private allowCache = false) {
        this.defaults = defaults;

        let adapter: lowdb.AdapterSync<any>;
        if (Utils.isNode && dir != null) {
            if (!fs.existsSync(dir)) {
                NodeUtils.mkdirpSync(dir, '700');
            }
            this.dataFilePath = path.join(dir, 'data.json');
            adapter = new FileSync(this.dataFilePath);
        }
        try {
            this.installDB(adapter);
        } catch (e) {
            if (e instanceof SyntaxError) {
                adapter.write({});
                this.installDB(adapter);
            } else {
                throw e;
            }
        }
    }

    init() {
        if (this.defaults != null) {
            this.readForNoCache();
            this.db.defaults(this.defaults).write();
        }
    }

    get<T>(key: string): Promise<T> {
        this.readForNoCache();
        const val = this.db.get(key).value();
        if (val == null) {
            return Promise.resolve(null);
        }
        return Promise.resolve(val as T);
    }

    save(key: string, obj: any): Promise<any> {
        this.readForNoCache();
        this.db.set(key, obj).write();
        return Promise.resolve();
    }

    remove(key: string): Promise<any> {
        this.readForNoCache();
        this.db.unset(key).write();
        return Promise.resolve();
    }

    private readForNoCache(): void {
        if (!this.allowCache) {
            this.db.read();
        }
    }

    protected setPermission(mode: number): void {
        if (mode > 777 && mode < 0)
            throw new SyntaxError(`The setPermission 'mode' must be between 0 and 777. Currently it is ${mode}.`)
        else if (fs.existsSync(this.dataFilePath))
            fs.chmodSync(this.dataFilePath, mode);
    }

    protected installDB(adapter: lowdb.AdapterSync<any>): void {
        this.db = lowdb(adapter);
        this.setPermission(600);
    }
}
