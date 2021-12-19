import { TokenRequest, TwoFactorData } from "./tokenRequest";

import { DeviceRequest } from "../deviceRequest";

import { Utils } from "../../../misc/utils";

export class PasswordTokenRequest extends TokenRequest {
  constructor(
    public email: string,
    public masterPasswordHash: string,
    protected twoFactor: TwoFactorData,
    captchaResponse: string,
    device?: DeviceRequest
  ) {
    super(twoFactor, captchaResponse, device);
  }

  toIdentityToken(clientId: string) {
    const obj = super.toIdentityToken(clientId);

    obj.grant_type = "password";
    obj.username = this.email;
    obj.password = this.masterPasswordHash;

    return obj;
  }

  alterIdentityTokenHeaders(headers: Headers) {
    headers.set("Auth-Email", Utils.fromUtf8ToUrlB64(this.email));
  }
}
