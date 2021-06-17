import { Component } from '@angular/core';

import { CryptoService } from 'jslib-common/abstractions/crypto.service';
import { I18nService } from 'jslib-common/abstractions/i18n.service';
import { PlatformUtilsService } from 'jslib-common/abstractions/platformUtils.service';
import { ModalRef } from './modal/modal.ref';

@Component({
    templateUrl: 'password-reprompt.component.html',
})
export class PasswordRepromptComponent {

    showPassword = false;
    masterPassword = '';

    constructor(private modalRef: ModalRef, private cryptoService: CryptoService, private platformUtilsService: PlatformUtilsService,
        private i18nService: I18nService) {}

    togglePassword() {
        this.showPassword = !this.showPassword;
    }

    async submit() {
        const keyHash = await this.cryptoService.hashPassword(this.masterPassword, null);
        const storedKeyHash = await this.cryptoService.getKeyHash();

        if (storedKeyHash == null || keyHash == null || storedKeyHash !== keyHash) {
            this.platformUtilsService.showToast('error', this.i18nService.t('errorOccurred'),
                this.i18nService.t('invalidMasterPassword'));
            return;
        }

        this.modalRef.close(true);
    }
}