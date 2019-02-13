export abstract class LockService {
    checkLock: () => Promise<void>;
    lock: () => Promise<void>;
    setLockOption: (lockOption: number) => Promise<void>;
    isPinLockSet: () => Promise<boolean>;
}
