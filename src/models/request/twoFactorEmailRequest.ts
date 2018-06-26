import { PasswordVerificationRequest } from './passwordVerificationRequest';

export class TwoFactorEmailRequest extends PasswordVerificationRequest {
    email: string;

    constructor(email: string, masterPasswordHash: string) {
        super();
        this.masterPasswordHash = masterPasswordHash;
        this.email = email;
    }
}
