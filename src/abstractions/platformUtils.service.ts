import { DeviceType } from '../enums/deviceType';

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
    analyticsId: () => string;
    isViewOpen: () => Promise<boolean>;
    lockTimeout: () => number;
    launchUri: (uri: string, options?: any) => void;
    saveFile: (win: Window, blobData: any, blobOptions: any, fileName: string) => void;
    getApplicationVersion: () => string;
    supportsU2f: (win: Window) => boolean;
    supportsDuo: () => boolean;
    showToast: (type: 'error' | 'success' | 'warning' | 'info', title: string, text: string | string[],
        options?: any) => void;
    showDialog: (text: string, title?: string, confirmText?: string, cancelText?: string,
        type?: string) => Promise<boolean>;
    eventTrack: (action: string, label?: string, options?: any) => void;
    isDev: () => boolean;
    isSelfHost: () => boolean;
    copyToClipboard: (text: string, options?: any) => void;
    readFromClipboard: (options?: any) => Promise<string>;
}
