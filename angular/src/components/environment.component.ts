import {
    Directive,
    EventEmitter,
    Output,
} from '@angular/core';

import { EnvironmentService } from 'jslib-common/abstractions/environment.service';
import { I18nService } from 'jslib-common/abstractions/i18n.service';
import { PlatformUtilsService } from 'jslib-common/abstractions/platformUtils.service';

@Directive()
export class EnvironmentComponent {
    @Output() onSaved = new EventEmitter();

    iconsUrl: string;
    identityUrl: string;
    apiUrl: string;
    webVaultUrl: string;
    notificationsUrl: string;
    baseUrl: string;
    showCustom = false;
    enterpriseUrl: string;

    constructor(protected platformUtilsService: PlatformUtilsService, protected environmentService: EnvironmentService,
        protected i18nService: I18nService) {
        this.baseUrl = environmentService.baseUrl || '';
        this.webVaultUrl = environmentService.webVaultUrl || '';
        this.apiUrl = environmentService.apiUrl || '';
        this.identityUrl = environmentService.identityUrl || '';
        this.iconsUrl = environmentService.iconsUrl || '';
        this.notificationsUrl = environmentService.notificationsUrl || '';
        this.enterpriseUrl = environmentService.enterpriseUrl || '';
    }

    async submit() {
        const resUrls = await this.environmentService.setUrls({
            base: this.baseUrl,
            api: this.apiUrl,
            identity: this.identityUrl,
            webVault: this.webVaultUrl,
            icons: this.iconsUrl,
            notifications: this.notificationsUrl,
            enterprise: this.enterpriseUrl,
        });

        // re-set urls since service can change them, ex: prefixing https://
        this.baseUrl = resUrls.base;
        this.apiUrl = resUrls.api;
        this.identityUrl = resUrls.identity;
        this.webVaultUrl = resUrls.webVault;
        this.iconsUrl = resUrls.icons;
        this.notificationsUrl = resUrls.notifications;
        this.enterpriseUrl = resUrls.enterprise;

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
