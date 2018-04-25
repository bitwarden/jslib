import { NodeCryptoFunctionService } from '../../../src/services/nodeCryptoFunction.service';

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

describe('NodeCrypto Function Service', () => {
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

        testPbkdf2('sha256', regular256Key, utf8256Key, unicode256Key);
        testPbkdf2('sha512', regular512Key, utf8512Key, unicode512Key);
    });

    describe('aesEncrypt', () => {
        it('should successfully encrypt data', async () => {
            const nodeCryptoFunctionService = new NodeCryptoFunctionService();
            const iv = makeStaticByteArray(16);
            const key = makeStaticByteArray(32);
            const data = Utils.fromUtf8ToArray('EncryptMe!');
            const encValue = await nodeCryptoFunctionService.aesEncrypt(data.buffer, iv.buffer, key.buffer);
            expect(Utils.fromBufferToB64(encValue)).toBe('ByUF8vhyX4ddU9gcooznwA==');
        });

        it('should successfully encrypt and then decrypt data', async () => {
            const nodeCryptoFunctionService = new NodeCryptoFunctionService();
            const iv = makeStaticByteArray(16);
            const key = makeStaticByteArray(32);
            const value = 'EncryptMe!';
            const data = Utils.fromUtf8ToArray(value);
            const encValue = await nodeCryptoFunctionService.aesEncrypt(data.buffer, iv.buffer, key.buffer);
            const decValue = await nodeCryptoFunctionService.aesDecryptSmall(encValue, iv.buffer, key.buffer);
            expect(Utils.fromBufferToUtf8(decValue)).toBe(value);
        });
    });

    describe('aesDecryptSmall', () => {
        it('should successfully decrypt data', async () => {
            const nodeCryptoFunctionService = new NodeCryptoFunctionService();
            const iv = makeStaticByteArray(16);
            const key = makeStaticByteArray(32);
            const data = Utils.fromB64ToArray('ByUF8vhyX4ddU9gcooznwA==');
            const decValue = await nodeCryptoFunctionService.aesDecryptSmall(data.buffer, iv.buffer, key.buffer);
            expect(Utils.fromBufferToUtf8(decValue)).toBe('EncryptMe!');
        });
    });

    describe('aesDecryptLarge', () => {
        it('should successfully decrypt data', async () => {
            const nodeCryptoFunctionService = new NodeCryptoFunctionService();
            const iv = makeStaticByteArray(16);
            const key = makeStaticByteArray(32);
            const data = Utils.fromB64ToArray('ByUF8vhyX4ddU9gcooznwA==');
            const decValue = await nodeCryptoFunctionService.aesDecryptLarge(data.buffer, iv.buffer, key.buffer);
            expect(Utils.fromBufferToUtf8(decValue)).toBe('EncryptMe!');
        });
    });

    describe('rsaEncrypt', () => {
        it('should successfully encrypt and then decrypt data', async () => {
            const nodeCryptoFunctionService = new NodeCryptoFunctionService();
            const pubKey = Utils.fromB64ToArray(RsaPublicKey);
            const privKey = Utils.fromB64ToArray(RsaPrivateKey);
            const value = 'EncryptMe!';
            const data = Utils.fromUtf8ToArray(value);
            const encValue = await nodeCryptoFunctionService.rsaEncrypt(data.buffer, pubKey.buffer, 'sha1');
            const decValue = await nodeCryptoFunctionService.rsaDecrypt(encValue, privKey.buffer, 'sha1');
            expect(Utils.fromBufferToUtf8(decValue)).toBe(value);
        });
    });

    describe('rsaDecrypt', () => {
        it('should successfully decrypt data', async () => {
            const nodeCryptoFunctionService = new NodeCryptoFunctionService();
            const privKey = Utils.fromB64ToArray(RsaPrivateKey);
            const data = Utils.fromB64ToArray('A1/p8BQzN9UrbdYxUY2Va5+kPLyfZXF9JsZrjeEXcaclsnHurdxVAJcnbEqYMP3UXV' +
                '4YAS/mpf+Rxe6/X0WS1boQdA0MAHSgx95hIlAraZYpiMLLiJRKeo2u8YivCdTM9V5vuAEJwf9Tof/qFsFci3sApdbATkorCT' +
                'zFOIEPF2S1zgperEP23M01mr4dWVdYN18B32YF67xdJHMbFhp5dkQwv9CmscoWq7OE5HIfOb+JAh7BEZb+CmKhM3yWJvoR/D' +
                '/5jcercUtK2o+XrzNrL4UQ7yLZcFz6Bfwb/j6ICYvqd/YJwXNE6dwlL57OfwJyCdw2rRYf0/qI00t9u8Iitw==');
            const decValue = await nodeCryptoFunctionService.rsaDecrypt(data.buffer, privKey.buffer, 'sha1');
            expect(Utils.fromBufferToUtf8(decValue)).toBe('EncryptMe!');
        });
    });

    describe('randomBytes', () => {
        it('should make a value of the correct length', async () => {
            const nodeCryptoFunctionService = new NodeCryptoFunctionService();
            const randomData = await nodeCryptoFunctionService.randomBytes(16);
            expect(randomData.byteLength).toBe(16);
        });

        it('should not make the same value twice', async () => {
            const nodeCryptoFunctionService = new NodeCryptoFunctionService();
            const randomData = await nodeCryptoFunctionService.randomBytes(16);
            const randomData2 = await nodeCryptoFunctionService.randomBytes(16);
            expect(randomData.byteLength === randomData2.byteLength && randomData !== randomData2).toBeTruthy();
        });
    });
});

function testPbkdf2(algorithm: 'sha256' | 'sha512', regularKey: string, utf8Key: string, unicodeKey: string) {
    const regularEmail = 'user@example.com';
    const utf8Email = 'üser@example.com';

    const regularPassword = 'password';
    const utf8Password = 'pǻssword';
    const unicodePassword = '😀password🙏';

    it('should create valid ' + algorithm + ' key from regular input', async () => {
        const cryptoFunctionService = new NodeCryptoFunctionService();
        const key = await cryptoFunctionService.pbkdf2(regularPassword, regularEmail, algorithm, 5000);
        expect(Utils.fromBufferToB64(key)).toBe(regularKey);
    });

    it('should create valid ' + algorithm + ' key from utf8 input', async () => {
        const cryptoFunctionService = new NodeCryptoFunctionService();
        const key = await cryptoFunctionService.pbkdf2(utf8Password, utf8Email, algorithm, 5000);
        expect(Utils.fromBufferToB64(key)).toBe(utf8Key);
    });

    it('should create valid ' + algorithm + ' key from unicode input', async () => {
        const cryptoFunctionService = new NodeCryptoFunctionService();
        const key = await cryptoFunctionService.pbkdf2(unicodePassword, regularEmail, algorithm, 5000);
        expect(Utils.fromBufferToB64(key)).toBe(unicodeKey);
    });

    it('should create valid ' + algorithm + ' key from array buffer input', async () => {
        const cryptoFunctionService = new NodeCryptoFunctionService();
        const key = await cryptoFunctionService.pbkdf2(Utils.fromUtf8ToArray(regularPassword).buffer,
            Utils.fromUtf8ToArray(regularEmail).buffer, algorithm, 5000);
        expect(Utils.fromBufferToB64(key)).toBe(regularKey);
    });
}

function makeStaticByteArray(length: number) {
    const arr = new Uint8Array(length);
    for (let i = 0; i < length; i++) {
        arr[i] = i;
    }
    return arr;
}
