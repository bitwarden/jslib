import { CryptoFunctionService } from 'jslib-common/abstractions/cryptoFunction.service';
import { LogService } from 'jslib-common/abstractions/log.service';
import { PlatformUtilsService } from 'jslib-common/abstractions/platformUtils.service';
import { KeySuffixOptions, StorageService } from 'jslib-common/abstractions/storage.service';
import { SymmetricCryptoKey } from 'jslib-common/models/domain/symmetricCryptoKey';
import { CryptoService, Keys } from 'jslib-common/services/crypto.service';

export class ElectronCryptoService extends CryptoService {

    constructor(storageService: StorageService, secureStorageService: StorageService,
        cryptoFunctionService: CryptoFunctionService, platformUtilService: PlatformUtilsService,
        logService: LogService) {
        super(storageService, secureStorageService, cryptoFunctionService, platformUtilService, logService);
    }

    async hasKeyStored(keySuffix: KeySuffixOptions): Promise<boolean> {
        await this.upgradeSecurelyStoredKey();
        return super.hasKeyStored(keySuffix);
    }

    protected async storeKey(key: SymmetricCryptoKey) {
        if (await this.shouldStoreKey('auto')) {
            await this.secureStorageService.save(Keys.key, key.keyB64, { keySuffix: 'auto' });
        } else {
            this.clearStoredKey('auto');
        }

        if (await this.shouldStoreKey('biometric')) {
            await this.secureStorageService.save(Keys.key, key.keyB64, { keySuffix: 'biometric' });
        } else {
            this.clearStoredKey('biometric');
        }
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
        const key = await this.secureStorageService.get<string>(Keys.key);

        if (key == null) {
            return;
        }

        try {
            if (await this.shouldStoreKey('auto')) {
                await this.secureStorageService.save(Keys.key, key, { keySuffix: 'auto' });
            }
            if (await this.shouldStoreKey('biometric')) {
                await this.secureStorageService.save(Keys.key, key, { keySuffix: 'biometric' });
            }
        } catch (e) {
            this.logService.error(`Encountered error while upgrading obsolete Bitwarden secure storage item:`);
            this.logService.error(e);
        }

        await this.secureStorageService.remove(Keys.key);
    }
}
