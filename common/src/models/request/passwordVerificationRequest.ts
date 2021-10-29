import { VerificationType } from '../../enums/verificationType';

export type Verification = {
    type: VerificationType,
    secret: string,
};

export class PasswordVerificationRequest {
    masterPasswordHash: string;
    otp: string;

    constructor(verification: Verification) {
        if (verification.type === VerificationType.MasterPassword) {
            this.masterPasswordHash = verification.secret;
        } else {
            this.otp = verification.secret;
        }
    }
}
