import { AuthenticationType } from "../../enums/authenticationType";

import { TokenRequestTwoFactor } from "../request/identityToken/tokenRequest";

abstract class LogInCredentials {
  abstract type: AuthenticationType;
}

export class PasswordLogInCredentials extends LogInCredentials {
  readonly type = AuthenticationType.Password;

  constructor(
    public email: string,
    public masterPassword: string,
    public captchaToken?: string,
    public twoFactor?: TokenRequestTwoFactor
  ) {
    super();
  }
}

export class SsoLogInCredentials extends LogInCredentials {
  readonly type = AuthenticationType.Sso;

  constructor(
    public code: string,
    public codeVerifier: string,
    public redirectUrl: string,
    public orgId: string,
    public twoFactor?: TokenRequestTwoFactor
  ) {
    super();
  }
}

export class ApiLogInCredentials {
  readonly type = AuthenticationType.Api;

  constructor(public clientId: string, public clientSecret: string) {}
}
