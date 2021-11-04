import { CipherService } from '../abstractions/cipher.service';
import { CollectionService } from '../abstractions/collection.service';
import { CryptoService } from '../abstractions/crypto.service';
import { FolderService } from '../abstractions/folder.service';
import { MessagingService } from '../abstractions/messaging.service';
import { PlatformUtilsService } from '../abstractions/platformUtils.service';
import { PolicyService } from '../abstractions/policy.service';
import { SearchService } from '../abstractions/search.service';
import { StateService } from '../abstractions/state.service';
import { TokenService } from '../abstractions/token.service';
import { VaultTimeoutService as VaultTimeoutServiceAbstraction } from '../abstractions/vaultTimeout.service';
import { KeySuffixOptions } from '../enums/keySuffixOptions';

import { PolicyType } from '../enums/policyType';
import { StorageLocation } from '../enums/storageLocation';


export class VaultTimeoutService implements VaultTimeoutServiceAbstraction {
    private inited = false;

    constructor(private cipherService: CipherService, private folderService: FolderService,
        private collectionService: CollectionService, private cryptoService: CryptoService,
        protected platformUtilsService: PlatformUtilsService, private messagingService: MessagingService,
        private searchService: SearchService, private tokenService: TokenService,
        private policyService: PolicyService, private stateService: StateService,
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
    async isLocked(userId?: string): Promise<boolean> {
        const neverLock = await this.cryptoService.hasKeyStored(KeySuffixOptions.Auto, userId) &&
            !(await this.stateService.getEverBeenUnlocked({ userId: userId }));
        if (neverLock) {
            return (await this.cryptoService.getKey(KeySuffixOptions.Auto, userId)) != null;
        }

        return !(await this.cryptoService.hasKeyInMemory());
    }

    async checkVaultTimeout(): Promise<void> {
        if (await this.platformUtilsService.isViewOpen()) {
            // Do not lock
            return;
        }

        // "is logged out check" - similar to isLocked, below
        const authed = await this.stateService.getIsAuthenticated();
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

        const lastActive = await this.stateService.getLastActive();
        if (lastActive == null) {
            return;
        }

        const vaultTimeoutSeconds = vaultTimeout * 60;
        const diffSeconds = ((new Date()).getTime() - lastActive) / 1000;
        if (diffSeconds >= vaultTimeoutSeconds) {
            // Pivot based on the saved vault timeout action
            const timeoutAction = await this.stateService.getVaultTimeoutAction();
            timeoutAction === 'logOut' ? await this.logOut() : await this.lock(true);
        }
    }

    async lock(allowSoftLock = false, userId?: string): Promise<void> {
        const authed = await this.stateService.getIsAuthenticated({ userId: userId });
        if (!authed) {
            return;
        }

        if (userId == null || userId === await this.stateService.getUserId()) {
            this.searchService.clearIndex();
        }

        await this.folderService.clearCache(userId);
        await this.cipherService.clearCache(userId);
        await this.collectionService.clearCache(userId);
        await this.stateService.setEverBeenUnlocked(true, { userId: userId });
        await this.cryptoService.clearKey(false, userId);
        await this.cryptoService.clearOrgKeys(true, userId);
        await this.cryptoService.clearKeyPair(true, userId);
        await this.cryptoService.clearEncKey(true, userId);
        await this.stateService.setBiometricLocked(true, { userId: userId });

        this.messagingService.send('locked', { userId: userId });
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
        await this.stateService.setVaultTimeout(timeout);
        await this.stateService.setVaultTimeoutAction(action);
        await this.cryptoService.toggleKey();
        await this.tokenService.toggleTokens();
    }

    async isPinLockSet(): Promise<[boolean, boolean]> {
        const protectedPin = await this.stateService.getProtectedPin();
        const pinProtectedKey = await this.stateService.getEncryptedPinProtected();
        return [protectedPin != null, pinProtectedKey != null];
    }

    async isBiometricLockSet(): Promise<boolean> {
        return await this.stateService.getBiometricUnlock();
    }

    async getVaultTimeout(): Promise<number> {
        const vaultTimeout = await this.stateService.getVaultTimeout();

        if (await this.policyService.policyAppliesToUser(PolicyType.MaximumVaultTimeout)) {
            const policy = await this.policyService.getAll(PolicyType.MaximumVaultTimeout);
            // Remove negative values, and ensure it's smaller than maximum allowed value according to policy
            let timeout = Math.min(vaultTimeout, policy[0].data.minutes);

            if (vaultTimeout == null || timeout < 0) {
                timeout = policy[0].data.minutes;
            }

            // We really shouldn't need to set the value here, but multiple services relies on this value being correct.
            if (vaultTimeout !== timeout) {
                await this.stateService.setVaultTimeout(timeout);
            }

            return timeout;
        }

        return vaultTimeout;
    }

    async clear(): Promise<void> {
        await this.stateService.setEverBeenUnlocked(false);
        await this.stateService.setDecryptedPinProtected(null);
        await this.stateService.setProtectedPin(null);
    }
}
