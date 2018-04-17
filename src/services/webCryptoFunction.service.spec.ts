import { DeviceType } from '../enums/deviceType';

import { PlatformUtilsService } from '../abstractions/platformUtils.service';

import { WebCryptoFunctionService } from './webCryptoFunction.service';

import { UtilsService } from './utils.service';

describe('WebCrypto Function Service', () => {
    describe('pbkdf2', () => {
        const regular256Key = 'pj9prw/OHPleXI6bRdmlaD+saJS4awrMiQsQiDjeu2I=';
        const utf8256Key = 'yqvoFXgMRmHR3QPYr5pyR4uVuoHkltv9aHUP63p8n7I=';
        const unicode256Key = 'ZdeOata6xoRpB4DLp8zHhXz5kLmkWtX5pd+TdRH8w8w=';

        const regular512Key = 'liTi/Ke8LPU1Qv+Vl7NGEVt/XMbsBVJ2kQxtVG/Z1/I=';
        const utf8512Key = 'df0KdvIBeCzD/kyXptwQohaqUa4e7IyFUyhFQjXCANs=';
        const unicode512Key = 'FE+AnUJaxv8jh+zUDtZz4mjjcYk0/PZDZm+SLJe3Xtw=';

        testPbkdf2ValidKey(false, 'sha256', regular256Key, utf8256Key, unicode256Key);
        testPbkdf2ValidKey(false, 'sha512', regular512Key, utf8512Key, unicode512Key);
        testPbkdf2ValidKey(true, 'sha256', regular256Key, utf8256Key, unicode256Key);
        testPbkdf2ValidKey(true, 'sha512', regular512Key, utf8512Key, unicode512Key);
    });
});

function testPbkdf2ValidKey(edge: boolean, algorithm: 'sha256' | 'sha512', regularKey: string,
    utf8Key: string, unicodeKey: string) {
    const forEdge = edge ? ' for edge' : '';
    const regularEmail = 'user@example.com';
    const utf8Email = 'üser@example.com';

    const regularPassword = 'password';
    const utf8Password = 'pǻssword';
    const unicodePassword = '😀password🙏';

    it('should create valid ' + algorithm + ' key from regular input' + forEdge, async () => {
        const webCryptoFunctionService = getWebCryptoFunctionService(edge);
        const key = await webCryptoFunctionService.pbkdf2(regularPassword, regularEmail, algorithm, 5000, 256);
        expect(UtilsService.fromBufferToB64(key)).toBe(regularKey);
    });

    it('should create valid ' + algorithm + ' key from utf8 input' + forEdge, async () => {
        const webCryptoFunctionService = getWebCryptoFunctionService(edge);
        const key = await webCryptoFunctionService.pbkdf2(utf8Password, utf8Email, algorithm, 5000, 256);
        expect(UtilsService.fromBufferToB64(key)).toBe(utf8Key);
    });

    it('should create valid ' + algorithm + ' key from unicode input' + forEdge, async () => {
        const webCryptoFunctionService = getWebCryptoFunctionService(edge);
        const key = await webCryptoFunctionService.pbkdf2(UtilsService.fromUtf8ToArray(unicodePassword).buffer,
            UtilsService.fromUtf8ToArray(regularEmail).buffer, algorithm, 5000, 256);
        expect(UtilsService.fromBufferToB64(key)).toBe(unicodeKey);
    });

    it('should create valid ' + algorithm + ' key from array buffer input' + forEdge, async () => {
        const webCryptoFunctionService = getWebCryptoFunctionService(edge);
        const key = await webCryptoFunctionService.pbkdf2(UtilsService.fromUtf8ToArray(regularPassword).buffer,
            UtilsService.fromUtf8ToArray(regularEmail).buffer, algorithm, 5000, 256);
        expect(UtilsService.fromBufferToB64(key)).toBe(regularKey);
    });
}

function getWebCryptoFunctionService(edge = false) {
    const platformUtilsService = new BrowserPlatformUtilsService(edge);
    return new WebCryptoFunctionService(window, platformUtilsService);
}

class BrowserPlatformUtilsService implements PlatformUtilsService {
    constructor(private edge: boolean) { }

    isEdge() {
        return this.edge;
    }

    identityClientId: string;
    getDevice: () => DeviceType;
    getDeviceString: () => string;
    isFirefox: () => boolean;
    isChrome: () => boolean;
    isOpera: () => boolean;
    isVivaldi: () => boolean;
    isSafari: () => boolean;
    isMacAppStore: () => boolean;
    analyticsId: () => string;
    getDomain: (uriString: string) => string;
    isViewOpen: () => boolean;
    launchUri: (uri: string, options?: any) => void;
    saveFile: (win: Window, blobData: any, blobOptions: any, fileName: string) => void;
    getApplicationVersion: () => string;
    supportsU2f: (win: Window) => boolean;
    showDialog: (text: string, title?: string, confirmText?: string, cancelText?: string,
        type?: string) => Promise<boolean>;
    isDev: () => boolean;
    copyToClipboard: (text: string, options?: any) => void;
}
