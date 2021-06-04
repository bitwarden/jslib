import { PasswordVerificationRequest } from './passwordVerificationRequest';

export class UpdateTwoFactorAuthenticatorRequest extends PasswordVerificationRequest {
    token: string;
    key: string;
}
