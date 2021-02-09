import {
    OnDestroy,
    OnInit,
} from '@angular/core';

import {
    ActivatedRoute,
    Router,
} from '@angular/router';

import { TwoFactorProviderType } from '../../enums/twoFactorProviderType';

import { TwoFactorEmailRequest } from '../../models/request/twoFactorEmailRequest';

import { AuthResult } from '../../models/domain';

import { ApiService } from '../../abstractions/api.service';
import { AuthService } from '../../abstractions/auth.service';
import { EnvironmentService } from '../../abstractions/environment.service';
import { I18nService } from '../../abstractions/i18n.service';
import { LogService } from '../../abstractions/log.service';
import { PlatformUtilsService } from '../../abstractions/platformUtils.service';
import { StateService } from '../../abstractions/state.service';
import { StorageService } from '../../abstractions/storage.service';

import { TwoFactorProviders } from '../../services/auth.service';
import { ConstantsService } from '../../services/constants.service';

import * as DuoWebSDK from 'duo_web_sdk';
import { U2f } from '../../misc/u2f';

export class TwoFactorComponent implements OnInit, OnDestroy {
    token: string = '';
    remember: boolean = false;
    u2fReady: boolean = false;
    initU2f: boolean = true;
    providers = TwoFactorProviders;
    providerType = TwoFactorProviderType;
    selectedProviderType: TwoFactorProviderType = TwoFactorProviderType.Authenticator;
    u2fSupported: boolean = false;
    u2f: U2f = null;
    title: string = '';
    twoFactorEmail: string = null;
    formPromise: Promise<any>;
    emailPromise: Promise<any>;
    identifier: string = null;
    onSuccessfulLogin: () => Promise<any>;
    onSuccessfulLoginNavigate: () => Promise<any>;

    protected loginRoute = 'login';
    protected successRoute = 'vault';

    constructor(protected authService: AuthService, protected router: Router,
        protected i18nService: I18nService, protected apiService: ApiService,
        protected platformUtilsService: PlatformUtilsService, protected win: Window,
        protected environmentService: EnvironmentService, protected stateService: StateService,
        protected storageService: StorageService, protected route: ActivatedRoute) {
        this.u2fSupported = this.platformUtilsService.supportsU2f(win);
    }

    async ngOnInit() {
        if (!this.authing || this.authService.twoFactorProvidersData == null) {
            this.router.navigate([this.loginRoute]);
            return;
        }

        const queryParamsSub = this.route.queryParams.subscribe(async qParams => {
            if (qParams.identifier != null) {
                this.identifier = qParams.identifier;
            }

            if (queryParamsSub != null) {
                queryParamsSub.unsubscribe();
            }
        });

        if (this.needsLock) {
            this.successRoute = 'lock';
        }

        if (this.initU2f && this.win != null && this.u2fSupported) {
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
        const providerData = this.authService.twoFactorProvidersData.get(this.selectedProviderType);
        switch (this.selectedProviderType) {
            case TwoFactorProviderType.U2f:
                if (!this.u2fSupported || this.u2f == null) {
                    break;
                }

                if (providerData.Challenge != null) {
                    setTimeout(() => {
                        this.u2f.init(JSON.parse(providerData.Challenge));
                    }, 500);
                } else {
                    // TODO: Deprecated. Remove in future version.
                    const challenges = JSON.parse(providerData.Challenges);
                    if (challenges != null && challenges.length > 0) {
                        this.u2f.init({
                            appId: challenges[0].appId,
                            challenge: challenges[0].challenge,
                            keys: challenges.map((c: any) => {
                                return {
                                    version: c.version,
                                    keyHandle: c.keyHandle,
                                };
                            }),
                        });
                    }
                }
                break;
            case TwoFactorProviderType.Duo:
            case TwoFactorProviderType.OrganizationDuo:
                setTimeout(() => {
                    DuoWebSDK.init({
                        iframe: undefined,
                        host: providerData.Host,
                        sig_request: providerData.Signature,
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
                this.twoFactorEmail = providerData.Email;
                if (this.authService.twoFactorProvidersData.size > 1) {
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
            const response: AuthResult = await this.formPromise;
            const disableFavicon = await this.storageService.get<boolean>(ConstantsService.disableFaviconKey);
            await this.stateService.save(ConstantsService.disableFaviconKey, !!disableFavicon);
            if (this.onSuccessfulLogin != null) {
                this.onSuccessfulLogin();
            }
            this.platformUtilsService.eventTrack('Logged In From Two-step');
            if (response.resetMasterPassword) {
                this.successRoute = 'set-password';
            }
            if (this.onSuccessfulLoginNavigate != null) {
                this.onSuccessfulLoginNavigate();
            } else {
                this.router.navigate([this.successRoute], {
                    queryParams: {
                        identifier: this.identifier,
                    },
                });
            }
        } catch (e) {
            LogService.error(e);
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
        } catch (e) {
            LogService.error(e);
        }

        this.emailPromise = null;
    }

    private cleanupU2f() {
        if (this.u2f != null) {
            this.u2f.stop();
            this.u2f.cleanup();
        }
    }

    get authing(): boolean {
        return this.authService.authingWithPassword() || this.authService.authingWithSso() || this.authService.authingWithApiKey();
    }

    get needsLock(): boolean {
        return this.authService.authingWithSso() || this.authService.authingWithApiKey();
    }
}
