import { TwoFactorProviderType } from "../../../enums/twoFactorProviderType";

import { CaptchaProtectedRequest } from "../captchaProtectedRequest";
import { DeviceRequest } from "../deviceRequest";

export abstract class TokenRequest implements CaptchaProtectedRequest {
  device?: DeviceRequest;

  constructor(
    public provider: TwoFactorProviderType,
    public token: string,
    public remember: boolean,
    public captchaResponse: string,
    device?: DeviceRequest
  ) {
    this.device = device != null ? device : null;
  }

  toIdentityToken(clientId: string) {
    const obj: any = {
      scope: "api offline_access",
      client_id: clientId,
    };

    if (this.device) {
      obj.deviceType = this.device.type;
      obj.deviceIdentifier = this.device.identifier;
      obj.deviceName = this.device.name;
      // no push tokens for browser apps yet
      // obj.devicePushToken = this.device.pushToken;
    }

    if (this.token && this.provider != null) {
      obj.twoFactorToken = this.token;
      obj.twoFactorProvider = this.provider;
      obj.twoFactorRemember = this.remember ? "1" : "0";
    }

    if (this.captchaResponse != null) {
      obj.captchaResponse = this.captchaResponse;
    }

    return obj;
  }

  alterIdentityTokenHeaders(headers: Headers) {
    // Implemented in subclass if required
  }
}
