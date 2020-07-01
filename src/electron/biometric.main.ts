import { ipcMain } from 'electron';
import * as util from 'util';
import { StorageService } from '../abstractions';
import { ElectronConstants } from './electronConstants';
import {
    UserConsentVerifier,
    UserConsentVerifierAvailability,
    UserConsentVerificationResult,
} from '@nodert-win10-rs4/windows.security.credentials.ui';

const requestVerification: any = util.promisify(UserConsentVerifier.requestVerificationAsync);
const checkAvailability: any= util.promisify(UserConsentVerifier.checkAvailabilityAsync);

const allowedAvailabilities = [
    UserConsentVerifierAvailability.available,
    UserConsentVerifierAvailability.deviceBusy
]

export class BiometricMain {
    constructor(private storageService: StorageService) {}

    async init() {
        this.storageService.save(ElectronConstants.enableBiometric, await this.supportsBiometric());

        ipcMain.on('biometric', async (event: any, message: any) => {
            event.returnValue = await this.requestCreate();
        });
    }

    async supportsBiometric(): Promise<boolean> {
        const availability = await checkAvailability();

        return allowedAvailabilities.includes(availability)
    }

    async requestCreate(): Promise<boolean> {
        const verification = await requestVerification("Please authenticate yourself to unlock the Bitwarden Vault.");

        return verification === UserConsentVerificationResult.verified;
    }
}
