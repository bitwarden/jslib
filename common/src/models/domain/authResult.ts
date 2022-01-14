import { TwoFactorProviderType } from "../../enums/twoFactorProviderType";

export class AuthResult {
  twoFactor = false;
  captchaSiteKey = "";
  resetMasterPassword = false;
  forcePasswordReset = false;
  twoFactorProviders: Map<TwoFactorProviderType, { [key: string]: string }> = null;
}
