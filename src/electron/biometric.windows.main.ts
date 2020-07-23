import * as util from 'util';

import {
    UserConsentVerificationResult,
    UserConsentVerifier,
    UserConsentVerifierAvailability,
} from '@nodert-win10-rs4/windows.security.credentials.ui';
import { I18nService, StorageService } from '../abstractions';

import { ipcMain } from 'electron';
import { BiometricMain } from '../abstractions/biometric.main';
import { ConstantsService } from '../services';
import { ElectronConstants } from './electronConstants';

const requestVerification: any = util.promisify(UserConsentVerifier.requestVerificationAsync);
const checkAvailability: any = util.promisify(UserConsentVerifier.checkAvailabilityAsync);

const AllowedAvailabilities = [
    UserConsentVerifierAvailability.available,
    UserConsentVerifierAvailability.deviceBusy,
];

export default class BiometricWindowsMain implements BiometricMain {
    constructor(private storageService: StorageService, private i18nservice: I18nService) {}

    async init() {
        this.storageService.save(ElectronConstants.enableBiometric, await this.supportsBiometric());
        this.storageService.save(ConstantsService.biometricText, 'unlockWithWindowsHello');

        ipcMain.on('biometric', async (event: any, message: any) => {
            event.returnValue = await this.requestCreate();
        });
    }

    async supportsBiometric(): Promise<boolean> {
        const availability = await checkAvailability();

        return AllowedAvailabilities.includes(availability);
    }

    async requestCreate(): Promise<boolean> {
        const verification = await requestVerification(this.i18nservice.t('windowsHelloConsentMessage'));

        return verification === UserConsentVerificationResult.verified;
    }
}
