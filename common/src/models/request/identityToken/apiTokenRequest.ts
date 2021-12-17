import { TokenRequest, TwoFactorData } from "./tokenRequest";

import { DeviceRequest } from "../deviceRequest";

export class ApiTokenRequest extends TokenRequest {
  constructor(
    private clientId: string,
    private clientSecret: string,
    protected twoFactor: TwoFactorData,
    captchaResponse: string,
    device?: DeviceRequest
  ) {
    super(twoFactor, captchaResponse, device);
  }

  toIdentityToken(clientId: string) {
    const obj = super.toIdentityToken(clientId);

    obj.clientId = this.clientId;
    obj.scope = clientId.startsWith("organization") ? "api.organization" : "api";
    obj.grant_type = "client_credentials";
    obj.client_secret = this.clientSecret;

    return obj;
  }
}
