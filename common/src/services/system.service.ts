import { AccountService } from '../abstractions/account.service';
import { MessagingService } from '../abstractions/messaging.service';
import { PlatformUtilsService } from '../abstractions/platformUtils.service';
import { SystemService as SystemServiceAbstraction } from '../abstractions/system.service';
import { VaultTimeoutService } from '../abstractions/vaultTimeout.service';

import { StorageKey } from '../enums/storageKey';

import { Utils } from '../misc/utils';

export class SystemService implements SystemServiceAbstraction {
    private reloadInterval: any = null;
    private clearClipboardTimeout: any = null;
    private clearClipboardTimeoutFunction: () => Promise<any> = null;

    constructor(private vaultTimeoutService: VaultTimeoutService, private messagingService: MessagingService,
        private platformUtilsService: PlatformUtilsService, private reloadCallback: () => Promise<void> = null,
        private accountService: AccountService) {
    }

    startProcessReload(): void {
        if (this.vaultTimeoutService.pinProtectedKey != null ||
            this.vaultTimeoutService.biometricLocked ||
            this.reloadInterval != null) {
            return;
        }
        this.cancelProcessReload();
        this.reloadInterval = setInterval(async () => {
            let doRefresh = false;
            const lastActive = await this.accountService.getSetting<number>(StorageKey.LastActive);
            if (lastActive != null) {
                const diffSeconds = (new Date()).getTime() - lastActive;
                // Don't refresh if they are still active in the window
                doRefresh = diffSeconds >= 5000;
            }
            const biometricLockedFingerprintValidated =
                await this.accountService.getSetting<boolean>(StorageKey.BiometricFingerprintValidated) && this.vaultTimeoutService.biometricLocked;
            if (doRefresh && !biometricLockedFingerprintValidated) {
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

    clearClipboard(clipboardValue: string, timeoutMs: number = null): void {
        if (this.clearClipboardTimeout != null) {
            clearTimeout(this.clearClipboardTimeout);
            this.clearClipboardTimeout = null;
        }
        if (Utils.isNullOrWhitespace(clipboardValue)) {
            return;
        }
        this.accountService.getSetting<number>(StorageKey.ClearClipboard).then(clearSeconds => {
            if (clearSeconds == null) {
                return;
            }
            if (timeoutMs == null) {
                timeoutMs = clearSeconds * 1000;
            }
            this.clearClipboardTimeoutFunction = async () => {
                const clipboardValueNow = await this.platformUtilsService.readFromClipboard();
                if (clipboardValue === clipboardValueNow) {
                    this.platformUtilsService.copyToClipboard('', { clearing: true });
                }
            };
            this.clearClipboardTimeout = setTimeout(async () => {
                await this.clearPendingClipboard();
            }, timeoutMs);
        });
    }

    async clearPendingClipboard() {
        if (this.clearClipboardTimeoutFunction != null) {
            await this.clearClipboardTimeoutFunction();
            this.clearClipboardTimeoutFunction = null;
        }
    }
}
