import { Router } from '@angular/router';

import { ToasterService } from 'angular2-toaster';
import { Angulartics2 } from 'angulartics2';

import { RegisterRequest } from '../../models/request/registerRequest';

import { ApiService } from '../../abstractions/api.service';
import { AuthService } from '../../abstractions/auth.service';
import { CryptoService } from '../../abstractions/crypto.service';
import { I18nService } from '../../abstractions/i18n.service';

export class RegisterComponent {
    email: string = '';
    masterPassword: string = '';
    confirmMasterPassword: string = '';
    hint: string = '';
    showPassword: boolean = false;
    formPromise: Promise<any>;

    protected successRoute = 'login';

    constructor(protected authService: AuthService, protected router: Router,
        protected analytics: Angulartics2, protected toasterService: ToasterService,
        protected i18nService: I18nService, protected cryptoService: CryptoService,
        protected apiService: ApiService) { }

    async submit() {
        if (this.email == null || this.email === '') {
            this.toasterService.popAsync('error', this.i18nService.t('errorOccurred'),
                this.i18nService.t('emailRequired'));
            return;
        }
        if (this.email.indexOf('@') === -1) {
            this.toasterService.popAsync('error', this.i18nService.t('errorOccurred'),
                this.i18nService.t('invalidEmail'));
            return;
        }
        if (this.masterPassword == null || this.masterPassword === '') {
            this.toasterService.popAsync('error', this.i18nService.t('errorOccurred'),
                this.i18nService.t('masterPassRequired'));
            return;
        }
        if (this.masterPassword.length < 8) {
            this.toasterService.popAsync('error', this.i18nService.t('errorOccurred'),
                this.i18nService.t('masterPassLength'));
            return;
        }
        if (this.masterPassword !== this.confirmMasterPassword) {
            this.toasterService.popAsync('error', this.i18nService.t('errorOccurred'),
                this.i18nService.t('masterPassDoesntMatch'));
            return;
        }

        try {
            this.formPromise = this.register();
            await this.formPromise;
            this.analytics.eventTrack.next({ action: 'Registered' });
            this.toasterService.popAsync('success', null, this.i18nService.t('newAccountCreated'));
            this.router.navigate([this.successRoute]);
        } catch { }
    }

    togglePassword(confirmField: boolean) {
        this.analytics.eventTrack.next({ action: 'Toggled Master Password on Register' });
        this.showPassword = !this.showPassword;
        document.getElementById(confirmField ? 'masterPasswordRetype' : 'masterPassword').focus();
    }

    private async register() {
        this.email = this.email.toLowerCase();
        const key = await this.cryptoService.makeKey(this.masterPassword, this.email);
        const encKey = await this.cryptoService.makeEncKey(key);
        const hashedPassword = await this.cryptoService.hashPassword(this.masterPassword, key);
        const request = new RegisterRequest(this.email, hashedPassword, this.hint, encKey.encryptedString);
        await this.apiService.postRegister(request);
    }
}
