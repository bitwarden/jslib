import { Directive } from '@angular/core';
import {
    ActivatedRoute,
    Router,
} from '@angular/router';

import { ApiService } from 'jslib-common/abstractions/api.service';
import { AuthService } from 'jslib-common/abstractions/auth.service';
import { CryptoFunctionService } from 'jslib-common/abstractions/cryptoFunction.service';
import { I18nService } from 'jslib-common/abstractions/i18n.service';
import { PasswordGenerationService } from 'jslib-common/abstractions/passwordGeneration.service';
import { PlatformUtilsService } from 'jslib-common/abstractions/platformUtils.service';
import { StateService } from 'jslib-common/abstractions/state.service';
import { StorageService } from 'jslib-common/abstractions/storage.service';

import { ConstantsService } from 'jslib-common/services/constants.service';

import { Utils } from 'jslib-common/misc/utils';

import { AuthResult } from 'jslib-common/models/domain/authResult';

@Directive()
export class SsoComponent {
    identifier: string;
    loggingIn = false;

    formPromise: Promise<AuthResult>;
    initiateSsoFormPromise: Promise<any>;
    onSuccessfulLogin: () => Promise<any>;
    onSuccessfulLoginNavigate: () => Promise<any>;
    onSuccessfulLoginTwoFactorNavigate: () => Promise<any>;
    onSuccessfulLoginChangePasswordNavigate: () => Promise<any>;

    protected twoFactorRoute = '2fa';
    protected successRoute = 'lock';
    protected changePasswordRoute = 'set-password';
    protected clientId: string;
    protected redirectUri: string;
    protected state: string;
    protected codeChallenge: string;

    constructor(protected authService: AuthService, protected router: Router,
        protected i18nService: I18nService, protected route: ActivatedRoute,
        protected storageService: StorageService, protected stateService: StateService,
        protected platformUtilsService: PlatformUtilsService, protected apiService: ApiService,
        protected cryptoFunctionService: CryptoFunctionService,
        protected passwordGenerationService: PasswordGenerationService) { }

    async ngOnInit() {
        const queryParamsSub = this.route.queryParams.subscribe(async qParams => {
            if (qParams.code != null && qParams.state != null) {
                const codeVerifier = await this.storageService.get<string>(ConstantsService.ssoCodeVerifierKey);
                const state = await this.storageService.get<string>(ConstantsService.ssoStateKey);
                await this.storageService.remove(ConstantsService.ssoCodeVerifierKey);
                await this.storageService.remove(ConstantsService.ssoStateKey);
                if (qParams.code != null && codeVerifier != null && state != null && this.checkState(state, qParams.state)) {
                    await this.logIn(qParams.code, codeVerifier, this.getOrgIdentiferFromState(qParams.state));
                }
            } else if (qParams.clientId != null && qParams.redirectUri != null && qParams.state != null &&
                qParams.codeChallenge != null) {
                this.redirectUri = qParams.redirectUri;
                this.state = qParams.state;
                this.codeChallenge = qParams.codeChallenge;
                this.clientId = qParams.clientId;
            }
            if (queryParamsSub != null) {
                queryParamsSub.unsubscribe();
            }
        });
    }

    async submit(returnUri?: string, includeUserIdentifier?: boolean) {
        this.initiateSsoFormPromise = this.preValidate();
        if (await this.initiateSsoFormPromise) {
            const authorizeUrl = await this.buildAuthorizeUrl(returnUri, includeUserIdentifier);
            this.platformUtilsService.launchUri(authorizeUrl, { sameWindow: true });
        }
    }

    async preValidate(): Promise<boolean> {
        if (this.identifier == null || this.identifier === '') {
            this.platformUtilsService.showToast('error', this.i18nService.t('ssoValidationFailed'),
                this.i18nService.t('ssoIdentifierRequired'));
            return false;
        }
        return await this.apiService.preValidateSso(this.identifier);
    }

    protected async buildAuthorizeUrl(returnUri?: string, includeUserIdentifier?: boolean): Promise<string> {
        let codeChallenge = this.codeChallenge;
        let state = this.state;

        const passwordOptions: any = {
            type: 'password',
            length: 64,
            uppercase: true,
            lowercase: true,
            numbers: true,
            special: false,
        };

        if (codeChallenge == null) {
            const codeVerifier = await this.passwordGenerationService.generatePassword(passwordOptions);
            const codeVerifierHash = await this.cryptoFunctionService.hash(codeVerifier, 'sha256');
            codeChallenge = Utils.fromBufferToUrlB64(codeVerifierHash);
            await this.storageService.save(ConstantsService.ssoCodeVerifierKey, codeVerifier);
        }

        if (state == null) {
            state = await this.passwordGenerationService.generatePassword(passwordOptions);
            if (returnUri) {
                state += `_returnUri='${returnUri}'`;
            }
        }

        // Add Organization Identifier to state
        state += `_identifier=${this.identifier}`;

        // Save state (regardless of new or existing)
        await this.storageService.save(ConstantsService.ssoStateKey, state);

        let authorizeUrl = this.apiService.identityBaseUrl + '/connect/authorize?' +
            'client_id=' + this.clientId + '&redirect_uri=' + encodeURIComponent(this.redirectUri) + '&' +
            'response_type=code&scope=api offline_access&' +
            'state=' + state + '&code_challenge=' + codeChallenge + '&' +
            'code_challenge_method=S256&response_mode=query&' +
            'domain_hint=' + encodeURIComponent(this.identifier);

        if (includeUserIdentifier) {
            const userIdentifier = await this.apiService.getSsoUserIdentifier();
            authorizeUrl += `&user_identifier=${encodeURIComponent(userIdentifier)}`;
        }

        return authorizeUrl;
    }

    private async logIn(code: string, codeVerifier: string, orgIdFromState: string) {
        this.loggingIn = true;
        try {
            this.formPromise = this.authService.logInSso(code, codeVerifier, this.redirectUri);
            const response = await this.formPromise;
            if (response.twoFactor) {
                if (this.onSuccessfulLoginTwoFactorNavigate != null) {
                    this.onSuccessfulLoginTwoFactorNavigate();
                } else {
                    this.router.navigate([this.twoFactorRoute], {
                        queryParams: {
                            identifier: orgIdFromState,
                            sso: 'true',
                        },
                    });
                }
            } else if (response.resetMasterPassword) {
                if (this.onSuccessfulLoginChangePasswordNavigate != null) {
                    this.onSuccessfulLoginChangePasswordNavigate();
                } else {
                    this.router.navigate([this.changePasswordRoute], {
                        queryParams: {
                            identifier: orgIdFromState,
                        },
                    });
                }
            } else {
                const disableFavicon = await this.storageService.get<boolean>(ConstantsService.disableFaviconKey);
                await this.stateService.save(ConstantsService.disableFaviconKey, !!disableFavicon);
                if (this.onSuccessfulLogin != null) {
                    this.onSuccessfulLogin();
                }
                if (this.onSuccessfulLoginNavigate != null) {
                    this.onSuccessfulLoginNavigate();
                } else {
                    this.router.navigate([this.successRoute]);
                }
            }
        } catch { }
        this.loggingIn = false;
    }

    private getOrgIdentiferFromState(state: string): string {
        if (state === null || state === undefined) {
            return null;
        }

        const stateSplit = state.split('_identifier=');
        return stateSplit.length > 1 ? stateSplit[1] : null;
    }

    private checkState(state: string, checkState: string): boolean {
        if (state === null || state === undefined) {
            return false;
        }
        if (checkState === null || checkState === undefined) {
            return false;
        }

        const stateSplit = state.split('_identifier=');
        const checkStateSplit = checkState.split('_identifier=');
        return stateSplit[0] === checkStateSplit[0];
    }
}
