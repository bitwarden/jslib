import { I18nService, StorageService } from '../abstractions';

import { ipcMain } from 'electron';
import { BiometricMain } from '../abstractions/biometric.main';
import { ConstantsService } from '../services';
import { ElectronConstants } from './electronConstants';

export default class BiometricWindowsMain implements BiometricMain {
    isError: boolean = false;

    private windowsSecurityCredentialsUiModule: any;

    constructor(private storageService: StorageService, private i18nservice: I18nService) { }

    async init() {
        this.windowsSecurityCredentialsUiModule = this.getWindowsSecurityCredentialsUiModule();
        let supportsBiometric = false;
        try {
            supportsBiometric = await this.supportsBiometric();
        } catch {
            // store error state so we can let the user know on the settings page
            this.isError = true;
        }
        this.storageService.save(ElectronConstants.enableBiometric, supportsBiometric);
        this.storageService.save(ConstantsService.biometricText, 'unlockWithWindowsHello');

        ipcMain.on('biometric', async (event: any, message: any) => {
            event.returnValue = await this.requestCreate();
        });
    }

    async supportsBiometric(): Promise<boolean> {
        const availability = await this.checkAvailabilityAsync();

        return this.getAllowedAvailabilities().includes(availability);
    }

    async requestCreate(): Promise<boolean> {
        const module = this.getWindowsSecurityCredentialsUiModule();
        if (module == null) {
            return false;
        }

        const verification = await this.requestVerificationAsync(this.i18nservice.t('windowsHelloConsentMessage'));

        return verification === module.UserConsentVerificationResult.verified;
    }

    getWindowsSecurityCredentialsUiModule(): any {
        try {
            if (this.windowsSecurityCredentialsUiModule == null) {
                if (this.getWindowsMajorVersion() >= 10) {
                    this.windowsSecurityCredentialsUiModule = require('@nodert-win10-rs4/windows.security.credentials.ui');
                }
            }
            return this.windowsSecurityCredentialsUiModule;
        } catch {
            this.isError = true;
        }
        return null;
    }

    async checkAvailabilityAsync(): Promise<any> {
        const module = this.getWindowsSecurityCredentialsUiModule();
        if (module != null) {
            return new Promise((resolve, reject) => {
                try {
                    module.UserConsentVerifier.checkAvailabilityAsync((error: Error, result: any) => {
                        if (error) {
                            return resolve(null);
                        }
                        return resolve(result);
                    });
                } catch {
                    this.isError = true;
                    return resolve(null);
                }
            });
        }
        return Promise.resolve(null);
    }

    async requestVerificationAsync(message: string): Promise<any> {
        const module = this.getWindowsSecurityCredentialsUiModule();
        if (module != null) {
            return new Promise((resolve, reject) => {
                try {
                    module.UserConsentVerifier.requestVerificationAsync(message, (error: Error, result: any) => {
                        if (error) {
                            return resolve(null);
                        }
                        return resolve(result);
                    });
                } catch (error) {
                    this.isError = true;
                    return reject(error);
                }
            });
        }
        return Promise.resolve(null);
    }

    getAllowedAvailabilities(): any[] {
        try {
            const module = this.getWindowsSecurityCredentialsUiModule();
            if (module != null) {
                return [
                    module.UserConsentVerifierAvailability.available,
                    module.UserConsentVerifierAvailability.deviceBusy,
                ];
            }
        } catch { /*Ignore error*/ }
        return [];
    }

    getWindowsMajorVersion(): number {
        if (process.platform !== 'win32') {
            return null;
        }
        try {
            const version = require('os').release();
            return Number.parseInt(version.split('.')[0], 10);
        }
        catch { }
        return null;
    }
}
