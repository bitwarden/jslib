export interface SyncService {
    syncInProgress: boolean;

    getLastSync();
    setLastSync(date: Date);
    syncStarted();
    syncCompleted(successfully: boolean);
    fullSync(forceSync: boolean);
}
