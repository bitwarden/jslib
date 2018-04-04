import {
    EventEmitter,
    Output,
} from '@angular/core';

import { ToasterService } from 'angular2-toaster';
import { Angulartics2 } from 'angulartics2';

import { EnvironmentService } from '../../abstractions/environment.service';
import { I18nService } from '../../abstractions/i18n.service';

export class EnvironmentComponent {
    @Output() onSaved = new EventEmitter();

    iconsUrl: string;
    identityUrl: string;
    apiUrl: string;
    webVaultUrl: string;
    baseUrl: string;
    showCustom = false;

    constructor(protected analytics: Angulartics2, protected toasterService: ToasterService,
        protected environmentService: EnvironmentService, protected i18nService: I18nService) {
        this.baseUrl = environmentService.baseUrl || '';
        this.webVaultUrl = environmentService.webVaultUrl || '';
        this.apiUrl = environmentService.apiUrl || '';
        this.identityUrl = environmentService.identityUrl || '';
        this.iconsUrl = environmentService.iconsUrl || '';
    }

    async submit() {
        const resUrls = await this.environmentService.setUrls({
            base: this.baseUrl,
            api: this.apiUrl,
            identity: this.identityUrl,
            webVault: this.webVaultUrl,
            icons: this.iconsUrl,
        });

        // re-set urls since service can change them, ex: prefixing https://
        this.baseUrl = resUrls.base;
        this.apiUrl = resUrls.api;
        this.identityUrl = resUrls.identity;
        this.webVaultUrl = resUrls.webVault;
        this.iconsUrl = resUrls.icons;

        this.analytics.eventTrack.next({ action: 'Set Environment URLs' });
        this.toasterService.popAsync('success', null, this.i18nService.t('environmentSaved'));
        this.saved();
    }

    toggleCustom() {
        this.showCustom = !this.showCustom;
    }

    protected saved() {
        this.onSaved.emit();
    }
}
