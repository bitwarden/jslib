import { Injectable } from '@angular/core';

import { UserVerificationService as UserVerificationServiceAbstraction } from '../abstractions/userVerification.service';

import { ApiService } from '../abstractions/api.service';
import { CryptoService } from '../abstractions/crypto.service';
import { I18nService } from '../abstractions/i18n.service';
import { LogService } from '../abstractions/log.service';
import { PlatformUtilsService } from '../abstractions/platformUtils.service';

import { VerificationType } from '../enums/verificationType';

import { VerifyOtpRequest } from '../models/request/account/verifyOtpRequest';
import { PasswordVerificationRequest } from '../models/request/passwordVerificationRequest';

import { Verification } from '../types/verification';

@Injectable()
export class UserVerificationService implements UserVerificationServiceAbstraction {
    constructor(private cryptoService: CryptoService, private i18nService: I18nService,
        private platformUtilsService: PlatformUtilsService, private apiService: ApiService,
        private logService: LogService) { }

    async buildRequest<T extends PasswordVerificationRequest>(verification: Verification,
        requestClass?: new () => T, alreadyHashed?: boolean) {
        if (verification?.secret == null || verification.secret === '') {
            throw new Error('No secret provided for verification.');
        }

        const request = requestClass != null
            ? new requestClass()
            : new PasswordVerificationRequest() as T;

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
            throw new Error('No secret provided for verification.');
        }

        if (verification.type === VerificationType.OTP) {
            const request = new VerifyOtpRequest(verification.secret);
            try {
                await this.apiService.postAccountVerifyOtp(request);
            } catch (e) {
                this.logService.error(e);
                this.platformUtilsService.showToast('error', this.i18nService.t('errorOccurred'),
                    this.i18nService.t('invalidVerificationCode'));
                return false;
            }
        } else {
            const passwordValid = await this.cryptoService.compareAndUpdateKeyHash(verification.secret, null);
            if (!passwordValid) {
                this.platformUtilsService.showToast('error', this.i18nService.t('errorOccurred'),
                    this.i18nService.t('invalidMasterPassword'));
                return false;
            }
        }
        return true;
    }
}
