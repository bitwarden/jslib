import { PasswordVerificationRequest } from './passwordVerificationRequest';

export class TwoFactorRecoveryRequest extends PasswordVerificationRequest {
    recoveryCode: string;
    email: string;
}
