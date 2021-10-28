import { PasswordVerificationRequest } from './passwordVerificationRequest';

export class TwoFactorEmailRequest extends PasswordVerificationRequest {
    email: string;
}
