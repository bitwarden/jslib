import {
    OnDestroy,
    OnInit,
} from '@angular/core';
import { Router } from '@angular/router';

import { DeviceType } from '../../enums/deviceType';
import { TwoFactorProviderType } from '../../enums/twoFactorProviderType';

import { TwoFactorEmailRequest } from '../../models/request/twoFactorEmailRequest';

import { ApiService } from '../../abstractions/api.service';
import { AuthService } from '../../abstractions/auth.service';
import { EnvironmentService } from '../../abstractions/environment.service';
import { I18nService } from '../../abstractions/i18n.service';
import { PlatformUtilsService } from '../../abstractions/platformUtils.service';

import { TwoFactorProviders } from '../../services/auth.service';

import * as DuoWebSDK from '../../misc/duo';
import { U2f } from '../../misc/u2f';

export class TwoFactorComponent implements OnInit, OnDestroy {
    token: string = '';
    remember: boolean = false;
    u2fReady: boolean = false;
    providers = TwoFactorProviders;
    providerType = TwoFactorProviderType;
    selectedProviderType: TwoFactorProviderType = TwoFactorProviderType.Authenticator;
    u2fSupported: boolean = false;
    u2f: U2f = null;
    title: string = '';
    twoFactorEmail: string = null;
    formPromise: Promise<any>;
    emailPromise: Promise<any>;
    onSuccessfulLogin: () => Promise<any>;
    onSuccessfulLoginNavigate: () => Promise<any>;

    protected loginRoute = 'login';
    protected successRoute = 'vault';

    constructor(protected authService: AuthService, protected router: Router,
        protected i18nService: I18nService, protected apiService: ApiService,
        protected platformUtilsService: PlatformUtilsService, protected win: Window,
        protected environmentService: EnvironmentService) {
        this.u2fSupported = this.platformUtilsService.supportsU2f(win);
    }

    async ngOnInit() {
        if (this.authService.email == null || this.authService.masterPasswordHash == null ||
            this.authService.twoFactorProviders == null) {
            this.router.navigate([this.loginRoute]);
            return;
        }

        if (this.win != null && this.u2fSupported) {
            let customWebVaultUrl: string = null;
            if (this.environmentService.baseUrl != null) {
                customWebVaultUrl = this.environmentService.baseUrl;
            } else if (this.environmentService.webVaultUrl != null) {
                customWebVaultUrl = this.environmentService.webVaultUrl;
            }

            this.u2f = new U2f(this.win, customWebVaultUrl, (token: string) => {
                this.token = token;
                this.submit();
            }, (error: string) => {
                this.platformUtilsService.showToast('error', this.i18nService.t('errorOccurred'), error);
            }, (info: string) => {
                if (info === 'ready') {
                    this.u2fReady = true;
                }
            });
        }

        this.selectedProviderType = this.authService.getDefaultTwoFactorProvider(this.u2fSupported);
        await this.init();
    }

    ngOnDestroy(): void {
        this.cleanupU2f();
        this.u2f = null;
    }

    async init() {
        if (this.selectedProviderType == null) {
            this.title = this.i18nService.t('loginUnavailable');
            return;
        }

        this.cleanupU2f();
        this.title = (TwoFactorProviders as any)[this.selectedProviderType].name;
        const params = this.authService.twoFactorProviders.get(this.selectedProviderType);
        switch (this.selectedProviderType) {
            case TwoFactorProviderType.U2f:
                if (!this.u2fSupported || this.u2f == null) {
                    break;
                }

                const challenges = JSON.parse(params.Challenges);
                if (challenges.length > 0) {
                    this.u2f.init({
                        appId: challenges[0].appId,
                        challenge: challenges[0].challenge,
                        keys: [{
                            version: challenges[0].version,
                            keyHandle: challenges[0].keyHandle,
                        }],
                    });
                }
                break;
            case TwoFactorProviderType.Duo:
            case TwoFactorProviderType.OrganizationDuo:
                if (this.platformUtilsService.getDevice() === DeviceType.SafariExtension) {
                    break;
                }

                setTimeout(() => {
                    DuoWebSDK.init({
                        iframe: undefined,
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
                }, 0);
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
            this.platformUtilsService.showToast('error', this.i18nService.t('errorOccurred'),
                this.i18nService.t('verificationCodeRequired'));
            return;
        }

        if (this.selectedProviderType === TwoFactorProviderType.U2f) {
            if (this.u2f != null) {
                this.u2f.stop();
            } else {
                return;
            }
        } else if (this.selectedProviderType === TwoFactorProviderType.Email ||
            this.selectedProviderType === TwoFactorProviderType.Authenticator) {
            this.token = this.token.replace(' ', '').trim();
        }

        try {
            this.formPromise = this.authService.logInTwoFactor(this.selectedProviderType, this.token, this.remember);
            await this.formPromise;
            if (this.onSuccessfulLogin != null) {
                this.onSuccessfulLogin();
            }
            this.platformUtilsService.eventTrack('Logged In From Two-step');
            if (this.onSuccessfulLoginNavigate != null) {
                this.onSuccessfulLoginNavigate();
            } else {
                this.router.navigate([this.successRoute]);
            }
        } catch {
            if (this.selectedProviderType === TwoFactorProviderType.U2f && this.u2f != null) {
                this.u2f.start();
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
                this.platformUtilsService.showToast('success', null,
                    this.i18nService.t('verificationCodeEmailSent', this.twoFactorEmail));
            }
        } catch { }

        this.emailPromise = null;
    }

    private cleanupU2f() {
        if (this.u2f != null) {
            this.u2f.stop();
            this.u2f.cleanup();
        }
    }
}
