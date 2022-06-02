export abstract class VaultTimeoutService {
  checkVaultTimeout: () => Promise<void>;
  lock: (allowSoftLock?: boolean, userId?: string) => Promise<void>;
  logOut: (userId?: string) => Promise<void>;
  setVaultTimeoutOptions: (vaultTimeout: number, vaultTimeoutAction: string) => Promise<void>;
  getVaultTimeout: () => Promise<number>;
  isPinLockSet: () => Promise<[boolean, boolean]>;
  isBiometricLockSet: () => Promise<boolean>;
  clear: (userId?: string) => Promise<any>;
}
