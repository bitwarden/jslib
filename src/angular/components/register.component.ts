import { Router } from '@angular/router';

import { KeysRequest } from '../../models/request/keysRequest';
import { RegisterRequest } from '../../models/request/registerRequest';

import { ApiService } from '../../abstractions/api.service';
import { AuthService } from '../../abstractions/auth.service';
import { CryptoService } from '../../abstractions/crypto.service';
import { I18nService } from '../../abstractions/i18n.service';
import { PasswordGenerationService } from '../../abstractions/passwordGeneration.service';
import { PlatformUtilsService } from '../../abstractions/platformUtils.service';
import { StateService } from '../../abstractions/state.service';

import { KdfType } from '../../enums/kdfType';

export class RegisterComponent {
    name: string = '';
    email: string = '';
    masterPassword: string = '';
    confirmMasterPassword: string = '';
    hint: string = '';
    showPassword: boolean = false;
    formPromise: Promise<any>;
    masterPasswordScore: number;

    protected successRoute = 'login';
    private masterPasswordStrengthTimeout: any;

    constructor(protected authService: AuthService, protected router: Router,
        protected i18nService: I18nService, protected cryptoService: CryptoService,
        protected apiService: ApiService, protected stateService: StateService,
        protected platformUtilsService: PlatformUtilsService,
        protected passwordGenerationService: PasswordGenerationService) { }

    async submit() {
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

        const strengthResult = this.passwordGenerationService.passwordStrength(this.masterPassword, null);
        if (strengthResult != null && strengthResult.score < 3) {
            const result = await this.platformUtilsService.showDialog(this.i18nService.t('weakMasterPasswordDesc'),
                this.i18nService.t('weakMasterPassword'), this.i18nService.t('yes'), this.i18nService.t('no'),
                'warning');
            if (!result) {
                return;
            }
        }

        this.name = this.name === '' ? null : this.name;
        this.email = this.email.trim().toLowerCase();
        const kdf = KdfType.PBKDF2_SHA256;
        const useLowerKdf = this.platformUtilsService.isEdge() || this.platformUtilsService.isIE();
        const kdfIterations = useLowerKdf ? 10000 : 100000;
        const key = await this.cryptoService.makeKey(this.masterPassword, this.email, kdf, kdfIterations);
        const encKey = await this.cryptoService.makeEncKey(key);
        const hashedPassword = await this.cryptoService.hashPassword(this.masterPassword, key);
        const keys = await this.cryptoService.makeKeyPair(encKey[0]);
        const request = new RegisterRequest(this.email, this.name, hashedPassword,
            this.hint, encKey[1].encryptedString, kdf, kdfIterations);
        request.keys = new KeysRequest(keys[0], keys[1].encryptedString);
        const orgInvite = await this.stateService.get<any>('orgInvitation');
        if (orgInvite != null && orgInvite.token != null && orgInvite.organizationUserId != null) {
            request.token = orgInvite.token;
            request.organizationUserId = orgInvite.organizationUserId;
        }

        try {
            this.formPromise = this.apiService.postRegister(request);
            await this.formPromise;
            this.platformUtilsService.eventTrack('Registered');
            this.platformUtilsService.showToast('success', null, this.i18nService.t('newAccountCreated'));
            this.router.navigate([this.successRoute], { queryParams: { email: this.email } });
        } catch { }
    }

    togglePassword(confirmField: boolean) {
        this.platformUtilsService.eventTrack('Toggled Master Password on Register');
        this.showPassword = !this.showPassword;
        document.getElementById(confirmField ? 'masterPasswordRetype' : 'masterPassword').focus();
    }

    updatePasswordStrength() {
        if (this.masterPasswordStrengthTimeout != null) {
            clearTimeout(this.masterPasswordStrengthTimeout);
        }
        this.masterPasswordStrengthTimeout = setTimeout(() => {
            const strengthResult = this.passwordGenerationService.passwordStrength(this.masterPassword, null);
            this.masterPasswordScore = strengthResult == null ? null : strengthResult.score;
        }, 300);
    }
}
