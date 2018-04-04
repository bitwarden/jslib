import { Input } from '@angular/core';
import { Router } from '@angular/router';

import { ToasterService } from 'angular2-toaster';
import { Angulartics2 } from 'angulartics2';

import { AuthResult } from '../../models/domain/authResult';

import { AuthService } from '../../abstractions/auth.service';
import { I18nService } from '../../abstractions/i18n.service';
import { SyncService } from '../../abstractions/sync.service';

export class LoginComponent {
    @Input() email: string = '';

    masterPassword: string = '';
    showPassword: boolean = false;
    formPromise: Promise<AuthResult>;

    protected twoFactorRoute = '2fa';
    protected successRoute = 'vault';

    constructor(protected authService: AuthService, protected router: Router,
        protected analytics: Angulartics2, protected toasterService: ToasterService,
        protected i18nService: I18nService, protected syncService: SyncService) { }

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

        try {
            this.formPromise = this.authService.logIn(this.email, this.masterPassword);
            const response = await this.formPromise;
            if (response.twoFactor) {
                this.analytics.eventTrack.next({ action: 'Logged In To Two-step' });
                this.router.navigate([this.twoFactorRoute]);
            } else {
                this.syncService.fullSync(true);
                this.analytics.eventTrack.next({ action: 'Logged In' });
                this.router.navigate([this.successRoute]);
            }
        } catch { }
    }

    togglePassword() {
        this.analytics.eventTrack.next({ action: 'Toggled Master Password on Login' });
        this.showPassword = !this.showPassword;
        document.getElementById('masterPassword').focus();
    }
}
