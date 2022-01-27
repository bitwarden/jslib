import { TokenRequest, TokenRequestTwoFactor } from "./tokenRequest";

import { DeviceRequest } from "../deviceRequest";

export class ApiTokenRequest extends TokenRequest {
  constructor(
    public clientId: string,
    public clientSecret: string,
    protected twoFactor: TokenRequestTwoFactor,
    device?: DeviceRequest
  ) {
    super(twoFactor, device);
  }

  toIdentityToken(clientId: string) {
    // Use the actual clientId from the user's API credentials, not the string passed in from platformUtilsService
    const obj = super.toIdentityToken(this.clientId);

    obj.scope = this.clientId.startsWith("organization") ? "api.organization" : "api";
    obj.grant_type = "client_credentials";
    obj.client_secret = this.clientSecret;

    return obj;
  }
}
