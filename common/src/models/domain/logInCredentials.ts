import { TokenRequestTwoFactor } from "../request/identityToken/tokenRequest";

export class PasswordLogInCredentials {
  constructor(
    public email: string,
    public masterPassword: string,
    public captchaToken?: string,
    public twoFactor?: TokenRequestTwoFactor
  ) {}
}

export class SsoLogInCredentials {
  constructor(
    public code: string,
    public codeVerifier: string,
    public redirectUrl: string,
    public orgId: string,
    public twoFactor?: TokenRequestTwoFactor
  ) {}
}

export class ApiLogInCredentials {
  constructor(public clientId: string, public clientSecret: string) {}
}
