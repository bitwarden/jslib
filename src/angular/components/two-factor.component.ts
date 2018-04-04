import { OnInit } from '@angular/core';
import { Router } from '@angular/router';

import { ToasterService } from 'angular2-toaster';
import { Angulartics2 } from 'angulartics2';

import { TwoFactorOptionsComponent } from './two-factor-options.component';

import { TwoFactorProviderType } from '../../enums/twoFactorProviderType';

import { TwoFactorEmailRequest } from '../../models/request/twoFactorEmailRequest';

import { ApiService } from '../../abstractions/api.service';
import { AuthService } from '../../abstractions/auth.service';
import { I18nService } from '../../abstractions/i18n.service';
import { PlatformUtilsService } from '../../abstractions/platformUtils.service';
import { SyncService } from '../../abstractions/sync.service';

import { TwoFactorProviders } from '../../services/auth.service';

export class TwoFactorComponent implements OnInit {
    token: string = '';
    remember: boolean = false;
    u2fReady: boolean = false;
    providers = TwoFactorProviders;
    providerType = TwoFactorProviderType;
    selectedProviderType: TwoFactorProviderType = TwoFactorProviderType.Authenticator;
    u2fSupported: boolean = false;
    u2f: any = null;
    title: string = '';
    twoFactorEmail: string = null;
    formPromise: Promise<any>;
    emailPromise: Promise<any>;

    protected successRoute = 'vault';

    constructor(protected authService: AuthService, protected router: Router,
        protected analytics: Angulartics2, protected toasterService: ToasterService,
        protected i18nService: I18nService, protected apiService: ApiService,
        protected platformUtilsService: PlatformUtilsService, protected syncService: SyncService) {
        this.u2fSupported = this.platformUtilsService.supportsU2f(window);
    }

    async ngOnInit() {
        if (this.authService.email == null || this.authService.masterPasswordHash == null ||
            this.authService.twoFactorProviders == null) {
            this.router.navigate(['login']);
            return;
        }

        this.selectedProviderType = this.authService.getDefaultTwoFactorProvider(this.u2fSupported);
        await this.init();
    }

    async init() {
        if (this.selectedProviderType == null) {
            this.title = this.i18nService.t('loginUnavailable');
            return;
        }

        this.title = (TwoFactorProviders as any)[this.selectedProviderType].name;
        const params = this.authService.twoFactorProviders.get(this.selectedProviderType);
        switch (this.selectedProviderType) {
            case TwoFactorProviderType.U2f:
                if (!this.u2fSupported) {
                    break;
                }

                const challenges = JSON.parse(params.Challenges);
                // TODO: init u2f
                break;
            case TwoFactorProviderType.Duo:
            case TwoFactorProviderType.OrganizationDuo:
                setTimeout(() => {
                    (window as any).Duo.init({
                        host: params.Host,
                        sig_request: params.Signature,
                        submit_callback: async (f: HTMLFormElement) => {
                            const sig = f.querySelector('input[name="sig_response"]') as HTMLInputElement;
                            if (sig != null) {
                                this.token = sig.value;
                                await this.submit();
                            }
                        },
                    });
                });
                break;
            case TwoFactorProviderType.Email:
                this.twoFactorEmail = params.Email;
                if (this.authService.twoFactorProviders.size > 1) {
                    await this.sendEmail(false);
                }
                break;
            default:
                break;
        }
    }

    async submit() {
        if (this.token == null || this.token === '') {
            this.toasterService.popAsync('error', this.i18nService.t('errorOccurred'),
                this.i18nService.t('verificationCodeRequired'));
            return;
        }

        if (this.selectedProviderType === TwoFactorProviderType.U2f) {
            // TODO: stop U2f
        } else if (this.selectedProviderType === TwoFactorProviderType.Email ||
            this.selectedProviderType === TwoFactorProviderType.Authenticator) {
            this.token = this.token.replace(' ', '').trim();
        }

        try {
            this.formPromise = this.authService.logInTwoFactor(this.selectedProviderType, this.token, this.remember);
            await this.formPromise;
            this.syncService.fullSync(true);
            this.analytics.eventTrack.next({ action: 'Logged In From Two-step' });
            this.router.navigate([this.successRoute]);
        } catch {
            if (this.selectedProviderType === TwoFactorProviderType.U2f) {
                // TODO: start U2F again
            }
        }
    }

    async sendEmail(doToast: boolean) {
        if (this.selectedProviderType !== TwoFactorProviderType.Email) {
            return;
        }

        if (this.emailPromise != null) {
            return;
        }

        try {
            const request = new TwoFactorEmailRequest(this.authService.email, this.authService.masterPasswordHash);
            this.emailPromise = this.apiService.postTwoFactorEmail(request);
            await this.emailPromise;
            if (doToast) {
                this.toasterService.popAsync('success', null,
                    this.i18nService.t('verificationCodeEmailSent', this.twoFactorEmail));
            }
        } catch { }

        this.emailPromise = null;
    }
}
