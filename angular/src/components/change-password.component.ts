import { Directive, OnInit } from '@angular/core';

import { CryptoService } from 'jslib-common/abstractions/crypto.service';
import { I18nService } from 'jslib-common/abstractions/i18n.service';
import { MessagingService } from 'jslib-common/abstractions/messaging.service';
import { PasswordGenerationService } from 'jslib-common/abstractions/passwordGeneration.service';
import { PlatformUtilsService } from 'jslib-common/abstractions/platformUtils.service';
import { PolicyService } from 'jslib-common/abstractions/policy.service';
import { UserService } from 'jslib-common/abstractions/user.service';

import { EncString } from 'jslib-common/models/domain/encString';
import { MasterPasswordPolicyOptions } from 'jslib-common/models/domain/masterPasswordPolicyOptions';
import { SymmetricCryptoKey } from 'jslib-common/models/domain/symmetricCryptoKey';

import { KdfType } from 'jslib-common/enums/kdfType';

@Directive()
export class ChangePasswordComponent implements OnInit {
    masterPassword: string;
    masterPasswordRetype: string;
    formPromise: Promise<any>;
    masterPasswordScore: number;
    enforcedPolicyOptions: MasterPasswordPolicyOptions;

    protected email: string;
    protected kdf: KdfType;
    protected kdfIterations: number;

    private masterPasswordStrengthTimeout: any;

    constructor(protected i18nService: I18nService, protected cryptoService: CryptoService,
        protected messagingService: MessagingService, protected userService: UserService,
        protected passwordGenerationService: PasswordGenerationService,
        protected platformUtilsService: PlatformUtilsService, protected policyService: PolicyService) { }

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
        if (!await this.strongPassword()) {
            return;
        }

        if (!await this.setupSubmitActions()) {
            return;
        }

        const email = await this.userService.getEmail();
        if (this.kdf == null) {
            this.kdf = await this.userService.getKdf();
        }
        if (this.kdfIterations == null) {
            this.kdfIterations = await this.userService.getKdfIterations();
        }
        const key = await this.cryptoService.makeKey(this.masterPassword, email.trim().toLowerCase(),
            this.kdf, this.kdfIterations);
        const masterPasswordHash = await this.cryptoService.hashPassword(this.masterPassword, key);

        let encKey: [SymmetricCryptoKey, EncString] = null;
        const existingEncKey = await this.cryptoService.getEncKey();
        if (existingEncKey == null) {
            encKey = await this.cryptoService.makeEncKey(key);
        } else {
            encKey = await this.cryptoService.remakeEncKey(key);
        }

        await this.performSubmitActions(masterPasswordHash, key, encKey);
    }

    async setupSubmitActions(): Promise<boolean> {
        // Override in sub-class
        // Can be used for additional validation and/or other processes the should occur before changing passwords
        return true;
    }

    async performSubmitActions(masterPasswordHash: string, key: SymmetricCryptoKey,
        encKey: [SymmetricCryptoKey, EncString]) {
        // Override in sub-class
    }

    async strongPassword(): Promise<boolean> {
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
        if (this.masterPassword !== this.masterPasswordRetype) {
            this.platformUtilsService.showToast('error', this.i18nService.t('errorOccurred'),
                this.i18nService.t('masterPassDoesntMatch'));
            return false;
        }

        const strengthResult = this.passwordGenerationService.passwordStrength(this.masterPassword,
            this.getPasswordStrengthUserInput());

        if (this.enforcedPolicyOptions != null &&
            !this.policyService.evaluateMasterPassword(
                strengthResult.score,
                this.masterPassword,
                this.enforcedPolicyOptions)) {
            this.platformUtilsService.showToast('error', this.i18nService.t('errorOccurred'),
                this.i18nService.t('masterPasswordPolicyRequirementsNotMet'));
            return false;
        }

        if (strengthResult != null && strengthResult.score < 3) {
            const result = await this.platformUtilsService.showDialog(this.i18nService.t('weakMasterPasswordDesc'),
                this.i18nService.t('weakMasterPassword'), this.i18nService.t('yes'), this.i18nService.t('no'),
                'warning');
            if (!result) {
                return false;
            }
        }

        return true;
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

    async logOut() {
        const confirmed = await this.platformUtilsService.showDialog(this.i18nService.t('logOutConfirmation'),
            this.i18nService.t('logOut'), this.i18nService.t('logOut'), this.i18nService.t('cancel'));
        if (confirmed) {
            this.messagingService.send('logout');
        }
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
