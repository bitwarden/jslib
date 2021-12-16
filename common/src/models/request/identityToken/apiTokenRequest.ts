import { TokenRequest } from "./tokenRequest";

import { TwoFactorProviderType } from "../../../enums/twoFactorProviderType";

import { DeviceRequest } from "../deviceRequest";

export class ApiTokenRequest extends TokenRequest {
  clientId: string;
  clientSecret: string;

  constructor(
    clientId: string,
    clientSecret: string,
    public provider: TwoFactorProviderType,
    public token: string,
    public remember: boolean,
    public captchaResponse: string,
    device?: DeviceRequest
  ) {
    super(provider, token, remember, captchaResponse, device);

    this.clientId = clientId;
    this.clientSecret = clientSecret;
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
