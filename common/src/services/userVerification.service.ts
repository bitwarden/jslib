import { CryptoService } from '../abstractions/crypto.service';
import { I18nService } from '../abstractions/i18n.service';
import { UserVerificationService as UserVerificationServiceAbstraction } from '../abstractions/userVerification.service';

import { VerificationType } from '../enums/verificationType';

import { PasswordVerificationRequest } from '../models/request/passwordVerificationRequest';

import { Verification } from '../types/verification';

export class UserVerificationService implements UserVerificationServiceAbstraction {
    constructor(private cryptoService: CryptoService) { }

    async buildRequest<T extends PasswordVerificationRequest>
        (verification: Verification, requestClass?: new () => T, alreadyEncrypted?: boolean) {

        if (verification?.secret == null || verification.secret === '') {
            throw new Error('No secret provided for verification.');
        }

        const request = requestClass != null
            ? new requestClass()
            : new PasswordVerificationRequest() as T;

        if (verification.type === VerificationType.OTP) {
            request.otp = verification.secret;
        } else {
            request.masterPasswordHash = alreadyEncrypted
                ? verification.secret
                : await this.cryptoService.hashPassword(verification.secret, null);
        }

        return request;
    }
}
