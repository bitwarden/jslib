import { UserVerificationService as UserVerificationServiceAbstraction } from '../abstractions/userVerification.service';

import { ApiService } from '../abstractions/api.service';
import { CryptoService } from '../abstractions/crypto.service';
import { I18nService } from '../abstractions/i18n.service';
import { PlatformUtilsService } from '../abstractions/platformUtils.service';

import { VerificationType } from '../enums/verificationType';

import { VerifyOTPRequest } from '../models/request/account/verifyOTPRequest';
import { SecretVerificationRequest } from '../models/request/secretVerificationRequest';

import { Verification } from '../types/verification';

export class UserVerificationService implements UserVerificationServiceAbstraction {
    constructor(private cryptoService: CryptoService, private i18nService: I18nService,
        private platformUtilsService: PlatformUtilsService, private apiService: ApiService) { }

    async buildRequest<T extends SecretVerificationRequest>(verification: Verification,
        requestClass?: new () => T, alreadyHashed?: boolean) {
        if (verification?.secret == null || verification.secret === '') {
            if (verification.type === VerificationType.OTP) {
                this.handleError(this.i18nService.t('verificationCodeRequired'));
            } else {
                this.handleError(this.i18nService.t('masterPasswordRequired'));
            }
            return null;
        }

        const request = requestClass != null
            ? new requestClass()
            : new SecretVerificationRequest() as T;

        if (verification.type === VerificationType.OTP) {
            request.otp = verification.secret;
        } else {
            request.masterPasswordHash = alreadyHashed
                ? verification.secret
                : await this.cryptoService.hashPassword(verification.secret, null);
        }

        return request;
    }

    async verifyUser(verification: Verification): Promise<boolean> {
        if (verification?.secret == null || verification.secret === '') {
            if (verification.type === VerificationType.OTP) {
                this.handleError(this.i18nService.t('verificationCodeRequired'));
            } else {
                this.handleError(this.i18nService.t('masterPasswordRequired'));
            }
            return false;
        }

        if (verification.type === VerificationType.OTP) {
            const request = new VerifyOTPRequest(verification.secret);
            try {
                await this.apiService.postAccountVerifyOTP(request);
            } catch (e) {
                this.handleError(this.i18nService.t('invalidVerificationCode'));
                return false;
            }
        } else {
            const passwordValid = await this.cryptoService.compareAndUpdateKeyHash(verification.secret, null);
            if (!passwordValid) {
                this.handleError(this.i18nService.t('invalidMasterPassword'));
                return false;
            }
        }
        return true;
    }

    async requestOTP() {
        await this.apiService.postAccountRequestOTP();
    }

    protected handleError(message: string) {
        this.platformUtilsService.showToast('error', this.i18nService.t('errorOccurred'), message);
    }
}
