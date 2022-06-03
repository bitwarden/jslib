import { SecretVerificationRequest } from "./secretVerificationRequest";

export class OrganizationUserResetPasswordEnrollmentRequest extends SecretVerificationRequest {
  resetPasswordKey: string;
}
