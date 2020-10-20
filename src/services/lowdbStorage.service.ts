import * as fs from 'fs';
import * as lowdb from 'lowdb';
import * as FileSync from 'lowdb/adapters/FileSync';
import * as path from 'path';

import { LogService } from '../abstractions/log.service';
import { StorageService } from '../abstractions/storage.service';

import { NodeUtils } from '../misc/nodeUtils';
import { Utils } from '../misc/utils';

export class LowdbStorageService implements StorageService {
    private db: lowdb.LowdbSync<any>;
    private defaults: any;
    private dataFilePath: string;

    constructor(private logService: LogService, defaults?: any, dir?: string, private allowCache = false) {
        this.defaults = defaults;

        this.logService.info('Initializing lowdb storage service.');
        let adapter: lowdb.AdapterSync<any>;
        if (Utils.isNode && dir != null) {
            if (!fs.existsSync(dir)) {
                this.logService.warning(`Could not find dir, "${dir}"; creating it instead.`);
                NodeUtils.mkdirpSync(dir, '700');
                this.logService.info(`Created dir "${dir}".`);
            }
            this.dataFilePath = path.join(dir, 'data.json');
            if (!fs.existsSync(this.dataFilePath)) {
                this.logService.warning(`Could not find data file, "${this.dataFilePath}"; creating it instead.`);
                fs.writeFileSync(this.dataFilePath, '', { mode: 0o600 });
                fs.chmodSync(this.dataFilePath, 0o600);
                this.logService.info(`Created data file "${this.dataFilePath}" with chmod 600.`);
            }
            adapter = new FileSync(this.dataFilePath);
        }
        try {
            this.logService.info('Attempting to create lowdb storage adapter.');
            this.db = lowdb(adapter);
            this.logService.info('Successfuly created lowdb storage adapter.');
        } catch (e) {
            if (e instanceof SyntaxError) {
                this.logService.warning(`Error creating lowdb storage adapter, "${e.message}"; emptying data file.`);
                adapter.write({});
                this.db = lowdb(adapter);
            } else {
                this.logService.error(`Error creating lowdb storage adapter, "${e.message}".`);
                throw e;
            }
        }
    }

    init() {
        if (this.defaults != null) {
            this.logService.info('Writing defaults.');
            this.readForNoCache();
            this.db.defaults(this.defaults).write();
            this.logService.info('Successfully wrote defaults to db.');
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

    private readForNoCache() {
        if (!this.allowCache) {
            this.db.read();
        }
    }
}
