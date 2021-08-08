import { PasswordVerificationRequest } from './passwordVerificationRequest';

export class UpdateTwoFactorDuoRequest extends PasswordVerificationRequest {
    integrationKey: string;
    secretKey: string;
    host: string;
}
