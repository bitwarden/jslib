import { OnInit } from '@angular/core';
import { Router } from '@angular/router';

import { CryptoService } from '../../abstractions/crypto.service';
import { I18nService } from '../../abstractions/i18n.service';
import { MessagingService } from '../../abstractions/messaging.service';
import { PlatformUtilsService } from '../../abstractions/platformUtils.service';
import { UserService } from '../../abstractions/user.service';

export class LockComponent implements OnInit {
    masterPassword: string = '';
    showPassword: boolean = false;
    email: string;

    protected successRoute: string = 'vault';
    protected onSuccessfulSubmit: () => void;

    constructor(protected router: Router, protected i18nService: I18nService,
        protected platformUtilsService: PlatformUtilsService, protected messagingService: MessagingService,
        protected userService: UserService, protected cryptoService: CryptoService) { }

    async ngOnInit() {
        this.email = await this.userService.getEmail();
    }

    async submit() {
        if (this.masterPassword == null || this.masterPassword === '') {
            this.platformUtilsService.showToast('error', this.i18nService.t('errorOccurred'),
                this.i18nService.t('masterPassRequired'));
            return;
        }

        const kdf = await this.userService.getKdf();
        const kdfIterations = await this.userService.getKdfIterations();
        const key = await this.cryptoService.makeKey(this.masterPassword, this.email, kdf, kdfIterations);
        const keyHash = await this.cryptoService.hashPassword(this.masterPassword, key);
        const storedKeyHash = await this.cryptoService.getKeyHash();

        if (storedKeyHash != null && keyHash != null && storedKeyHash === keyHash) {
            await this.cryptoService.setKey(key);
            this.messagingService.send('unlocked');
            if (this.onSuccessfulSubmit != null) {
                this.onSuccessfulSubmit();
            } else if (this.router != null) {
                this.router.navigate([this.successRoute]);
            }
        } else {
            this.platformUtilsService.showToast('error', this.i18nService.t('errorOccurred'),
                this.i18nService.t('invalidMasterPassword'));
        }
    }

    async logOut() {
        const confirmed = await this.platformUtilsService.showDialog(this.i18nService.t('logOutConfirmation'),
            this.i18nService.t('logOut'), this.i18nService.t('logOut'), this.i18nService.t('cancel'));
        if (confirmed) {
            this.messagingService.send('logout');
        }
    }

    togglePassword() {
        this.platformUtilsService.eventTrack('Toggled Master Password on Unlock');
        this.showPassword = !this.showPassword;
        document.getElementById('masterPassword').focus();
    }
}
