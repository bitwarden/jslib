import { DeviceType } from '../enums/deviceType';
import { ThemeType } from '../enums/themeType';

interface ToastOptions {
    timeout?: number;
}

// TODO: we should split this into a few services, as it is unclear from the name what exactly this service is for.
// Proposal: DeviceService, PlatformService, VersionService, ToastService, DialogueService, ThemeService
export abstract class PlatformUtilsService {
    identityClientId: string;
    getDevice: () => DeviceType;
    getDeviceString: () => string;
    isFirefox: () => boolean;
    isChrome: () => boolean;
    isEdge: () => boolean;
    isOpera: () => boolean;
    isVivaldi: () => boolean;
    isSafari: () => boolean;
    isIE: () => boolean;
    isMacAppStore: () => boolean;
    isViewOpen: () => Promise<boolean>;
    launchUri: (uri: string, options?: any) => void;
    saveFile: (win: Window, blobData: any, blobOptions: any, fileName: string) => void;
    getApplicationVersion: () => Promise<string>;
    supportsWebAuthn: (win: Window) => boolean;
    supportsDuo: () => boolean;
    showToast: (type: 'error' | 'success' | 'warning' | 'info', title: string, text: string | string[],
        options?: ToastOptions) => void;
    showDialog: (body: string, title?: string, confirmText?: string, cancelText?: string,
        type?: string, bodyIsHtml?: boolean) => Promise<boolean>;
    isDev: () => boolean;
    isSelfHost: () => boolean;
    copyToClipboard: (text: string, options?: any) => void | boolean;
    readFromClipboard: (options?: any) => Promise<string>;
    supportsBiometric: () => Promise<boolean>;
    authenticateBiometric: () => Promise<boolean>;
    getDefaultSystemTheme: () => Promise<ThemeType.Light | ThemeType.Dark>;
    onDefaultSystemThemeChange: (callback: ((theme: ThemeType.Light | ThemeType.Dark) => unknown)) => unknown;
    getEffectiveTheme: () => Promise<ThemeType>;
    supportsSecureStorage: () => boolean;
}
