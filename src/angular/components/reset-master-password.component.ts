import { Router } from '@angular/router';

import { ApiService } from '../../abstractions/api.service';
import { AuthService } from '../../abstractions/auth.service';
import { CryptoService } from '../../abstractions/crypto.service';
import { I18nService } from '../../abstractions/i18n.service';
import { PasswordGenerationService } from '../../abstractions/passwordGeneration.service';
import { PlatformUtilsService } from '../../abstractions/platformUtils.service';
import { StateService } from '../../abstractions/state.service';

export class ResetMasterPasswordComponent {
    masterPassword: string = '';
    confirmMasterPassword: string = '';
    hint: string = '';
    showPassword: boolean = false;
    formPromise: Promise<any>;
    masterPasswordScore: number;
    resetMasterPassword: boolean = false;

    private masterPasswordStrengthTimeout: any;

    constructor(protected authService: AuthService, protected router: Router,
        protected i18nService: I18nService, protected cryptoService: CryptoService,
        protected apiService: ApiService, protected stateService: StateService,
        protected platformUtilsService: PlatformUtilsService,
        protected passwordGenerationService: PasswordGenerationService) { }

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

    async submit(): Promise<boolean> {
        if (this.masterPassword == null || this.masterPassword === '') {
            this.platformUtilsService.showToast('error', this.i18nService.t('errorOccurred'),
                this.i18nService.t('masterPassRequired'));
            return false;
        }
        if (this.masterPassword.length < 8) {
            this.platformUtilsService.showToast('error', this.i18nService.t('errorOccurred'),
                this.i18nService.t('masterPassLength'));
            return false;
        }
        if (this.masterPassword !== this.confirmMasterPassword) {
            this.platformUtilsService.showToast('error', this.i18nService.t('errorOccurred'),
                this.i18nService.t('masterPassDoesntMatch'));
            return false;
        }

        const strengthResult = this.passwordGenerationService.passwordStrength(this.masterPassword,
            this.getPasswordStrengthUserInput());
        if (strengthResult != null && strengthResult.score < 3) {
            const result = await this.platformUtilsService.showDialog(this.i18nService.t('weakMasterPasswordDesc'),
                this.i18nService.t('weakMasterPassword'), this.i18nService.t('yes'), this.i18nService.t('no'),
                'warning');
            if (!result) {
                return false;
            }
        }

        if (this.resetMasterPassword) {
            // TODO Make API call to update password
            // Let superclass decide destination
        }

        return true;
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
            const strengthResult = this.passwordGenerationService.passwordStrength(this.masterPassword,
                this.getPasswordStrengthUserInput());
            this.masterPasswordScore = strengthResult == null ? null : strengthResult.score;
        }, 300);
    }

    protected getPasswordStrengthUserInput(): string[] {
        return null;
    }
}
