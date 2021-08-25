import { AccountService } from 'jslib-common/abstractions/account.service';
import { CryptoFunctionService } from 'jslib-common/abstractions/cryptoFunction.service';
import { LogService } from 'jslib-common/abstractions/log.service';
import { PlatformUtilsService } from 'jslib-common/abstractions/platformUtils.service';

import { StorageKey } from 'jslib-common/enums/storageKey';

import { KeySuffixOptions, SettingStorageOptions } from 'jslib-common/models/domain/settingStorageOptions';
import { SymmetricCryptoKey } from 'jslib-common/models/domain/symmetricCryptoKey';

import { CryptoService } from 'jslib-common/services/crypto.service';

export class ElectronCryptoService extends CryptoService {

    constructor(cryptoFunctionService: CryptoFunctionService, platformUtilService: PlatformUtilsService,
        logService: LogService, accountService: AccountService) {
        super(cryptoFunctionService, platformUtilService, logService, accountService);
    }

    async hasKeyStored(keySuffix: KeySuffixOptions): Promise<boolean> {
        await this.upgradeSecurelyStoredKey();
        return super.hasKeyStored(keySuffix);
    }

    protected async storeKey(key: SymmetricCryptoKey) {
        if (await this.shouldStoreKey('auto')) {
            await this.accountService.saveSetting(StorageKey.CryptoMasterKey, key.keyB64, { keySuffix: 'auto', skipMemory: true, useSecureStorage: true } as SettingStorageOptions);
        } else {
            this.clearStoredKey('auto');
        }

        if (await this.shouldStoreKey('biometric')) {
            await this.accountService.saveSetting(StorageKey.CryptoMasterKey, key.keyB64, { keySuffix: 'biometric', skipMemory: true, useSecureStorage: true } as SettingStorageOptions);
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
        const key = await this.accountService.getSetting<string>(StorageKey.CryptoMasterKey, { skipMemory: true, useSecureStorage: true } as SettingStorageOptions);

        if (key == null) {
            return;
        }

        try {
            if (await this.shouldStoreKey('auto')) {
                await this.accountService.saveSetting(StorageKey.CryptoMasterKey, key, { keySuffix: 'auto', skipMemory: true, useSecureStorage: true } as SettingStorageOptions);
            }
            if (await this.shouldStoreKey('biometric')) {
                await this.accountService.saveSetting(StorageKey.CryptoMasterKey, key, { keySuffix: 'biometric', skipMemory: true, useSecureStorage: true } as SettingStorageOptions);
            }
        } catch (e) {
            this.logService.error(`Encountered error while upgrading obsolete Bitwarden secure storage item:`);
            this.logService.error(e);
        }

        await this.accountService.removeSetting(StorageKey.CryptoMasterKey, { useSecureStorage: true } as SettingStorageOptions);
    }
}
