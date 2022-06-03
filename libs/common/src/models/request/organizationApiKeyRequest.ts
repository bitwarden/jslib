import { OrganizationApiKeyType } from "../../enums/organizationApiKeyType";

import { SecretVerificationRequest } from "./secretVerificationRequest";

export class OrganizationApiKeyRequest extends SecretVerificationRequest {
  type: OrganizationApiKeyType = OrganizationApiKeyType.Default;
}
