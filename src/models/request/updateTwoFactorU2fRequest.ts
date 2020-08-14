import { PasswordVerificationRequest } from './passwordVerificationRequest';

export class UpdateTwoFactorU2fRequest extends PasswordVerificationRequest {
    deviceResponse: PublicKeyCredential;
    name: string;
    id: number;
}
