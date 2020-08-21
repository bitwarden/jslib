import { Router } from '@angular/router';

import { ApiService } from '../../abstractions/api.service';
import { CryptoService } from '../../abstractions/crypto.service';
import { I18nService } from '../../abstractions/i18n.service';
import { MessagingService } from '../../abstractions/messaging.service';
import { PasswordGenerationService } from '../../abstractions/passwordGeneration.service';
import { PlatformUtilsService } from '../../abstractions/platformUtils.service';
import { PolicyService } from '../../abstractions/policy.service';
import { UserService } from '../../abstractions/user.service';

import { CipherString } from '../../models/domain/cipherString';
import { SymmetricCryptoKey } from '../../models/domain/symmetricCryptoKey';

import { KeysRequest } from '../../models/request/keysRequest';
import { SetPasswordRequest } from '../../models/request/setPasswordRequest';

import { ChangePasswordComponent as BaseChangePasswordComponent } from './change-password.component';

import { KdfType } from '../../enums/kdfType';

export class SetPasswordComponent extends BaseChangePasswordComponent {
    showPassword: boolean = false;
    hint: string = '';

    onSuccessfulChangePassword: () => Promise<any>;
    successRoute = 'vault';

    constructor(i18nService: I18nService, cryptoService: CryptoService, messagingService: MessagingService,
        userService: UserService, passwordGenerationService: PasswordGenerationService,
        platformUtilsService: PlatformUtilsService, policyService: PolicyService, private router: Router,
        private apiService: ApiService) {
        super(i18nService, cryptoService, messagingService, userService, passwordGenerationService,
            platformUtilsService, policyService);
    }

    async setupSubmitActions() {
        this.kdf = KdfType.PBKDF2_SHA256;
        const useLowerKdf = this.platformUtilsService.isEdge() || this.platformUtilsService.isIE();
        this.kdfIterations = useLowerKdf ? 10000 : 100000;
        return true;
    }

    async performSubmitActions(masterPasswordHash: string, key: SymmetricCryptoKey,
        encKey: [SymmetricCryptoKey, CipherString]) {
        const request = new SetPasswordRequest();
        request.masterPasswordHash = masterPasswordHash;
        request.key = encKey[1].encryptedString;
        request.masterPasswordHint = this.hint;
        request.kdf = this.kdf;
        request.kdfIterations = this.kdfIterations;

        const keys = await this.cryptoService.makeKeyPair(encKey[0]);
        request.keys = new KeysRequest(keys[0], keys[1].encryptedString);

        try {
            this.formPromise = this.apiService.setPassword(request);
            await this.formPromise;

            await this.userService.setInformation(await this.userService.getUserId(), await this.userService.getEmail(),
                this.kdf, this.kdfIterations);
            await this.cryptoService.setKey(key);
            await this.cryptoService.setKeyHash(masterPasswordHash);
            await this.cryptoService.setEncKey(encKey[1].encryptedString);
            await this.cryptoService.setEncPrivateKey(keys[1].encryptedString);

            if (this.onSuccessfulChangePassword != null) {
                this.onSuccessfulChangePassword();
            } else {
                this.router.navigate([this.successRoute]);
            }
        } catch {
            this.platformUtilsService.showToast('error', null, this.i18nService.t('errorOccurred'));
        }
    }

    togglePassword(confirmField: boolean) {
        this.platformUtilsService.eventTrack('Toggled Master Password on Set Password');
        this.showPassword = !this.showPassword;
        document.getElementById(confirmField ? 'masterPasswordRetype' : 'masterPassword').focus();
    }
}
