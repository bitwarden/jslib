import { DeviceType } from '../enums/deviceType';

export interface PlatformUtilsService {
    getDevice(): DeviceType;
    getDeviceString(): string;
    isFirefox(): boolean;
    isChrome(): boolean;
    isEdge(): boolean;
    isOpera(): boolean;
    analyticsId(): string;
    getDomain(uriString: string): string;
    isViewOpen(): boolean;
}
