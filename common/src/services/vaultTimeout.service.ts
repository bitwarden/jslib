import { ConstantsService } from './constants.service';

import { CipherService } from '../abstractions/cipher.service';
import { CollectionService } from '../abstractions/collection.service';
import { CryptoService } from '../abstractions/crypto.service';
import { FolderService } from '../abstractions/folder.service';
import { MessagingService } from '../abstractions/messaging.service';
import { PlatformUtilsService } from '../abstractions/platformUtils.service';
import { SearchService } from '../abstractions/search.service';
import { StorageService } from '../abstractions/storage.service';
import { TokenService } from '../abstractions/token.service';
import { UserService } from '../abstractions/user.service';
import { VaultTimeoutService as VaultTimeoutServiceAbstraction } from '../abstractions/vaultTimeout.service';

import { EncString } from '../models/domain/encString';

export class VaultTimeoutService implements VaultTimeoutServiceAbstraction {
    pinProtectedKey: EncString = null;
    biometricLocked: boolean = true;
    everBeenUnlocked: boolean = false;

    private inited = false;

    constructor(private cipherService: CipherService, private folderService: FolderService,
        private collectionService: CollectionService, private cryptoService: CryptoService,
        protected platformUtilsService: PlatformUtilsService, private storageService: StorageService,
        private messagingService: MessagingService, private searchService: SearchService,
        private userService: UserService, private tokenService: TokenService,
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

        return !this.cryptoService.hasKeyInMemory();
    }

    async checkVaultTimeout(): Promise<void> {
        if (await this.platformUtilsService.isViewOpen()) {
            // Do not lock
            return;
        }

        // "is logged out check" - similar to isLocked, below
        const authed = await this.userService.isAuthenticated();
        if (!authed) {
            return;
        }

        if (await this.isLocked()) {
            return;
        }

        // This has the potential to be removed. Evaluate after all platforms complete with auto-logout
        let vaultTimeout = this.platformUtilsService.lockTimeout();
        if (vaultTimeout == null) {
            vaultTimeout = await this.storageService.get<number>(ConstantsService.vaultTimeoutKey);
        }

        if (vaultTimeout == null || vaultTimeout < 0) {
            return;
        }

        const lastActive = await this.storageService.get<number>(ConstantsService.lastActiveKey);
        if (lastActive == null) {
            return;
        }

        const vaultTimeoutSeconds = vaultTimeout * 60;
        const diffSeconds = ((new Date()).getTime() - lastActive) / 1000;
        if (diffSeconds >= vaultTimeoutSeconds) {
            // Pivot based on the saved vault timeout action
            const timeoutAction = await this.storageService.get<string>(ConstantsService.vaultTimeoutActionKey);
            timeoutAction === 'logOut' ? await this.logOut() : await this.lock(true);
        }
    }

    async lock(allowSoftLock = false): Promise<void> {
        const authed = await this.userService.isAuthenticated();
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
        await this.storageService.save(ConstantsService.vaultTimeoutKey, timeout);
        await this.storageService.save(ConstantsService.vaultTimeoutActionKey, action);
        await this.cryptoService.toggleKey();
        await this.tokenService.toggleTokens();
    }

    async isPinLockSet(): Promise<[boolean, boolean]> {
        const protectedPin = await this.storageService.get<string>(ConstantsService.protectedPin);
        const pinProtectedKey = await this.storageService.get<string>(ConstantsService.pinProtectedKey);
        return [protectedPin != null, pinProtectedKey != null];
    }

    async isBiometricLockSet(): Promise<boolean> {
        return await this.storageService.get<boolean>(ConstantsService.biometricUnlockKey);
    }

    clear(): Promise<any> {
        this.everBeenUnlocked = false;
        this.pinProtectedKey = null;
        return this.storageService.remove(ConstantsService.protectedPin);
    }
}
