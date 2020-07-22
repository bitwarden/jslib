import { Router } from '@angular/router';

import { KeysRequest } from '../../models/request/keysRequest';
import { ReferenceEventRequest } from '../../models/request/referenceEventRequest';
import { RegisterRequest } from '../../models/request/registerRequest';

import { ApiService } from '../../abstractions/api.service';
import { AuthService } from '../../abstractions/auth.service';
import { CryptoService } from '../../abstractions/crypto.service';
import { I18nService } from '../../abstractions/i18n.service';
import { PasswordGenerationService } from '../../abstractions/passwordGeneration.service';
import { PlatformUtilsService } from '../../abstractions/platformUtils.service';
import { StateService } from '../../abstractions/state.service';

import {
    ResetMasterPasswordComponent as BaseResetMasterPasswordComponent,
} from '../../angular/components/reset-master-password.component';

import { KdfType } from '../../enums/kdfType';

export class RegisterComponent extends BaseResetMasterPasswordComponent {
    name: string = '';
    email: string = '';
    referenceData: ReferenceEventRequest;

    protected successRoute = 'login';

    constructor(authService: AuthService, router: Router,
        i18nService: I18nService, cryptoService: CryptoService,
        apiService: ApiService, stateService: StateService,
        platformUtilsService: PlatformUtilsService,
        passwordGenerationService: PasswordGenerationService) {
        super(authService, router, i18nService, cryptoService, apiService, stateService, platformUtilsService,
            passwordGenerationService);
    }

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

        if (await super.submit()) {
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
                this.platformUtilsService.eventTrack('Registered');
                this.platformUtilsService.showToast('success', null, this.i18nService.t('newAccountCreated'));
                this.router.navigate([this.successRoute], { queryParams: { email: this.email } });
                return true;
            } catch { }
        }
    }

    protected getPasswordStrengthUserInput() {
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
