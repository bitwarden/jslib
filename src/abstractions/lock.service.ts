export abstract class LockService {
    checkLock: () => Promise<void>;
    lock: () => Promise<void>;
}
