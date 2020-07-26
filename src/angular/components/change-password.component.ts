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

import { CipherWithIdRequest } from '../../models/request/cipherWithIdRequest';
import { FolderWithIdRequest } from '../../models/request/folderWithIdRequest';
import { PasswordRequest } from '../../models/request/passwordRequest';
import { PasswordNoCompareRequest } from '../../models/request/passwordNoCompareRequest';
import { UpdateKeyRequest } from '../../models/request/updateKeyRequest';

export class ChangePasswordComponent implements OnInit {
    currentMasterPassword: string;
    newMasterPassword: string;
    confirmNewMasterPassword: string;
    formPromise: Promise<any>;
    masterPasswordScore: number;
    rotateEncKey = false;
    enforcedPolicyOptions: MasterPasswordPolicyOptions;
    isChangePasswordNoCompare = false;
    onSuccessfulChangePassword: () => Promise<any>;
    successRoute = 'lock';

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

        if (this.currentMasterPassword == null || this.currentMasterPassword === '' ||
            this.newMasterPassword == null || this.newMasterPassword === '') {
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

        if (this.rotateEncKey) {
            await this.syncService.fullSync(true);
        }

        const email = await this.userService.getEmail();
        const kdf = await this.userService.getKdf();
        const kdfIterations = await this.userService.getKdfIterations();
        const newKey = await this.cryptoService.makeKey(this.newMasterPassword, email.trim().toLowerCase(),
            kdf, kdfIterations);
        const newMasterPasswordHash = await this.cryptoService.hashPassword(this.newMasterPassword, newKey);
        const newEncKey = await this.cryptoService.remakeEncKey(newKey);

        if (this.isChangePasswordNoCompare) {
            const noCompareRequest = new PasswordNoCompareRequest();
            noCompareRequest.newMasterPasswordHash = newMasterPasswordHash;
            noCompareRequest.key = newEncKey[1].encryptedString;

            try {
                this.formPromise = this.apiService.postPasswordNoCompare(noCompareRequest);
                await this.formPromise;

                if (this.onSuccessfulChangePassword != null) {
                    this.onSuccessfulChangePassword();
                } else {
                    this.router.navigate([this.successRoute]);
                }
            } catch { }
        } else {
            const request = new PasswordRequest();
            request.masterPasswordHash = await this.cryptoService.hashPassword(this.currentMasterPassword, null);
            request.newMasterPasswordHash = newMasterPasswordHash;
            request.key = newEncKey[1].encryptedString;

            try {
                if (this.rotateEncKey) {
                    this.formPromise = this.apiService.postPassword(request).then(() => {
                        return this.updateKey(newKey, request.newMasterPasswordHash);
                    });
                } else {
                    this.formPromise = this.apiService.postPassword(request);
                }

                await this.formPromise;

                this.platformUtilsService.showToast('success', this.i18nService.t('masterPasswordChanged'),
                    this.i18nService.t('logBackIn'));
                this.messagingService.send('logout');
            } catch { }
        }
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

    async rotateEncKeyClicked() {
        if (this.rotateEncKey) {
            const ciphers = await this.cipherService.getAllDecrypted();
            let hasOldAttachments = false;
            if (ciphers != null) {
                for (let i = 0; i < ciphers.length; i++) {
                    if (ciphers[i].organizationId == null && ciphers[i].hasOldAttachments) {
                        hasOldAttachments = true;
                        break;
                    }
                }
            }

            if (hasOldAttachments) {
                const learnMore = await this.platformUtilsService.showDialog(
                    this.i18nService.t('oldAttachmentsNeedFixDesc'), null,
                    this.i18nService.t('learnMore'), this.i18nService.t('close'), 'warning');
                if (learnMore) {
                    this.platformUtilsService.launchUri(
                        'https://help.bitwarden.com/article/attachments/#fixing-old-attachments');
                }
                this.rotateEncKey = false;
                return;
            }

            const result = await this.platformUtilsService.showDialog(
                this.i18nService.t('updateEncryptionKeyWarning') + ' ' +
                this.i18nService.t('rotateEncKeyConfirmation'), this.i18nService.t('rotateEncKeyTitle'),
                this.i18nService.t('yes'), this.i18nService.t('no'), 'warning');
            if (!result) {
                this.rotateEncKey = false;
            }
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

    private async updateKey(key: SymmetricCryptoKey, masterPasswordHash: string) {
        const encKey = await this.cryptoService.makeEncKey(key);
        const privateKey = await this.cryptoService.getPrivateKey();
        let encPrivateKey: CipherString = null;
        if (privateKey != null) {
            encPrivateKey = await this.cryptoService.encrypt(privateKey, encKey[0]);
        }
        const request = new UpdateKeyRequest();
        request.privateKey = encPrivateKey != null ? encPrivateKey.encryptedString : null;
        request.key = encKey[1].encryptedString;
        request.masterPasswordHash = masterPasswordHash;

        const folders = await this.folderService.getAllDecrypted();
        for (let i = 0; i < folders.length; i++) {
            if (folders[i].id == null) {
                continue;
            }
            const folder = await this.folderService.encrypt(folders[i], encKey[0]);
            request.folders.push(new FolderWithIdRequest(folder));
        }

        const ciphers = await this.cipherService.getAllDecrypted();
        for (let i = 0; i < ciphers.length; i++) {
            if (ciphers[i].organizationId != null) {
                continue;
            }

            const cipher = await this.cipherService.encrypt(ciphers[i], encKey[0]);
            request.ciphers.push(new CipherWithIdRequest(cipher));
        }

        await this.apiService.postAccountKey(request);
    }
}
