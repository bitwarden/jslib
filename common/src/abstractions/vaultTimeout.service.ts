export abstract class VaultTimeoutService {
    isLocked: () => Promise<boolean>;
    checkVaultTimeout: () => Promise<void>;
    lock: (allowSoftLock?: boolean) => Promise<void>;
    logOut: () => Promise<void>;
    setVaultTimeoutOptions: (vaultTimeout: number, vaultTimeoutAction: string) => Promise<void>;
    getVaultTimeout: () => Promise<number>;
    isPinLockSet: () => Promise<[boolean, boolean]>;
    isBiometricLockSet: () => Promise<boolean>;
    clear: () => Promise<any>;
}
