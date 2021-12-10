import { Directive } from '@angular/core';

import { ApiService } from 'jslib-common/abstractions/api.service';
import { CryptoService } from 'jslib-common/abstractions/crypto.service';
import { I18nService } from 'jslib-common/abstractions/i18n.service';
import { LogService } from 'jslib-common/abstractions/log.service';
import { MessagingService } from 'jslib-common/abstractions/messaging.service';
import { PasswordGenerationService } from 'jslib-common/abstractions/passwordGeneration.service';
import { PlatformUtilsService } from 'jslib-common/abstractions/platformUtils.service';
import { PolicyService } from 'jslib-common/abstractions/policy.service';
import { SyncService } from 'jslib-common/abstractions/sync.service';
import { UserService } from 'jslib-common/abstractions/user.service';

import { ChangePasswordComponent as BaseChangePasswordComponent } from './change-password.component';

import { EncString } from 'jslib-common/models/domain/encString';
import { MasterPasswordPolicyOptions } from 'jslib-common/models/domain/masterPasswordPolicyOptions';
import { SymmetricCryptoKey } from 'jslib-common/models/domain/symmetricCryptoKey';

import { UpdateTempPasswordRequest } from 'jslib-common/models/request/updateTempPasswordRequest';

@Directive()
export class UpdateTempPasswordComponent extends BaseChangePasswordComponent {
    hint: string;
    key: string;
    enforcedPolicyOptions: MasterPasswordPolicyOptions;
    showPassword: boolean = false;

    onSuccessfulChangePassword: () => Promise<any>;

    constructor(i18nService: I18nService, platformUtilsService: PlatformUtilsService,
        passwordGenerationService: PasswordGenerationService, policyService: PolicyService,
        cryptoService: CryptoService, userService: UserService,
        messagingService: MessagingService, private apiService: ApiService,
        private syncService: SyncService, private logService: LogService) {
        super(i18nService, cryptoService, messagingService, userService, passwordGenerationService,
            platformUtilsService, policyService);
    }

    async ngOnInit() {
        await this.syncService.fullSync(true);
        super.ngOnInit();
    }

    togglePassword(confirmField: boolean) {
        this.showPassword = !this.showPassword;
        document.getElementById(confirmField ? 'masterPasswordRetype' : 'masterPassword').focus();
    }

    async setupSubmitActions(): Promise<boolean> {
        this.enforcedPolicyOptions = await this.policyService.getMasterPasswordPolicyOptions();
        this.email = await this.userService.getEmail();
        this.kdf = await this.userService.getKdf();
        this.kdfIterations = await this.userService.getKdfIterations();
        return true;
    }

    async submit() {
        // Validation
        if (!await this.strongPassword()) {
            return;
        }

        if (!await this.setupSubmitActions()) {
            return;
        }

        try {
            // Create new key and hash new password
            const newKey = await this.cryptoService.makeKey(this.masterPassword, this.email.trim().toLowerCase(),
                this.kdf, this.kdfIterations);
            const newPasswordHash = await this.cryptoService.hashPassword(this.masterPassword, newKey);

            // Grab user's current enc key
            const userEncKey = await this.cryptoService.getEncKey();

            // Create new encKey for the User
            const newEncKey = await this.cryptoService.remakeEncKey(newKey, userEncKey);

            await this.performSubmitActions(newPasswordHash, newKey, newEncKey);
        } catch (e) {
            this.logService.error(e);
        }
    }

    async performSubmitActions(masterPasswordHash: string, key: SymmetricCryptoKey,
        encKey: [SymmetricCryptoKey, EncString]) {
        try {
            // Create request
            const request = new UpdateTempPasswordRequest();
            request.key = encKey[1].encryptedString;
            request.newMasterPasswordHash = masterPasswordHash;
            request.masterPasswordHint = this.hint;

            // Update user's password
            this.formPromise = this.apiService.putUpdateTempPassword(request);
            await this.formPromise;
            this.platformUtilsService.showToast('success', null, this.i18nService.t('updatedMasterPassword'));

            if (this.onSuccessfulChangePassword != null) {
                this.onSuccessfulChangePassword();
            } else {
                this.messagingService.send('logout');
            }
        } catch (e) {
            this.logService.error(e);
        }
    }
}
