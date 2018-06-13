import { ConstantsService } from './constants.service';

import { CipherService } from '../abstractions/cipher.service';
import { CollectionService } from '../abstractions/collection.service';
import { CryptoService } from '../abstractions/crypto.service';
import { FolderService } from '../abstractions/folder.service';
import { LockService as LockServiceAbstraction } from '../abstractions/lock.service';
import { MessagingService } from '../abstractions/messaging.service';
import { PlatformUtilsService } from '../abstractions/platformUtils.service';
import { StorageService } from '../abstractions/storage.service';

export class LockService implements LockServiceAbstraction {
    private inited = false;

    constructor(private cipherService: CipherService, private folderService: FolderService,
        private collectionService: CollectionService, private cryptoService: CryptoService,
        private platformUtilsService: PlatformUtilsService, private storageService: StorageService,
        private messagingService: MessagingService, private lockedCallback: () => Promise<void>) {
    }

    init(checkOnInterval: boolean) {
        if (this.inited) {
            return;
        }

        this.inited = true;
        if (checkOnInterval) {
            this.checkLock();
            setInterval(() => this.checkLock(), 10 * 1000); // check every 10 seconds
        }
    }

    async checkLock(): Promise<void> {
        if (this.platformUtilsService.isViewOpen()) {
            // Do not lock
            return;
        }

        const hasKey = await this.cryptoService.hasKey();
        if (!hasKey) {
            // no key so no need to lock
            return;
        }

        let lockOption = this.platformUtilsService.lockTimeout();
        if (lockOption == null) {
            lockOption = await this.storageService.get<number>(ConstantsService.lockOptionKey);
        }
        if (lockOption == null || lockOption < 0) {
            return;
        }

        const lastActive = await this.storageService.get<number>(ConstantsService.lastActiveKey);
        if (lastActive == null) {
            return;
        }

        const lockOptionSeconds = lockOption * 60;
        const diffSeconds = ((new Date()).getTime() - lastActive) / 1000;
        if (diffSeconds >= lockOptionSeconds) {
            // need to lock now
            await this.lock();
        }
    }

    async lock(): Promise<void> {
        await Promise.all([
            this.cryptoService.clearKey(),
            this.cryptoService.clearOrgKeys(true),
            this.cryptoService.clearPrivateKey(true),
            this.cryptoService.clearEncKey(true),
        ]);

        this.folderService.clearCache();
        this.cipherService.clearCache();
        this.collectionService.clearCache();
        this.messagingService.send('locked');
        if (this.lockedCallback != null) {
            await this.lockedCallback();
        }
    }

    async setLockOption(lockOption: number): Promise<void> {
        await this.storageService.save(ConstantsService.lockOptionKey, lockOption);
        await this.cryptoService.toggleKey();
    }
}
