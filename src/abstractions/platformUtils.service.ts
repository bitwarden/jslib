import { DeviceType } from '../enums/deviceType';

export interface PlatformUtilsService {
    getDevice(): DeviceType;
    getDeviceString(): string;
    isFirefox(): boolean;
    isChrome(): boolean;
    isEdge(): boolean;
    isOpera(): boolean;
    isVivaldi(): boolean;
    isSafari(): boolean;
    analyticsId(): string;
    getDomain(uriString: string): string;
    isViewOpen(): boolean;
}
