import { ipcMain, systemPreferences } from 'electron';

import { StorageKey } from 'jslib-common/enums/storageKey';

import { AccountService } from 'jslib-common/abstractions/account.service';
import { BiometricMain } from 'jslib-common/abstractions/biometric.main';
import { I18nService } from 'jslib-common/abstractions/i18n.service';

export default class BiometricDarwinMain implements BiometricMain {
    isError: boolean = false;

    constructor(private i18nservice: I18nService, private accountService: AccountService) {}

    async init() {
        this.accountService.saveSetting(StorageKey.EnableBiometric, await this.supportsBiometric());
        this.accountService.saveSetting(StorageKey.BiometricText, 'unlockWithTouchId');
        this.accountService.saveSetting(StorageKey.NoAutoPromptBiometricsText, 'noAutoPromptTouchId');

        ipcMain.on('biometric', async (event: any, message: any) => {
            event.returnValue = await this.authenticateBiometric();
        });
    }

    supportsBiometric(): Promise<boolean> {
        return Promise.resolve(systemPreferences.canPromptTouchID());
    }

    async authenticateBiometric(): Promise<boolean> {
        try {
            await systemPreferences.promptTouchID(this.i18nservice.t('touchIdConsentMessage'));
            return true;
        } catch {
            return false;
        }
    }
}
