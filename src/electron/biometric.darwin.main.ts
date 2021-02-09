import { ipcMain, systemPreferences } from 'electron';

import { BiometricMain } from '../abstractions/biometric.main';
import { I18nService } from '../abstractions/i18n.service';
import { LogService } from '../abstractions/log.service';
import { StorageService } from '../abstractions/storage.service';

import { ConstantsService } from '../services/constants.service';
import { ElectronConstants } from './electronConstants';

export default class BiometricDarwinMain implements BiometricMain {
    isError: boolean = false;

    constructor(private storageService: StorageService, private i18nservice: I18nService) {}

    async init() {
        this.storageService.save(ElectronConstants.enableBiometric, await this.supportsBiometric());
        this.storageService.save(ConstantsService.biometricText, 'unlockWithTouchId');

        ipcMain.on('biometric', async (event: any, message: any) => {
            event.returnValue = await this.requestCreate();
        });
    }

    supportsBiometric(): Promise<boolean> {
        return Promise.resolve(systemPreferences.canPromptTouchID());
    }

    async requestCreate(): Promise<boolean> {
        try {
            await systemPreferences.promptTouchID(this.i18nservice.t('touchIdConsentMessage'));
            return true;
        } catch (e) {
            LogService.error(e);
            return false;
        }
    }
}
