import { EncryptionType } from '../enums';
import { Utils } from '../misc/utils';
import { CipherData } from '../models/data';
import { CipherString, SymmetricCryptoKey } from '../models/domain';
import { Cipher } from '../models/domain/cipher';
import { CipherView } from '../models/view/cipherView';
import { NodeCryptoFunctionService } from '../services/nodeCryptoFunction.service';

const worker: Worker = self as any;

class WorkerCryptoService {
    cryptoFunctionService = new NodeCryptoFunctionService();
    logService = new WorkerLogService();
    key: any;

    constructor(key: any) {
        this.key = key;
    }

    getOrgKey() {
        return this.key;
    }

    async decryptToUtf8(cipherString: CipherString, key: SymmetricCryptoKey) {
        return await this.aesDecryptToUtf8(cipherString.encryptionType, cipherString.data,
            cipherString.iv, cipherString.mac, key);
    }

    private async aesDecryptToUtf8(encType: EncryptionType, data: string, iv: string, mac: string,
        key: SymmetricCryptoKey): Promise<string> {
        // const keyForEnc = await this.getKeyForEncryption(key);
        // const theKey = this.resolveLegacyKey(encType, keyForEnc);
        const theKey = this.key;

        if (theKey.macKey != null && mac == null) {
            this.logService.error('mac required.');
            return null;
        }

        if (theKey.encType !== encType) {
            this.logService.error('encType unavailable.');
            return null;
        }

        const fastParams = this.cryptoFunctionService.aesDecryptFastParameters(data, iv, mac, theKey);
        if (fastParams.macKey != null && fastParams.mac != null) {
            const computedMac = await this.cryptoFunctionService.hmacFast(fastParams.macData,
                fastParams.macKey, 'sha256');
            const macsEqual = await this.cryptoFunctionService.compareFast(fastParams.mac, computedMac);
            if (!macsEqual) {
                this.logService.error('mac failed.');
                return null;
            }
        }

        return this.cryptoFunctionService.aesDecryptFast(fastParams);
    }
}

class WorkerContainerService {
    key: any;
    workerCryptoService: WorkerCryptoService;

    constructor(key: any) {
        this.key = key;
        this.workerCryptoService = new WorkerCryptoService(this.key);
    }
    getCryptoService() {
        return this.workerCryptoService;
    }
}

class WorkerLogService {
    error(message: string) {
        worker.postMessage(message);
    }
}

worker.addEventListener('message', async event => {
    worker.postMessage('decryptAllWorker started');
    const startTime = performance.now();

    Utils.global.bitwardenContainerService = new WorkerContainerService(event.data.key);

    const encryptedCiphers: Cipher[] = event.data.ciphers.map((c: any) => new Cipher(JSON.parse(c)));

    const promises: any[] = [];
    const decryptedCiphers: CipherView[] = [];
    encryptedCiphers.forEach(cipher => {
        promises.push(cipher.decrypt().then(c => decryptedCiphers.push(c)));
    });
    await Promise.all(promises);

    const response = decryptedCiphers.map(c => CipherView.serialize(c));

    const endTime = performance.now();
    worker.postMessage('decryptAllWorker finished in ' + (endTime - startTime));
    worker.postMessage({ ciphers: response });
});
