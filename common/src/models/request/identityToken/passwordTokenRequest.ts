import { TokenRequest, TwoFactorData } from "./tokenRequest";

import { CaptchaProtectedRequest } from "../captchaProtectedRequest";
import { DeviceRequest } from "../deviceRequest";

import { Utils } from "../../../misc/utils";

export class PasswordTokenRequest extends TokenRequest implements CaptchaProtectedRequest {
  constructor(
    public email: string,
    private masterPasswordHash: string,
    public captchaResponse: string,
    protected twoFactor: TwoFactorData,
    device?: DeviceRequest
  ) {
    super(twoFactor, device);
  }

  toIdentityToken(clientId: string) {
    const obj = super.toIdentityToken(clientId);

    obj.grant_type = "password";
    obj.username = this.email;
    obj.password = this.masterPasswordHash;

    if (this.captchaResponse != null) {
      obj.captchaResponse = this.captchaResponse;
    }

    return obj;
  }

  alterIdentityTokenHeaders(headers: Headers) {
    headers.set("Auth-Email", Utils.fromUtf8ToUrlB64(this.email));
  }
}
