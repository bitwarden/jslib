import { NodeCryptoFunctionService } from '../../../src/services/nodeCryptoFunction.service';

import { UtilsService } from '../../../src/services/utils.service';

describe('NodeCrypto Function Service', () => {
    describe('aesEncrypt', () => {
        it('should successfully aes encrypt data', async () => {
            const nodeCryptoFunctionService = new NodeCryptoFunctionService();
            const iv = makeStaticByteArray(16);
            const key = makeStaticByteArray(32);
            const data = UtilsService.fromUtf8ToArray('EncryptMe!');
            const encValue = await nodeCryptoFunctionService.aesEncrypt(data.buffer, iv.buffer, key.buffer);
            expect(UtilsService.fromBufferToB64(encValue)).toBe('ByUF8vhyX4ddU9gcooznwA==');
        });
    });

    describe('aesDecryptSmall', () => {
        it('should successfully aes decrypt data', async () => {
            const nodeCryptoFunctionService = new NodeCryptoFunctionService();
            const iv = makeStaticByteArray(16);
            const key = makeStaticByteArray(32);
            const data = UtilsService.fromB64ToArray('ByUF8vhyX4ddU9gcooznwA==');
            const decValue = await nodeCryptoFunctionService.aesDecryptLarge(data.buffer, iv.buffer, key.buffer);
            expect(UtilsService.fromBufferToUtf8(decValue)).toBe('EncryptMe!');
        });
    });

    describe('aesDecryptLarge', () => {
        it('should successfully aes decrypt data', async () => {
            const nodeCryptoFunctionService = new NodeCryptoFunctionService();
            const iv = makeStaticByteArray(16);
            const key = makeStaticByteArray(32);
            const data = UtilsService.fromB64ToArray('ByUF8vhyX4ddU9gcooznwA==');
            const decValue = await nodeCryptoFunctionService.aesDecryptLarge(data.buffer, iv.buffer, key.buffer);
            expect(UtilsService.fromBufferToUtf8(decValue)).toBe('EncryptMe!');
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

function makeStaticByteArray(length: number) {
    const arr = new Uint8Array(length);
    for (let i = 0; i < length; i++) {
        arr[i] = i;
    }
    return arr;
}

