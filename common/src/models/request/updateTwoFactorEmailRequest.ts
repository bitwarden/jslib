import { PasswordVerificationRequest } from './passwordVerificationRequest';

export class UpdateTwoFactorEmailRequest extends PasswordVerificationRequest {
    token: string;
    email: string;
}
