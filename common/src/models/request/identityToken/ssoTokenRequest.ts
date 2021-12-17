import { TokenRequest, TwoFactorData } from "./tokenRequest";

import { DeviceRequest } from "../deviceRequest";

export class SsoTokenRequest extends TokenRequest {
  constructor(
    private code: string,
    private codeVerifier: string,
    private redirectUri: string,
    protected twoFactor: TwoFactorData,
    captchaResponse: string,
    device?: DeviceRequest
  ) {
    super(twoFactor, captchaResponse, device);

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
