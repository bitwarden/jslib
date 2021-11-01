import { CryptoFunctionService } from 'jslib-common/abstractions/cryptoFunction.service';
import { LogService } from 'jslib-common/abstractions/log.service';
import { PlatformUtilsService } from 'jslib-common/abstractions/platformUtils.service';
import { StateService } from 'jslib-common/abstractions/state.service';

import { CryptoService } from 'jslib-common/services/crypto.service';

import { KeySuffixOptions } from 'jslib-common/enums/keySuffixOptions';
import { StorageLocation } from 'jslib-common/enums/storageLocation';

export class ElectronCryptoService extends CryptoService {

    constructor(cryptoFunctionService: CryptoFunctionService, platformUtilService: PlatformUtilsService,
        logService: LogService, stateService: StateService) {
        super(cryptoFunctionService, platformUtilService, logService, stateService);
    }

    async hasKeyStored(keySuffix: KeySuffixOptions): Promise<boolean> {
        await this.upgradeSecurelyStoredKey();
        return super.hasKeyStored(keySuffix);
    }

    protected async retrieveKeyFromStorage(keySuffix: KeySuffixOptions) {
        await this.upgradeSecurelyStoredKey();
        return super.retrieveKeyFromStorage(keySuffix);
    }

    /**
     * @deprecated 4 Jun 2021 This is temporary upgrade method to move from a single shared stored key to
     * multiple, unique stored keys for each use, e.g. never logout vs. biometric authentication.
     */
    private async upgradeSecurelyStoredKey() {
        // attempt key upgrade, but if we fail just delete it. Keys will be stored property upon unlock anyway.
        const key = await this.stateService.getCryptoMasterKey({ storageLocation: StorageLocation.Disk, useSecureStorage: true });

        if (key == null) {
            return;
        }

        try {
            if (await this.shouldStoreKey(KeySuffixOptions.Auto)) {
                await this.stateService.getCryptoMasterKeyB64({ keySuffix: KeySuffixOptions.Auto });
            }
            if (await this.shouldStoreKey(KeySuffixOptions.Biometric)) {
                await this.stateService.getCryptoMasterKey({ keySuffix: KeySuffixOptions.Biometric });
            }
        } catch (e) {
            this.logService.error(`Encountered error while upgrading obsolete Bitwarden secure storage item:`);
            this.logService.error(e);
        }

        await this.stateService.setCryptoMasterKey(null, { storageLocation: StorageLocation.Disk, useSecureStorage: true });
    }
}
