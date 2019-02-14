export abstract class LockService {
    pinLocked: boolean;
    isLocked: () => Promise<boolean>;
    checkLock: () => Promise<void>;
    lock: (allowSoftLock?: boolean) => Promise<void>;
    setLockOption: (lockOption: number) => Promise<void>;
    isPinLockSet: () => Promise<[boolean, boolean]>;
    clear: () => Promise<any>;
}
