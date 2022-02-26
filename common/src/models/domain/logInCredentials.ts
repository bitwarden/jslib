import { AuthenticationType } from "../../enums/authenticationType";
import { Utils } from "../../misc/utils";
import { TokenRequestTwoFactor } from "../request/identityToken/tokenRequest";

export class PasswordLogInCredentials {
  readonly type = AuthenticationType.Password;

  constructor(
    public email: string,
    public masterPassword: string,
    public captchaToken?: string,
    public twoFactor?: TokenRequestTwoFactor
  ) {}
}

export class SsoLogInCredentials {
  readonly type = AuthenticationType.Sso;

  constructor(
    public code: string,
    public codeVerifier: string,
    public redirectUrl: string,
    public orgId: string,
    public twoFactor?: TokenRequestTwoFactor
  ) {}
}

export class ApiLogInCredentials {
  static FromCombinedKey(key: string) {
    const utf = Utils.fromB64ToUtf8(key);
    const parsed = JSON.parse(utf) as ApiLogInCredentials;
    const creds = new ApiLogInCredentials(parsed.clientId, parsed.clientSecret);
    creds.encClientEncInfo = parsed.encClientEncInfo;
    return creds;
  }

  readonly type = AuthenticationType.Api;
  encClientEncInfo: string;

  constructor(public clientId: string, public clientSecret: string) {}
}
