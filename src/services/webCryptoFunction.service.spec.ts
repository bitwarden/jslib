import { DeviceType } from '../enums/deviceType';

import { PlatformUtilsService } from '../abstractions/platformUtils.service';

import { WebCryptoFunctionService } from './webCryptoFunction.service';

import { UtilsService } from './utils.service';

describe('WebCrypto Function Service', () => {
    describe('pbkdf2', () => {
        const regular256Key = 'pj9prw/OHPleXI6bRdmlaD+saJS4awrMiQsQiDjeu2I=';
        const utf8256Key = 'yqvoFXgMRmHR3QPYr5pyR4uVuoHkltv9aHUP63p8n7I=';
        const unicode256Key = 'ZdeOata6xoRpB4DLp8zHhXz5kLmkWtX5pd+TdRH8w8w=';

        const regular512Key = 'liTi/Ke8LPU1Qv+Vl7NGEVt/XMbsBVJ2kQxtVG/Z1/JFHFKQW3ZkI81qVlwTiCpb+cFXzs+57' +
            'eyhhx5wfKo5Cg==';
        const utf8512Key = 'df0KdvIBeCzD/kyXptwQohaqUa4e7IyFUyhFQjXCANu5T+scq55hCcE4dG4T/MhAk2exw8j7ixRN' +
            'zXANiVZpnw==';
        const unicode512Key = 'FE+AnUJaxv8jh+zUDtZz4mjjcYk0/PZDZm+SLJe3XtxtnpdqqpblX6JjuMZt/dYYNMOrb2+mD' +
            'L3FiQDTROh1lg==';

        testPbkdf2(false, 'sha256', regular256Key, utf8256Key, unicode256Key);
        testPbkdf2(false, 'sha512', regular512Key, utf8512Key, unicode512Key);

        testPbkdf2(true, 'sha256', regular256Key, utf8256Key, unicode256Key);
        testPbkdf2(true, 'sha512', regular512Key, utf8512Key, unicode512Key);
    });

    describe('hash', () => {
        const regular1Hash = '2a241604fb921fad12bf877282457268e1dccb70';
        const utf81Hash = '85672798dc5831e96d6c48655d3d39365a9c88b6';
        const unicode1Hash = '39c975935054a3efc805a9709b60763a823a6ad4';

        const regular256Hash = '2b8e96031d352a8655d733d7a930b5ffbea69dc25cf65c7bca7dd946278908b2';
        const utf8256Hash = '25fe8440f5b01ed113b0a0e38e721b126d2f3f77a67518c4a04fcde4e33eeb9d';
        const unicode256Hash = 'adc1c0c2afd6e92cefdf703f9b6eb2c38e0d6d1a040c83f8505c561fea58852e';

        const regular512Hash = 'c15cf11d43bde333647e3f559ec4193bb2edeaa0e8b902772f514cdf3f785a3f49a6e02a4b87b3' +
            'b47523271ad45b7e0aebb5cdcc1bc54815d256eb5dcb80da9d';
        const utf8512Hash = '035c31a877a291af09ed2d3a1a293e69c3e079ea2cecc00211f35e6bce10474ca3ad6e30b59e26118' +
            '37463f20969c5bc95282965a051a88f8cdf2e166549fcdd';
        const unicode512Hash = '2b16a5561af8ad6fe414cc103fc8036492e1fc6d9aabe1b655497054f760fe0e34c5d100ac773d' +
            '9f3030438284f22dbfa20cb2e9b019f2c98dfe38ce1ef41bae';

        testHash(false, 'sha1', regular1Hash, utf81Hash, unicode1Hash);
        testHash(false, 'sha256', regular256Hash, utf8256Hash, unicode256Hash);
        testHash(false, 'sha512', regular512Hash, utf8512Hash, unicode512Hash);

        testHash(true, 'sha1', regular1Hash, utf81Hash, unicode1Hash);
        testHash(true, 'sha256', regular256Hash, utf8256Hash, unicode256Hash);
        testHash(true, 'sha512', regular512Hash, utf8512Hash, unicode512Hash);
    });

    describe('hmac', () => {
        const sha1Mac = '4d4c223f95dc577b665ec4ccbcb680b80a397038';
        const sha256Mac = '6be3caa84922e12aaaaa2f16c40d44433bb081ef323db584eb616333ab4e874f';
        const sha512Mac = '21910e341fa12106ca35758a2285374509326c9fbe0bd64e7b99c898f841dc948c58ce66d3504d8883c' +
            '5ea7817a0b7c5d4d9b00364ccd214669131fc17fe4aca';

        testHmac(false, 'sha1', sha1Mac);
        testHmac(false, 'sha256', sha256Mac);
        testHmac(false, 'sha512', sha512Mac);

        testHmac(true, 'sha1', sha1Mac);
        testHmac(true, 'sha256', sha256Mac);
        testHmac(true, 'sha512', sha512Mac);
    });
});

function testPbkdf2(edge: boolean, algorithm: 'sha256' | 'sha512', regularKey: string,
    utf8Key: string, unicodeKey: string) {
    const forEdge = edge ? ' for edge' : '';
    const regularEmail = 'user@example.com';
    const utf8Email = 'üser@example.com';

    const regularPassword = 'password';
    const utf8Password = 'pǻssword';
    const unicodePassword = '😀password🙏';

    it('should create valid ' + algorithm + ' key from regular input' + forEdge, async () => {
        const webCryptoFunctionService = getWebCryptoFunctionService(edge);
        const key = await webCryptoFunctionService.pbkdf2(regularPassword, regularEmail, algorithm, 5000);
        expect(UtilsService.fromBufferToB64(key)).toBe(regularKey);
    });

    it('should create valid ' + algorithm + ' key from utf8 input' + forEdge, async () => {
        const webCryptoFunctionService = getWebCryptoFunctionService(edge);
        const key = await webCryptoFunctionService.pbkdf2(utf8Password, utf8Email, algorithm, 5000);
        expect(UtilsService.fromBufferToB64(key)).toBe(utf8Key);
    });

    it('should create valid ' + algorithm + ' key from unicode input' + forEdge, async () => {
        const webCryptoFunctionService = getWebCryptoFunctionService(edge);
        const key = await webCryptoFunctionService.pbkdf2(unicodePassword, regularEmail, algorithm, 5000);
        expect(UtilsService.fromBufferToB64(key)).toBe(unicodeKey);
    });

    it('should create valid ' + algorithm + ' key from array buffer input' + forEdge, async () => {
        const webCryptoFunctionService = getWebCryptoFunctionService(edge);
        const key = await webCryptoFunctionService.pbkdf2(UtilsService.fromUtf8ToArray(regularPassword).buffer,
            UtilsService.fromUtf8ToArray(regularEmail).buffer, algorithm, 5000);
        expect(UtilsService.fromBufferToB64(key)).toBe(regularKey);
    });
}

function testHash(edge: boolean, algorithm: 'sha1' | 'sha256' | 'sha512', regularHash: string,
    utf8Hash: string, unicodeHash: string) {
    const forEdge = edge ? ' for edge' : '';
    const regularValue = 'HashMe!!';
    const utf8Value = 'HǻshMe!!';
    const unicodeValue = '😀HashMe!!!🙏';

    it('should create valid ' + algorithm + ' hash from regular input' + forEdge, async () => {
        const webCryptoFunctionService = getWebCryptoFunctionService(edge);
        const hash = await webCryptoFunctionService.hash(regularValue, algorithm);
        expect(UtilsService.fromBufferToHex(hash)).toBe(regularHash);
    });

    it('should create valid ' + algorithm + ' hash from utf8 input' + forEdge, async () => {
        const webCryptoFunctionService = getWebCryptoFunctionService(edge);
        const hash = await webCryptoFunctionService.hash(utf8Value, algorithm);
        expect(UtilsService.fromBufferToHex(hash)).toBe(utf8Hash);
    });

    it('should create valid ' + algorithm + ' hash from unicode input' + forEdge, async () => {
        const webCryptoFunctionService = getWebCryptoFunctionService(edge);
        const hash = await webCryptoFunctionService.hash(unicodeValue, algorithm);
        expect(UtilsService.fromBufferToHex(hash)).toBe(unicodeHash);
    });

    it('should create valid ' + algorithm + ' hash from array buffer input' + forEdge, async () => {
        const webCryptoFunctionService = getWebCryptoFunctionService(edge);
        const hash = await webCryptoFunctionService.hash(UtilsService.fromUtf8ToArray(regularValue).buffer, algorithm);
        expect(UtilsService.fromBufferToHex(hash)).toBe(regularHash);
    });
}

function testHmac(edge: boolean, algorithm: 'sha1' | 'sha256' | 'sha512', mac: string) {
    it('should create valid ' + algorithm + ' hmac' + (edge ? ' for edge' : ''), async () => {
        const webCryptoFunctionService = getWebCryptoFunctionService(edge);
        const computedMac = await webCryptoFunctionService.hmac(UtilsService.fromUtf8ToArray('SignMe!!').buffer,
            UtilsService.fromUtf8ToArray('secretkey').buffer, algorithm);
        expect(UtilsService.fromBufferToHex(computedMac)).toBe(mac);
    });
}

function getWebCryptoFunctionService(edge = false) {
    const platformUtilsService = new BrowserPlatformUtilsService(edge);
    return new WebCryptoFunctionService(window, platformUtilsService);
}

class BrowserPlatformUtilsService implements PlatformUtilsService {
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

    constructor(private edge: boolean) { }

    isEdge() {
        return this.edge;
    }
}
