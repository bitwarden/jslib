import {
    SyncCipherNotification,
    SyncFolderNotification,
} from '../models/response/notificationResponse';

export abstract class SyncService {
    syncInProgress: boolean;

    getLastSync: () => Promise<Date>;
    setLastSync: (date: Date) => Promise<any>;
    fullSync: (forceSync: boolean) => Promise<boolean>;
    syncUpsertFolder: (notification: SyncFolderNotification) => Promise<boolean>;
    syncDeleteFolder: (notification: SyncFolderNotification) => Promise<boolean>;
    syncUpsertCipher: (notification: SyncCipherNotification) => Promise<boolean>;
    syncDeleteCipher: (notification: SyncFolderNotification) => Promise<boolean>;
}
