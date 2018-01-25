import { DeviceType } from '../enums/deviceType';

export abstract class PlatformUtilsService {
    getDevice: () => DeviceType;
    getDeviceString: () => string;
    isFirefox: () => boolean;
    isChrome: () => boolean;
    isEdge: () => boolean;
    isOpera: () => boolean;
    isVivaldi: () => boolean;
    isSafari: () => boolean;
    analyticsId: () => string;
    getDomain: (uriString: string) => string;
    isViewOpen: () => boolean;
    launchUri: (uri: string) => void;
    saveFile: (win: Window, blobData: any, blobOptions: any, fileName: string) => void;
    alertError: (title: string, message: string) => void;
}
