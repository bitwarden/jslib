export interface LockService {
    checkLock(): Promise<void>;
    lock(): Promise<void>;
}
