import { StorageServiceOptions } from '../models/domain/storageServiceOptions';

export abstract class StorageService {
    get: <T>(key: string, options?: StorageServiceOptions) => Promise<T>;
    has: (key: string, options?: StorageServiceOptions) => Promise<boolean>;
    save: (key: string, obj: any, options?: StorageServiceOptions) => Promise<any>;
    remove: (key: string, options?: StorageServiceOptions) => Promise<any>;
}

