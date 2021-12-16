import { TokenRequest } from "./tokenRequest";

import { TwoFactorProviderType } from "../../../enums/twoFactorProviderType";

import { DeviceRequest } from "../deviceRequest";

export class SsoTokenRequest extends TokenRequest {
  code: string;
  codeVerifier: string;
  redirectUri: string;

  constructor(
    code: string,
    codeVerifier: string,
    redirectUri: string,
    public provider: TwoFactorProviderType,
    public token: string,
    public remember: boolean,
    public captchaResponse: string,
    device?: DeviceRequest
  ) {
    super(provider, token, remember, captchaResponse, device);

    this.code = code;
    this.codeVerifier = codeVerifier;
    this.redirectUri = redirectUri;
  }

  toIdentityToken(clientId: string) {
    const obj = super.toIdentityToken(clientId);

    obj.grant_type = "authorization_code";
    obj.code = this.code;
    obj.code_verifier = this.codeVerifier;
    obj.redirect_uri = this.redirectUri;

    return obj;
  }
}
