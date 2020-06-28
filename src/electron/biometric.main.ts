import {
    KeyCredentialCreationOption,
    KeyCredentialManager,
    KeyCredentialStatus,
} from '@nodert-win10-rs4/windows.security.credentials';
import { ipcMain } from 'electron';
import * as util from 'util';
import { StorageService } from '../abstractions';
import { ElectronConstants } from './electronConstants';

const requestCreateAsync = util.promisify(
    KeyCredentialManager.requestCreateAsync,
);

export class BiometricMain {
    constructor(private storageService: StorageService) {}

    async init() {
        this.storageService.save(ElectronConstants.enableBiometric, await this.supportsBiometric());

        ipcMain.on('biometric', async (event: any, message: any) => {
            event.returnValue = await this.requestCreate();
        });
    }

    supportsBiometric(): Promise<boolean> {
        return new Promise((resolve, reject) => {
            KeyCredentialManager.isSupportedAsync(
                (error: Error, result: boolean) => resolve(result),
            );
        });
    }

    async requestCreate(): Promise<boolean> {
        return new Promise((resolve, reject) => {
            KeyCredentialManager.requestCreateAsync(
                'bitwarden',
                KeyCredentialCreationOption.replaceExisting,
                (error, resp) => {
                    if (resp.status === KeyCredentialStatus.success) {
                        resolve(true);
                    } else {
                        resolve(false);
                    }
                },
            );
        });
    }
}
