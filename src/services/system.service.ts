import { LockService } from '../abstractions/lock.service';
import { MessagingService } from '../abstractions/messaging.service';
import { PlatformUtilsService } from '../abstractions/platformUtils.service';
import { StorageService } from '../abstractions/storage.service';
import { SystemService as SystemServiceAbstraction } from '../abstractions/system.service';

import { ConstantsService } from './constants.service';

import { Utils } from '../misc/utils';

export class SystemService implements SystemServiceAbstraction {
    private reloadInterval: any = null;
    private clearClipboardTimeout: any = null;

    constructor(private storageService: StorageService, private lockService: LockService,
        private messagingService: MessagingService, private platformUtilsService: PlatformUtilsService,
        private reloadCallback: () => Promise<void> = null) {
    }

    startProcessReload(): void {
        if (this.lockService.pinLocked || this.reloadInterval != null) {
            return;
        }
        this.cancelProcessReload();
        this.reloadInterval = setInterval(async () => {
            let doRefresh = false;
            const lastActive = await this.storageService.get<number>(ConstantsService.lastActiveKey);
            if (lastActive != null) {
                const diffSeconds = (new Date()).getTime() - lastActive;
                // Don't refresh if they are still active in the window
                doRefresh = diffSeconds >= 5000;
            }
            if (doRefresh) {
                clearInterval(this.reloadInterval);
                this.reloadInterval = null;
                this.messagingService.send('reloadProcess');
                if (this.reloadCallback != null) {
                    await this.reloadCallback();
                }
            }
        }, 10000);
    }

    cancelProcessReload(): void {
        if (this.reloadInterval != null) {
            clearInterval(this.reloadInterval);
            this.reloadInterval = null;
        }
    }

    clearClipboard(clipboardValue: string, timeoutMs = 30000): void {
        if (this.clearClipboardTimeout != null) {
            clearTimeout(this.clearClipboardTimeout);
            this.clearClipboardTimeout = null;
        }
        if (Utils.isNullOrWhitespace(clipboardValue)) {
            return;
        }
        this.clearClipboardTimeout = setTimeout(async () => {
            const clipboardValueNow = await this.platformUtilsService.readFromClipboard();
            if (clipboardValue === clipboardValueNow) {
                this.platformUtilsService.copyToClipboard('');
            }
        }, timeoutMs);
    }
}
