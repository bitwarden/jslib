import { CipherString } from '../models/domain/cipherString';

export abstract class VaultTimeoutService {
    biometricLocked: boolean;
    pinProtectedKey: CipherString;
    isLocked: () => Promise<boolean>;
    checkVaultTimeout: () => Promise<void>;
    lock: (allowSoftLock?: boolean) => Promise<void>;
    logOut: () => Promise<void>;
    setVaultTimeoutOptions: (vaultTimeout: number, vaultTimeoutAction: string) => Promise<void>;
    isPinLockSet: () => Promise<[boolean, boolean]>;
    isBiometricLockSet: () => Promise<boolean>;
    clear: () => Promise<any>;
}
