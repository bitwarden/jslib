export abstract class SyncService {
    syncInProgress: boolean;

    getLastSync: () => Promise<Date>;
    setLastSync: (date: Date) => Promise<any>;
    syncStarted: () => void;
    syncCompleted: (successfully: boolean) => void;
    fullSync: (forceSync: boolean) => Promise<boolean>;
}
