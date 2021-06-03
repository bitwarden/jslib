import { PasswordVerificationRequest } from './passwordVerificationRequest';

export class EmailTokenRequest extends PasswordVerificationRequest {
    newEmail: string;
    masterPasswordHash: string;
}
