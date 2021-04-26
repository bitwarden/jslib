import { Router } from '@angular/router';

import { KeysRequest } from 'jslib-common/models/request/keysRequest';
import { ReferenceEventRequest } from 'jslib-common/models/request/referenceEventRequest';
import { RegisterRequest } from 'jslib-common/models/request/registerRequest';

import { ApiService } from 'jslib-common/abstractions/api.service';
import { AuthService } from 'jslib-common/abstractions/auth.service';
import { CryptoService } from 'jslib-common/abstractions/crypto.service';
import { I18nService } from 'jslib-common/abstractions/i18n.service';
import { PasswordGenerationService } from 'jslib-common/abstractions/passwordGeneration.service';
import { PlatformUtilsService } from 'jslib-common/abstractions/platformUtils.service';
import { StateService } from 'jslib-common/abstractions/state.service';

import { KdfType } from 'jslib-common/enums/kdfType';

export class RegisterComponent {
    name: string = '';
    email: string = '';
    masterPassword: string = '';
    confirmMasterPassword: string = '';
    hint: string = '';
    showPassword: boolean = false;
    formPromise: Promise<any>;
    masterPasswordScore: number;
    referenceData: ReferenceEventRequest;
    showTerms = true;
    acceptPolicies: boolean = false;

    protected successRoute = 'login';
    private masterPasswordStrengthTimeout: any;

    constructor(protected authService: AuthService, protected router: Router,
        protected i18nService: I18nService, protected cryptoService: CryptoService,
        protected apiService: ApiService, protected stateService: StateService,
        protected platformUtilsService: PlatformUtilsService,
        protected passwordGenerationService: PasswordGenerationService) {
        this.showTerms = !platformUtilsService.isSelfHost();
    }

    get masterPasswordScoreWidth() {
        return this.masterPasswordScore == null ? 0 : (this.masterPasswordScore + 1) * 20;
    }

    get masterPasswordScoreColor() {
        switch (this.masterPasswordScore) {
            case 4:
                return 'success';
            case 3:
                return 'primary';
            case 2:
                return 'warning';
            default:
                return 'danger';
        }
    }

    get masterPasswordScoreText() {
        switch (this.masterPasswordScore) {
            case 4:
                return this.i18nService.t('strong');
            case 3:
                return this.i18nService.t('good');
            case 2:
                return this.i18nService.t('weak');
            default:
                return this.masterPasswordScore != null ? this.i18nService.t('weak') : null;
        }
    }

    async submit() {
        if (!this.acceptPolicies && this.showTerms) {
            this.platformUtilsService.showToast('error', this.i18nService.t('errorOccurred'),
                this.i18nService.t('acceptPoliciesError'));
            return;
        }

        if (this.email == null || this.email === '') {
            this.platformUtilsService.showToast('error', this.i18nService.t('errorOccurred'),
                this.i18nService.t('emailRequired'));
            return;
        }
        if (this.email.indexOf('@') === -1) {
            this.platformUtilsService.showToast('error', this.i18nService.t('errorOccurred'),
                this.i18nService.t('invalidEmail'));
            return;
        }
        if (this.masterPassword == null || this.masterPassword === '') {
            this.platformUtilsService.showToast('error', this.i18nService.t('errorOccurred'),
                this.i18nService.t('masterPassRequired'));
            return;
        }
        if (this.masterPassword.length < 8) {
            this.platformUtilsService.showToast('error', this.i18nService.t('errorOccurred'),
                this.i18nService.t('masterPassLength'));
            return;
        }
        if (this.masterPassword !== this.confirmMasterPassword) {
            this.platformUtilsService.showToast('error', this.i18nService.t('errorOccurred'),
                this.i18nService.t('masterPassDoesntMatch'));
            return;
        }

        const strengthResult = this.passwordGenerationService.passwordStrength(this.masterPassword,
            this.getPasswordStrengthUserInput());
        if (strengthResult != null && strengthResult.score < 3) {
            const result = await this.platformUtilsService.showDialog(this.i18nService.t('weakMasterPasswordDesc'),
                this.i18nService.t('weakMasterPassword'), this.i18nService.t('yes'), this.i18nService.t('no'),
                'warning');
            if (!result) {
                return;
            }
        }

        if (this.hint === this.masterPassword) {
            this.platformUtilsService.showToast('error', this.i18nService.t('errorOccurred'), this.i18nService.t('hintEqualsPassword'));
            return;
        }

        this.name = this.name === '' ? null : this.name;
        this.email = this.email.trim().toLowerCase();
        const kdf = KdfType.PBKDF2_SHA256;
        const useLowerKdf = this.platformUtilsService.isIE();
        const kdfIterations = useLowerKdf ? 10000 : 100000;
        const key = await this.cryptoService.makeKey(this.masterPassword, this.email, kdf, kdfIterations);
        const encKey = await this.cryptoService.makeEncKey(key);
        const hashedPassword = await this.cryptoService.hashPassword(this.masterPassword, key);
        const keys = await this.cryptoService.makeKeyPair(encKey[0]);
        const request = new RegisterRequest(this.email, this.name, hashedPassword,
            this.hint, encKey[1].encryptedString, kdf, kdfIterations, this.referenceData);
        request.keys = new KeysRequest(keys[0], keys[1].encryptedString);
        const orgInvite = await this.stateService.get<any>('orgInvitation');
        if (orgInvite != null && orgInvite.token != null && orgInvite.organizationUserId != null) {
            request.token = orgInvite.token;
            request.organizationUserId = orgInvite.organizationUserId;
        }

        try {
            this.formPromise = this.apiService.postRegister(request);
            await this.formPromise;
            this.platformUtilsService.showToast('success', null, this.i18nService.t('newAccountCreated'));
            this.router.navigate([this.successRoute], { queryParams: { email: this.email } });
        } catch { }
    }

    togglePassword(confirmField: boolean) {
        this.showPassword = !this.showPassword;
        document.getElementById(confirmField ? 'masterPasswordRetype' : 'masterPassword').focus();
    }

    updatePasswordStrength() {
        if (this.masterPasswordStrengthTimeout != null) {
            clearTimeout(this.masterPasswordStrengthTimeout);
        }
        this.masterPasswordStrengthTimeout = setTimeout(() => {
            const strengthResult = this.passwordGenerationService.passwordStrength(this.masterPassword,
                this.getPasswordStrengthUserInput());
            this.masterPasswordScore = strengthResult == null ? null : strengthResult.score;
        }, 300);
    }

    private getPasswordStrengthUserInput() {
        let userInput: string[] = [];
        const atPosition = this.email.indexOf('@');
        if (atPosition > -1) {
            userInput = userInput.concat(this.email.substr(0, atPosition).trim().toLowerCase().split(/[^A-Za-z0-9]/));
        }
        if (this.name != null && this.name !== '') {
            userInput = userInput.concat(this.name.trim().toLowerCase().split(' '));
        }
        return userInput;
    }
}
