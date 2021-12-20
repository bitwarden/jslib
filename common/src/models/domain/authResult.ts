import { TwoFactorProviderType } from "../../enums/twoFactorProviderType";

import { Utils } from "../../misc/utils";

export class AuthResult {
  captchaSiteKey: string = "";
  resetMasterPassword: boolean = false;
  forcePasswordReset: boolean = false;
  twoFactorProviders: Map<TwoFactorProviderType, { [key: string]: string }> = null;

  get requiresCaptcha() {
    return !Utils.isNullOrWhitespace(this.captchaSiteKey);
  }

  get requiresTwoFactor() {
    return this.twoFactorProviders != null;
  }
}
