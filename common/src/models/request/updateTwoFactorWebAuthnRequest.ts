import { PasswordVerificationRequest } from './passwordVerificationRequest';

export class UpdateTwoFactorWebAuthnRequest extends PasswordVerificationRequest {
    deviceResponse: PublicKeyCredential;
    name: string;
    id: number;
}
