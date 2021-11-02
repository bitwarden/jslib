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
    async isLocked(): Promise<boolean> {
        // Handle never lock startup situation
        if (await this.cryptoService.hasKeyStored(KeySuffixOptions.Auto) && !(await this.stateService.getEverBeenUnlocked())) {
            await this.cryptoService.getKey(KeySuffixOptions.Auto);
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

    async lock(allowSoftLock = false): Promise<void> {
        const authed = await this.stateService.getIsAuthenticated();
        if (!authed) {
            return;
        }

        await this.stateService.setBiometricLocked(true);
        await this.stateService.setEverBeenUnlocked(true);
        await this.cryptoService.clearKey(false);
        await this.cryptoService.clearOrgKeys(true);
        await this.cryptoService.clearKeyPair(true);
        await this.cryptoService.clearEncKey(true);

        await this.folderService.clearCache();
        await this.cipherService.clearCache();
        await this.collectionService.clearCache();
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
