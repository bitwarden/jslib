import { EncryptionType } from '../../enums';
import { CipherString, SymmetricCryptoKey } from '../../models/domain';
import { NodeCryptoFunctionService } from '../../services/nodeCryptoFunction.service';
import { WorkerLogService } from './workerLogService';

export class WorkerCryptoService {
    worker: Worker;
    cryptoFunctionService = new NodeCryptoFunctionService();
    logService: WorkerLogService;
    keyForEnc: any;
    orgKeys: Map<string, SymmetricCryptoKey>;
    legacyEtmKey: SymmetricCryptoKey;

    constructor(keyForEnc: any, orgKeys: Map<string, SymmetricCryptoKey>, logService: any) {
        this.keyForEnc = keyForEnc;
        this.orgKeys = orgKeys;
        this.logService = logService;
    }

    async getOrgKeys(): Promise<Map<string, SymmetricCryptoKey>> {
        return this.orgKeys;
    }

    async getOrgKey(orgId: string): Promise<SymmetricCryptoKey> {
        if (orgId == null) {
            return null;
        }

        const orgKeys = await this.getOrgKeys();
        if (orgKeys == null || !orgKeys.has(orgId)) {
            return null;
        }

        return orgKeys.get(orgId);
    }

    async decryptToUtf8(cipherString: CipherString, key: SymmetricCryptoKey) {
        return await this.aesDecryptToUtf8(cipherString.encryptionType, cipherString.data,
            cipherString.iv, cipherString.mac, key);
    }

    private resolveLegacyKey(encType: EncryptionType, key: SymmetricCryptoKey): SymmetricCryptoKey {
        if (encType === EncryptionType.AesCbc128_HmacSha256_B64 &&
            key.encType === EncryptionType.AesCbc256_B64) {
            // Old encrypt-then-mac scheme, make a new key
            if (this.legacyEtmKey == null) {
                this.legacyEtmKey = new SymmetricCryptoKey(key.key, EncryptionType.AesCbc128_HmacSha256_B64);
            }
            return this.legacyEtmKey;
        }

        return key;
    }

    private async aesDecryptToUtf8(encType: EncryptionType, data: string, iv: string, mac: string,
        key: SymmetricCryptoKey): Promise<string> {
        const theKey = this.resolveLegacyKey(encType, this.keyForEnc);

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
