import { DeviceType } from '../../../src/enums/deviceType';

import { PlatformUtilsService } from '../../../src/abstractions/platformUtils.service';

import { WebCryptoFunctionService } from '../../../src/services/webCryptoFunction.service';

import { Utils } from '../../../src/misc/utils';

const RsaPublicKey = 'MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAl0Vawl/toXzkEvB82FEtqHP' +
    '4xlU2ab/v0crqIfXfIoWF/XXdHGIdrZeilnRXPPJT1B9dTsasttEZNnua/0Rek/cjNDHtzT52irfoZYS7X6HNIfOi54Q+egP' +
    'RQ1H7iNHVZz3K8Db9GCSKPeC8MbW6gVCzb15esCe1gGzg6wkMuWYDFYPoh/oBqcIqrGah7firqB1nDedzEjw32heP2DAffVN' +
    '084iTDjiWrJNUxBJ2pDD5Z9dT3MzQ2s09ew1yMWK2z37rT3YerC7OgEDmo3WYo3xL3qYJznu3EO2nmrYjiRa40wKSjxsTlUc' +
    'xDF+F0uMW8oR9EMUHgepdepfAtLsSAQIDAQAB';
const RsaPrivateKey = 'MIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQCXRVrCX+2hfOQS8Hz' +
    'YUS2oc/jGVTZpv+/Ryuoh9d8ihYX9dd0cYh2tl6KWdFc88lPUH11Oxqy20Rk2e5r/RF6T9yM0Me3NPnaKt+hlhLtfoc0h86L' +
    'nhD56A9FDUfuI0dVnPcrwNv0YJIo94LwxtbqBULNvXl6wJ7WAbODrCQy5ZgMVg+iH+gGpwiqsZqHt+KuoHWcN53MSPDfaF4/' +
    'YMB99U3TziJMOOJask1TEEnakMPln11PczNDazT17DXIxYrbPfutPdh6sLs6AQOajdZijfEvepgnOe7cQ7aeatiOJFrjTApK' +
    'PGxOVRzEMX4XS4xbyhH0QxQeB6l16l8C0uxIBAgMBAAECggEASaWfeVDA3cVzOPFSpvJm20OTE+R6uGOU+7vh36TX/POq92q' +
    'Buwbd0h0oMD32FxsXywd2IxtBDUSiFM9699qufTVuM0Q3tZw6lHDTOVG08+tPdr8qSbMtw7PGFxN79fHLBxejjO4IrM9lapj' +
    'WpxEF+11x7r+wM+0xRZQ8sNFYG46aPfIaty4BGbL0I2DQ2y8I57iBCAy69eht59NLMm27fRWGJIWCuBIjlpfzET1j2HLXUIh' +
    '5bTBNzqaN039WH49HczGE3mQKVEJZc/efk3HaVd0a1Sjzyn0QY+N1jtZN3jTRbuDWA1AknkX1LX/0tUhuS3/7C3ejHxjw4Dk' +
    '1ZLo5/QKBgQDIWvqFn0+IKRSu6Ua2hDsufIHHUNLelbfLUMmFthxabcUn4zlvIscJO00Tq/ezopSRRvbGiqnxjv/mYxucvOU' +
    'BeZtlus0Q9RTACBtw9TGoNTmQbEunJ2FOSlqbQxkBBAjgGEppRPt30iGj/VjAhCATq2MYOa/X4dVR51BqQAFIEwKBgQDBSIf' +
    'TFKC/hDk6FKZlgwvupWYJyU9RkyfstPErZFmzoKhPkQ3YORo2oeAYmVUbS9I2iIYpYpYQJHX8jMuCbCz4ONxTCuSIXYQYUcU' +
    'q4PglCKp31xBAE6TN8SvhfME9/MvuDssnQinAHuF0GDAhF646T3LLS1not6Vszv7brwSoGwKBgQC88v/8cGfi80ssQZeMnVv' +
    'q1UTXIeQcQnoY5lGHJl3K8mbS3TnXE6c9j417Fdz+rj8KWzBzwWXQB5pSPflWcdZO886Xu/mVGmy9RWgLuVFhXwCwsVEPjNX' +
    '5ramRb0/vY0yzenUCninBsIxFSbIfrPtLUYCc4hpxr+sr2Mg/y6jpvQKBgBezMRRs3xkcuXepuI2R+BCXL1/b02IJTUf1F+1' +
    'eLLGd7YV0H+J3fgNc7gGWK51hOrF9JBZHBGeOUPlaukmPwiPdtQZpu4QNE3l37VlIpKTF30E6mb+BqR+nht3rUjarnMXgAoE' +
    'Z18y6/KIjpSMpqC92Nnk/EBM9EYe6Cf4eA9ApAoGAeqEUg46UTlJySkBKURGpIs3v1kkf5I0X8DnOhwb+HPxNaiEdmO7ckm8' +
    '+tPVgppLcG0+tMdLjigFQiDUQk2y3WjyxP5ZvXu7U96jaJRI8PFMoE06WeVYcdIzrID2HvqH+w0UQJFrLJ/0Mn4stFAEzXKZ' +
    'BokBGnjFnTnKcs7nv/O8=';

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

    describe('aesEncrypt', () => {
        it('should successfully encrypt data', async () => {
            const webCryptoFunctionService = getWebCryptoFunctionService();
            const iv = makeStaticByteArray(16);
            const key = makeStaticByteArray(32);
            const data = Utils.fromUtf8ToArray('EncryptMe!');
            const encValue = await webCryptoFunctionService.aesEncrypt(data.buffer, iv.buffer, key.buffer);
            expect(Utils.fromBufferToB64(encValue)).toBe('ByUF8vhyX4ddU9gcooznwA==');
        });

        it('should successfully encrypt and then decrypt small data', async () => {
            const webCryptoFunctionService = getWebCryptoFunctionService();
            const iv = makeStaticByteArray(16);
            const key = makeStaticByteArray(32);
            const value = 'EncryptMe!';
            const data = Utils.fromUtf8ToArray(value);
            const encValue = await webCryptoFunctionService.aesEncrypt(data.buffer, iv.buffer, key.buffer);
            const decValue = await webCryptoFunctionService.aesDecryptSmall(encValue, iv.buffer, key.buffer);
            expect(Utils.fromBufferToUtf8(decValue)).toBe(value);
        });

        it('should successfully encrypt and then decrypt large data', async () => {
            const webCryptoFunctionService = getWebCryptoFunctionService();
            const iv = makeStaticByteArray(16);
            const key = makeStaticByteArray(32);
            const value = 'EncryptMe!';
            const data = Utils.fromUtf8ToArray(value);
            const encValue = await webCryptoFunctionService.aesEncrypt(data.buffer, iv.buffer, key.buffer);
            const decValue = await webCryptoFunctionService.aesDecryptLarge(encValue, iv.buffer, key.buffer);
            expect(Utils.fromBufferToUtf8(decValue)).toBe(value);
        });
    });

    describe('aesDecryptSmall', () => {
        it('should successfully decrypt data', async () => {
            const webCryptoFunctionService = getWebCryptoFunctionService();
            const iv = makeStaticByteArray(16);
            const key = makeStaticByteArray(32);
            const data = Utils.fromB64ToArray('ByUF8vhyX4ddU9gcooznwA==');
            const decValue = await webCryptoFunctionService.aesDecryptSmall(data.buffer, iv.buffer, key.buffer);
            expect(Utils.fromBufferToUtf8(decValue)).toBe('EncryptMe!');
        });
    });

    describe('aesDecryptLarge', () => {
        it('should successfully decrypt data', async () => {
            const webCryptoFunctionService = getWebCryptoFunctionService();
            const iv = makeStaticByteArray(16);
            const key = makeStaticByteArray(32);
            const data = Utils.fromB64ToArray('ByUF8vhyX4ddU9gcooznwA==');
            const decValue = await webCryptoFunctionService.aesDecryptLarge(data.buffer, iv.buffer, key.buffer);
            expect(Utils.fromBufferToUtf8(decValue)).toBe('EncryptMe!');
        });
    });

    describe('rsaEncrypt', () => {
        it('should successfully encrypt and then decrypt data', async () => {
            const webCryptoFunctionService = getWebCryptoFunctionService();
            const pubKey = Utils.fromB64ToArray(RsaPublicKey);
            const privKey = Utils.fromB64ToArray(RsaPrivateKey);
            const value = 'EncryptMe!';
            const data = Utils.fromUtf8ToArray(value);
            const encValue = await webCryptoFunctionService.rsaEncrypt(data.buffer, pubKey.buffer, 'sha1');
            const decValue = await webCryptoFunctionService.rsaDecrypt(encValue, privKey.buffer, 'sha1');
            expect(Utils.fromBufferToUtf8(decValue)).toBe(value);
        });
    });

    describe('rsaDecrypt', () => {
        it('should successfully decrypt data', async () => {
            const webCryptoFunctionService = getWebCryptoFunctionService();
            const privKey = Utils.fromB64ToArray(RsaPrivateKey);
            const data = Utils.fromB64ToArray('A1/p8BQzN9UrbdYxUY2Va5+kPLyfZXF9JsZrjeEXcaclsnHurdxVAJcnbEqYMP3UXV' +
                '4YAS/mpf+Rxe6/X0WS1boQdA0MAHSgx95hIlAraZYpiMLLiJRKeo2u8YivCdTM9V5vuAEJwf9Tof/qFsFci3sApdbATkorCT' +
                'zFOIEPF2S1zgperEP23M01mr4dWVdYN18B32YF67xdJHMbFhp5dkQwv9CmscoWq7OE5HIfOb+JAh7BEZb+CmKhM3yWJvoR/D' +
                '/5jcercUtK2o+XrzNrL4UQ7yLZcFz6Bfwb/j6ICYvqd/YJwXNE6dwlL57OfwJyCdw2rRYf0/qI00t9u8Iitw==');
            const decValue = await webCryptoFunctionService.rsaDecrypt(data.buffer, privKey.buffer, 'sha1');
            expect(Utils.fromBufferToUtf8(decValue)).toBe('EncryptMe!');
        });
    });

    describe('randomBytes', () => {
        it('should make a value of the correct length', async () => {
            const webCryptoFunctionService = getWebCryptoFunctionService();
            const randomData = await webCryptoFunctionService.randomBytes(16);
            expect(randomData.byteLength).toBe(16);
        });

        it('should not make the same value twice', async () => {
            const webCryptoFunctionService = getWebCryptoFunctionService();
            const randomData = await webCryptoFunctionService.randomBytes(16);
            const randomData2 = await webCryptoFunctionService.randomBytes(16);
            expect(randomData.byteLength === randomData2.byteLength && randomData !== randomData2).toBeTruthy();
        });
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
        expect(Utils.fromBufferToB64(key)).toBe(regularKey);
    });

    it('should create valid ' + algorithm + ' key from utf8 input' + forEdge, async () => {
        const webCryptoFunctionService = getWebCryptoFunctionService(edge);
        const key = await webCryptoFunctionService.pbkdf2(utf8Password, utf8Email, algorithm, 5000);
        expect(Utils.fromBufferToB64(key)).toBe(utf8Key);
    });

    it('should create valid ' + algorithm + ' key from unicode input' + forEdge, async () => {
        const webCryptoFunctionService = getWebCryptoFunctionService(edge);
        const key = await webCryptoFunctionService.pbkdf2(unicodePassword, regularEmail, algorithm, 5000);
        expect(Utils.fromBufferToB64(key)).toBe(unicodeKey);
    });

    it('should create valid ' + algorithm + ' key from array buffer input' + forEdge, async () => {
        const webCryptoFunctionService = getWebCryptoFunctionService(edge);
        const key = await webCryptoFunctionService.pbkdf2(Utils.fromUtf8ToArray(regularPassword).buffer,
            Utils.fromUtf8ToArray(regularEmail).buffer, algorithm, 5000);
        expect(Utils.fromBufferToB64(key)).toBe(regularKey);
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
        expect(Utils.fromBufferToHex(hash)).toBe(regularHash);
    });

    it('should create valid ' + algorithm + ' hash from utf8 input' + forEdge, async () => {
        const webCryptoFunctionService = getWebCryptoFunctionService(edge);
        const hash = await webCryptoFunctionService.hash(utf8Value, algorithm);
        expect(Utils.fromBufferToHex(hash)).toBe(utf8Hash);
    });

    it('should create valid ' + algorithm + ' hash from unicode input' + forEdge, async () => {
        const webCryptoFunctionService = getWebCryptoFunctionService(edge);
        const hash = await webCryptoFunctionService.hash(unicodeValue, algorithm);
        expect(Utils.fromBufferToHex(hash)).toBe(unicodeHash);
    });

    it('should create valid ' + algorithm + ' hash from array buffer input' + forEdge, async () => {
        const webCryptoFunctionService = getWebCryptoFunctionService(edge);
        const hash = await webCryptoFunctionService.hash(Utils.fromUtf8ToArray(regularValue).buffer, algorithm);
        expect(Utils.fromBufferToHex(hash)).toBe(regularHash);
    });
}

function testHmac(edge: boolean, algorithm: 'sha1' | 'sha256' | 'sha512', mac: string) {
    it('should create valid ' + algorithm + ' hmac' + (edge ? ' for edge' : ''), async () => {
        const webCryptoFunctionService = getWebCryptoFunctionService(edge);
        const computedMac = await webCryptoFunctionService.hmac(Utils.fromUtf8ToArray('SignMe!!').buffer,
            Utils.fromUtf8ToArray('secretkey').buffer, algorithm);
        expect(Utils.fromBufferToHex(computedMac)).toBe(mac);
    });
}

function getWebCryptoFunctionService(edge = false) {
    const platformUtilsService = new BrowserPlatformUtilsService(edge);
    return new WebCryptoFunctionService(window, platformUtilsService);
}

function makeStaticByteArray(length: number) {
    const arr = new Uint8Array(length);
    for (let i = 0; i < length; i++) {
        arr[i] = i;
    }
    return arr;
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
