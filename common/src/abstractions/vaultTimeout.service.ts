import { EncString } from '../models/domain/encString';

export abstract class VaultTimeoutService {
    biometricLocked: boolean;
    everBeenUnlocked: boolean;
    pinProtectedKey: EncString;
    isLocked: () => Promise<boolean>;
    checkVaultTimeout: () => Promise<void>;
    lock: (allowSoftLock?: boolean) => Promise<void>;
    logOut: () => Promise<void>;
    setVaultTimeoutOptions: (vaultTimeout: number, vaultTimeoutAction: string) => Promise<void>;
    isPinLockSet: () => Promise<[boolean, boolean]>;
    isBiometricLockSet: () => Promise<boolean>;
    clear: () => Promise<any>;
}
