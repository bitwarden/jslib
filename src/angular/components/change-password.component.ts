import {
    OnInit,
} from '@angular/core';

import {
    Router,
} from '@angular/router';

import { ApiService } from '../../abstractions/api.service';
import { CipherService } from '../../abstractions/cipher.service';
import { CryptoService } from '../../abstractions/crypto.service';
import { FolderService } from '../../abstractions/folder.service';
import { I18nService } from '../../abstractions/i18n.service';
import { MessagingService } from '../../abstractions/messaging.service';
import { PasswordGenerationService } from '../../abstractions/passwordGeneration.service';
import { PlatformUtilsService } from '../../abstractions/platformUtils.service';
import { PolicyService } from '../../abstractions/policy.service';
import { SyncService } from '../../abstractions/sync.service';
import { UserService } from '../../abstractions/user.service';

import { CipherString } from '../../models/domain/cipherString';
import { MasterPasswordPolicyOptions } from '../../models/domain/masterPasswordPolicyOptions';
import { SymmetricCryptoKey } from '../../models/domain/symmetricCryptoKey';

export class ChangePasswordComponent implements OnInit {
    newMasterPassword: string;
    confirmNewMasterPassword: string;
    formPromise: Promise<any>;
    masterPasswordScore: number;
    enforcedPolicyOptions: MasterPasswordPolicyOptions;

    private masterPasswordStrengthTimeout: any;
    private email: string;

    constructor(protected apiService: ApiService, protected i18nService: I18nService,
        protected cryptoService: CryptoService, protected messagingService: MessagingService,
        protected userService: UserService, protected passwordGenerationService: PasswordGenerationService,
        protected platformUtilsService: PlatformUtilsService, protected folderService: FolderService,
        protected cipherService: CipherService, protected syncService: SyncService,
        protected policyService: PolicyService, protected router: Router) { }

    async ngOnInit() {
        this.email = await this.userService.getEmail();
        this.enforcedPolicyOptions = await this.policyService.getMasterPasswordPolicyOptions();
    }

    getPasswordScoreAlertDisplay() {
        if (this.enforcedPolicyOptions == null) {
            return '';
        }

        let str: string;
        switch (this.enforcedPolicyOptions.minComplexity) {
            case 4:
                str = this.i18nService.t('strong');
                break;
            case 3:
                str = this.i18nService.t('good');
                break;
            default:
                str = this.i18nService.t('weak');
                break;
        }
        return str + ' (' + this.enforcedPolicyOptions.minComplexity + ')';
    }

    async submit() {
        const hasEncKey = await this.cryptoService.hasEncKey();
        if (!hasEncKey) {
            this.platformUtilsService.showToast('error', null, this.i18nService.t('updateKey'));
            return;
        }

        if (this.newMasterPassword == null || this.newMasterPassword === '') {
            this.platformUtilsService.showToast('error', this.i18nService.t('errorOccurred'),
                this.i18nService.t('masterPassRequired'));
            return;
        }
        if (this.newMasterPassword.length < 8) {
            this.platformUtilsService.showToast('error', this.i18nService.t('errorOccurred'),
                this.i18nService.t('masterPassLength'));
            return;
        }
        if (this.newMasterPassword !== this.confirmNewMasterPassword) {
            this.platformUtilsService.showToast('error', this.i18nService.t('errorOccurred'),
                this.i18nService.t('masterPassDoesntMatch'));
            return;
        }

        const strengthResult = this.passwordGenerationService.passwordStrength(this.newMasterPassword,
            this.getPasswordStrengthUserInput());

        if (this.enforcedPolicyOptions != null &&
            !this.policyService.evaluateMasterPassword(
                strengthResult.score,
                this.newMasterPassword,
                this.enforcedPolicyOptions)) {
            this.platformUtilsService.showToast('error', this.i18nService.t('errorOccurred'),
                this.i18nService.t('masterPasswordPolicyRequirementsNotMet'));
            return;
        }

        if (strengthResult != null && strengthResult.score < 3) {
            const result = await this.platformUtilsService.showDialog(this.i18nService.t('weakMasterPasswordDesc'),
                this.i18nService.t('weakMasterPassword'), this.i18nService.t('yes'), this.i18nService.t('no'),
                'warning');
            if (!result) {
                return;
            }
        }

        if (!await this.setupSubmitActions()) {
            return;
        }

        const email = await this.userService.getEmail();
        const kdf = await this.userService.getKdf();
        const kdfIterations = await this.userService.getKdfIterations();
        const newKey = await this.cryptoService.makeKey(this.newMasterPassword, email.trim().toLowerCase(),
            kdf, kdfIterations);
        const newMasterPasswordHash = await this.cryptoService.hashPassword(this.newMasterPassword, newKey);
        const newEncKey = await this.cryptoService.remakeEncKey(newKey);

        await this.performSubmitActions(newMasterPasswordHash, newKey, newEncKey);
    }

    async setupSubmitActions(): Promise<boolean> {
        // Override in sub-class
        // Can be used for additional validation and/or other processes the should occur before changing passwords
        return true;
    }

    async performSubmitActions(newMasterPasswordHash: string, newKey: SymmetricCryptoKey,
        newEncKey: [SymmetricCryptoKey, CipherString]) {
        // Override in sub-class
    }

    updatePasswordStrength() {
        if (this.masterPasswordStrengthTimeout != null) {
            clearTimeout(this.masterPasswordStrengthTimeout);
        }
        this.masterPasswordStrengthTimeout = setTimeout(() => {
            const strengthResult = this.passwordGenerationService.passwordStrength(this.newMasterPassword,
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
        return userInput;
    }
}
