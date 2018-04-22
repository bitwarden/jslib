import { Router } from '@angular/router';

import { ToasterService } from 'angular2-toaster';
import { Angulartics2 } from 'angulartics2';

import { CryptoService } from '../../abstractions/crypto.service';
import { I18nService } from '../../abstractions/i18n.service';
import { MessagingService } from '../../abstractions/messaging.service';
import { PlatformUtilsService } from '../../abstractions/platformUtils.service';
import { UserService } from '../../abstractions/user.service';

export class LockComponent {
    masterPassword: string = '';
    showPassword: boolean = false;

    protected successRoute: string = 'vault';

    constructor(protected router: Router, protected analytics: Angulartics2,
        protected toasterService: ToasterService, protected i18nService: I18nService,
        protected platformUtilsService: PlatformUtilsService, protected messagingService: MessagingService,
        protected userService: UserService, protected cryptoService: CryptoService) { }

    async submit() {
        if (this.masterPassword == null || this.masterPassword === '') {
            this.toasterService.popAsync('error', this.i18nService.t('errorOccurred'),
                this.i18nService.t('masterPassRequired'));
            return;
        }

        const email = await this.userService.getEmail();
        const key = await this.cryptoService.makeKey(this.masterPassword, email);
        const keyHash = await this.cryptoService.hashPassword(this.masterPassword, key);
        const storedKeyHash = await this.cryptoService.getKeyHash();

        if (storedKeyHash != null && keyHash != null && storedKeyHash === keyHash) {
            await this.cryptoService.setKey(key);
            this.messagingService.send('unlocked');
            this.router.navigate([this.successRoute]);
        } else {
            this.toasterService.popAsync('error', this.i18nService.t('errorOccurred'),
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
        this.analytics.eventTrack.next({ action: 'Toggled Master Password on Unlock' });
        this.showPassword = !this.showPassword;
        document.getElementById('masterPassword').focus();
    }
}
