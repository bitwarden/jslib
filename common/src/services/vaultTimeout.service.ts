import { AccountService } from '../abstractions/account.service';
import { CipherService } from '../abstractions/cipher.service';
import { CollectionService } from '../abstractions/collection.service';
import { CryptoService } from '../abstractions/crypto.service';
import { FolderService } from '../abstractions/folder.service';
import { MessagingService } from '../abstractions/messaging.service';
import { PlatformUtilsService } from '../abstractions/platformUtils.service';
import { PolicyService } from '../abstractions/policy.service';
import { SearchService } from '../abstractions/search.service';
import { TokenService } from '../abstractions/token.service';
import { VaultTimeoutService as VaultTimeoutServiceAbstraction } from '../abstractions/vaultTimeout.service';

import { PolicyType } from '../enums/policyType';
import { StorageKey } from '../enums/storageKey';

import { EncString } from '../models/domain/encString';

export class VaultTimeoutService implements VaultTimeoutServiceAbstraction {
    pinProtectedKey: EncString = null;
    biometricLocked: boolean = true;
    everBeenUnlocked: boolean = false;

    private inited = false;

    constructor(private cipherService: CipherService, private folderService: FolderService,
        private collectionService: CollectionService, private cryptoService: CryptoService,
        protected platformUtilsService: PlatformUtilsService, private messagingService: MessagingService,
        private searchService: SearchService, private tokenService: TokenService,
        private policyService: PolicyService, private accountService: AccountService,
        private lockedCallback: () => Promise<void> = null, private loggedOutCallback: () => Promise<void> = null) {
    }

    init(checkOnInterval: boolean) {
        if (this.inited) {
            return;
        }

        this.inited = true;
        if (checkOnInterval) {
            this.startCheck();
        }
    }

    startCheck() {
        this.checkVaultTimeout();
        setInterval(() => this.checkVaultTimeout(), 10 * 1000); // check every 10 seconds
    }

    // Keys aren't stored for a device that is locked or logged out.
    async isLocked(): Promise<boolean> {
        // Handle never lock startup situation
        if (await this.cryptoService.hasKeyStored('auto') && !this.everBeenUnlocked) {
            await this.cryptoService.getKey('auto');
        }

        return !(await this.cryptoService.hasKeyInMemory());
    }

    async checkVaultTimeout(): Promise<void> {
        if (await this.platformUtilsService.isViewOpen()) {
            // Do not lock
            return;
        }

        // "is logged out check" - similar to isLocked, below
        const authed = this.accountService.activeAccount?.isAuthenticated;
        if (!authed) {
            return;
        }

        if (await this.isLocked()) {
            return;
        }

        const vaultTimeout = await this.getVaultTimeout();
        if (vaultTimeout == null || vaultTimeout < 0) {
            return;
        }

        const lastActive = await this.accountService.getSetting<number>(StorageKey.LastActive);
        if (lastActive == null) {
            return;
        }

        const vaultTimeoutSeconds = vaultTimeout * 60;
        const diffSeconds = ((new Date()).getTime() - lastActive) / 1000;
        if (diffSeconds >= vaultTimeoutSeconds) {
            // Pivot based on the saved vault timeout action
            const timeoutAction = await this.accountService.getSetting<string>(StorageKey.VaultTimeoutAction);
            timeoutAction === 'logOut' ? await this.logOut() : await this.lock(true);
        }
    }

    async lock(allowSoftLock = false): Promise<void> {
        const authed = this.accountService.activeAccount?.isAuthenticated;
        if (!authed) {
            return;
        }

        this.biometricLocked = true;
        this.everBeenUnlocked = true;
        await this.cryptoService.clearKey(false);
        await this.cryptoService.clearOrgKeys(true);
        await this.cryptoService.clearKeyPair(true);
        await this.cryptoService.clearEncKey(true);

        this.folderService.clearCache();
        this.cipherService.clearCache();
        this.collectionService.clearCache();
        this.searchService.clearIndex();
        this.messagingService.send('locked');
        if (this.lockedCallback != null) {
            await this.lockedCallback();
        }
    }

    async logOut(): Promise<void> {
        if (this.loggedOutCallback != null) {
            await this.loggedOutCallback();
        }
    }

    async setVaultTimeoutOptions(timeout: number, action: string): Promise<void> {
        await this.accountService.saveSetting(StorageKey.VaultTimeout, timeout);
        await this.accountService.saveSetting(StorageKey.VaultTimeoutAction, action);
        await this.cryptoService.toggleKey();
        await this.tokenService.toggleTokens();
    }

    async isPinLockSet(): Promise<[boolean, boolean]> {
        const protectedPin = await this.accountService.getSetting<string>(StorageKey.ProtectedPin);
        const pinProtectedKey = await this.accountService.getSetting<string>(StorageKey.PinProtectedKey);
        return [protectedPin != null, pinProtectedKey != null];
    }

    async isBiometricLockSet(): Promise<boolean> {
        return await this.accountService.getSetting<boolean>(StorageKey.BiometricUnlock);
    }

    async getVaultTimeout(): Promise<number> {
        const vaultTimeout = await this.accountService.getSetting<number>(StorageKey.VaultTimeout);

        if (await this.policyService.policyAppliesToUser(PolicyType.MaximumVaultTimeout)) {
            const policy = await this.policyService.getAll(PolicyType.MaximumVaultTimeout);
            // Remove negative values, and ensure it's smaller than maximum allowed value according to policy
            let timeout = Math.min(vaultTimeout, policy[0].data.minutes);

            if (vaultTimeout == null || timeout < 0) {
                timeout = policy[0].data.minutes;
            }

            // We really shouldn't need to set the value here, but multiple services relies on this value being correct.
            if (vaultTimeout !== timeout) {
                await this.accountService.saveSetting(StorageKey.VaultTimeout, timeout);
            }

            return timeout;
        }

        return vaultTimeout;
    }

    clear(): Promise<any> {
        this.everBeenUnlocked = false;
        this.pinProtectedKey = null;
        return this.accountService.removeSetting(StorageKey.ProtectedPin);
    }
}
