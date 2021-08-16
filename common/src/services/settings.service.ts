import { AccountService } from '../abstractions/account.service';
import { SettingsService as SettingsServiceAbstraction } from '../abstractions/settings.service';

import { StorageKey } from '../enums/storageKey';

import { SettingStorageOptions } from '../models/domain/settingStorageOptions';

export class SettingsService implements SettingsServiceAbstraction {
    constructor(private accountService: AccountService) {
    }

    async clearCache(): Promise<void> {
        await this.accountService.removeSetting(StorageKey.Settings, { skipDisk: true } as SettingStorageOptions);
    }

    getEquivalentDomains(): Promise<any> {
        return this.getSettingsKey(StorageKey.EquivalentDomains);
    }

    async setEquivalentDomains(equivalentDomains: string[][]): Promise<void> {
        await this.setSettingsKey(StorageKey.EquivalentDomains, equivalentDomains);
    }

    async clear(): Promise<void> {
        await this.accountService.removeSetting(StorageKey.Settings);
    }

    // Helpers

    private async getSettings(): Promise<any> {
        return await this.accountService.getSetting(StorageKey.Settings);
    }

    private async getSettingsKey(key: string): Promise<any> {
        const settings = await this.getSettings();
        if (settings != null && settings[key]) {
            return settings[key];
        }
        return null;
    }

    private async setSettingsKey(key: string, value: any): Promise<void> {
        let settings = await this.getSettings();
        if (!settings) {
            settings = {};
        }

        settings[key] = value;
        await this.accountService.saveSetting(StorageKey.Settings, settings);
    }
}
