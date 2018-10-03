import {
    EventEmitter,
    Output,
} from '@angular/core';

import { EnvironmentService } from '../../abstractions/environment.service';
import { I18nService } from '../../abstractions/i18n.service';
import { PlatformUtilsService } from '../../abstractions/platformUtils.service';

export class EnvironmentComponent {
    @Output() onSaved = new EventEmitter();

    iconsUrl: string;
    identityUrl: string;
    apiUrl: string;
    webVaultUrl: string;
    notificationsUrl: string;
    baseUrl: string;
    showCustom = false;

    constructor(protected platformUtilsService: PlatformUtilsService, protected environmentService: EnvironmentService,
        protected i18nService: I18nService) {
        this.baseUrl = environmentService.baseUrl || '';
        this.webVaultUrl = environmentService.webVaultUrl || '';
        this.apiUrl = environmentService.apiUrl || '';
        this.identityUrl = environmentService.identityUrl || '';
        this.iconsUrl = environmentService.iconsUrl || '';
        this.notificationsUrl = environmentService.notificationsUrl || '';
    }

    async submit() {
        const resUrls = await this.environmentService.setUrls({
            base: this.baseUrl,
            api: this.apiUrl,
            identity: this.identityUrl,
            webVault: this.webVaultUrl,
            icons: this.iconsUrl,
            notifications: this.notificationsUrl,
        });

        // re-set urls since service can change them, ex: prefixing https://
        this.baseUrl = resUrls.base;
        this.apiUrl = resUrls.api;
        this.identityUrl = resUrls.identity;
        this.webVaultUrl = resUrls.webVault;
        this.iconsUrl = resUrls.icons;
        this.notificationsUrl = resUrls.notifications;

        this.platformUtilsService.eventTrack('Set Environment URLs');
        this.platformUtilsService.showToast('success', null, this.i18nService.t('environmentSaved'));
        this.saved();
    }

    toggleCustom() {
        this.showCustom = !this.showCustom;
    }

    protected saved() {
        this.onSaved.emit();
    }
}
