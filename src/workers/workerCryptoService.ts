import { EncryptionType } from '../enums';
import { CipherString, SymmetricCryptoKey } from '../models/domain';
import { NodeCryptoFunctionService } from '../services/nodeCryptoFunction.service';
import { WorkerLogService } from './workerLogService';
import { ContainerService } from '../services/container.service';

export class WorkerCryptoService {
    cryptoFunctionService = new NodeCryptoFunctionService();
    worker: Worker;
    logService: WorkerLogService;
    key: any;

    constructor(key: any, logService: any) {
        this.key = key;
        this.logService = logService;
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
