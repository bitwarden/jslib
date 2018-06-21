import { PasswordVerificationRequest } from './passwordVerificationRequest';

export class PasswordRequest extends PasswordVerificationRequest {
    newMasterPasswordHash: string;
    key: string;
}
