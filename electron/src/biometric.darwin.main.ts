import { I18nService, StorageService } from 'jslib-common/abstractions';

import { ipcMain, systemPreferences } from 'electron';
import { BiometricMain } from 'jslib-common/abstractions/biometric.main';
import { ConstantsService } from 'jslib-common/services/constants.service';
import { ElectronConstants } from './electronConstants';

export default class BiometricDarwinMain implements BiometricMain {
    isError: boolean = false;

    constructor(private storageService: StorageService, private i18nservice: I18nService) {}

    async init() {
        this.storageService.save(ElectronConstants.enableBiometric, await this.supportsBiometric());
        this.storageService.save(ConstantsService.biometricText, 'unlockWithTouchId');
        this.storageService.save(ElectronConstants.noAutoPromptBiometricsText, 'noAutoPromptTouchId');

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
