import { PasswordVerificationRequest } from './passwordVerificationRequest';

export class UpdateTwoFactorU2fRequest extends PasswordVerificationRequest {
    deviceResponse: string;
    name: string;
    id: number;
}
