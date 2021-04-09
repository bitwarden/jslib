import {
    clipboard,
    ipcRenderer,
    shell,
} from 'electron';

import {
    isDev,
    isMacAppStore,
} from '../utils';

import { DeviceType } from '../../enums/deviceType';

import { I18nService } from '../../abstractions/i18n.service';
import { MessagingService } from '../../abstractions/messaging.service';
import { PlatformUtilsService } from '../../abstractions/platformUtils.service';
import { StorageService } from '../../abstractions/storage.service';

import { AnalyticsIds } from '../../misc/analytics';
import { ElectronConstants } from '../electronConstants';

export class ElectronPlatformUtilsService implements PlatformUtilsService {
    identityClientId: string;

    private deviceCache: DeviceType = null;
    private analyticsIdCache: string = null;

    constructor(private i18nService: I18nService, private messagingService: MessagingService,
        private isDesktopApp: boolean, private storageService: StorageService) {
        this.identityClientId = isDesktopApp ? 'desktop' : 'connector';
    }

    getDevice(): DeviceType {
        if (!this.deviceCache) {
            switch (process.platform) {
                case 'win32':
                    this.deviceCache = DeviceType.WindowsDesktop;
                    break;
                case 'darwin':
                    this.deviceCache = DeviceType.MacOsDesktop;
                    break;
                case 'linux':
                default:
                    this.deviceCache = DeviceType.LinuxDesktop;
                    break;
            }
        }

        return this.deviceCache;
    }

    getDeviceString(): string {
        const device = DeviceType[this.getDevice()].toLowerCase();
        return device.replace('desktop', '');
    }

    isFirefox(): boolean {
        return false;
    }

    isChrome(): boolean {
        return true;
    }

    isEdge(): boolean {
        return false;
    }

    isOpera(): boolean {
        return false;
    }

    isVivaldi(): boolean {
        return false;
    }

    isSafari(): boolean {
        return false;
    }

    isIE(): boolean {
        return false;
    }

    isMacAppStore(): boolean {
        return isMacAppStore();
    }

    analyticsId(): string {
        if (!this.isDesktopApp) {
            return null;
        }

        if (this.analyticsIdCache) {
            return this.analyticsIdCache;
        }

        this.analyticsIdCache = (AnalyticsIds as any)[this.getDevice()];
        return this.analyticsIdCache;
    }

    isViewOpen(): Promise<boolean> {
        return Promise.resolve(false);
    }

    lockTimeout(): number {
        return null;
    }

    launchUri(uri: string, options?: any): void {
        shell.openExternal(uri);
    }

    saveFile(win: Window, blobData: any, blobOptions: any, fileName: string): void {
        ipcRenderer.invoke('saveFile', {
            fileName: fileName,
            buffer: Buffer.from(blobData),
        });
    }

    getApplicationVersion(): Promise<string> {
        return ipcRenderer.invoke('appVersion');
    }

    // Temporarily restricted to only Windows until https://github.com/electron/electron/pull/28349
    // has been merged and an updated electron build is available.
    supportsWebAuthn(win: Window): boolean {
        return process.platform === 'win32';
    }

    supportsDuo(): boolean {
        return true;
    }

    showToast(type: 'error' | 'success' | 'warning' | 'info', title: string, text: string | string[],
        options?: any): void {
        this.messagingService.send('showToast', {
            text: text,
            title: title,
            type: type,
            options: options,
        });
    }

    async showDialog(text: string, title?: string, confirmText?: string, cancelText?: string, type?: string):
        Promise<boolean> {
        const buttons = [confirmText == null ? this.i18nService.t('ok') : confirmText];
        if (cancelText != null) {
            buttons.push(cancelText);
        }

        const result = await ipcRenderer.invoke('showMessageBox', {
            type: type,
            title: title,
            message: title,
            detail: text,
            buttons: buttons,
            cancelId: buttons.length === 2 ? 1 : null,
            defaultId: 0,
            noLink: true,
        });

        return Promise.resolve(result.response === 0);
    }

    eventTrack(action: string, label?: string, options?: any) {
        this.messagingService.send('analyticsEventTrack', {
            action: action,
            label: label,
            options: options,
        });
    }

    isDev(): boolean {
        return isDev();
    }

    isSelfHost(): boolean {
        return false;
    }

    copyToClipboard(text: string, options?: any): void {
        const type = options ? options.type : null;
        const clearing = options ? !!options.clearing : false;
        const clearMs: number = options && options.clearMs ? options.clearMs : null;
        clipboard.writeText(text, type);
        if (!clearing) {
            this.messagingService.send('copiedToClipboard', {
                clipboardValue: text,
                clearMs: clearMs,
                type: type,
                clearing: clearing,
            });
        }
    }

    readFromClipboard(options?: any): Promise<string> {
        const type = options ? options.type : null;
        return Promise.resolve(clipboard.readText(type));
    }

    supportsBiometric(): Promise<boolean> {
        return this.storageService.get(ElectronConstants.enableBiometric);
    }

    authenticateBiometric(): Promise<boolean> {
        return new Promise(resolve => {
            const val = ipcRenderer.sendSync('biometric', {
                action: 'authenticate',
            });
            resolve(val);
        });
    }

    getDefaultSystemTheme() {
        return ipcRenderer.invoke('systemTheme');
    }

    onDefaultSystemThemeChange(callback: ((theme: 'light' | 'dark') => unknown)) {
        ipcRenderer.on('systemThemeUpdated', (event, theme: 'light' | 'dark') => callback(theme));
    }

    supportsSecureStorage(): boolean {
        return true;
    }
}
