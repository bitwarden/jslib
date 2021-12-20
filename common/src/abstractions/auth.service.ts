import { AuthResult } from "../models/domain/authResult";
import { SymmetricCryptoKey } from "../models/domain/symmetricCryptoKey";
import { TokenRequestTwoFactor } from "../models/request/identityToken/tokenRequest";

export abstract class AuthService {
  masterPasswordHash: string;
  email: string;
  logIn: (
    email: string,
    masterPassword: string,
    twoFactor?: TokenRequestTwoFactor,
    captchaToken?: string
  ) => Promise<AuthResult>;
  logInSso: (
    code: string,
    codeVerifier: string,
    redirectUrl: string,
    orgId: string,
    twoFactor?: TokenRequestTwoFactor
  ) => Promise<AuthResult>;
  logInApiKey: (
    clientId: string,
    clientSecret: string,
    twoFactor?: TokenRequestTwoFactor
  ) => Promise<AuthResult>;
  logInTwoFactor: (twoFactor: TokenRequestTwoFactor) => Promise<AuthResult>;
  logOut: (callback: Function) => void;
  makePreloginKey: (masterPassword: string, email: string) => Promise<SymmetricCryptoKey>;
  authingWithApiKey: () => boolean;
  authingWithSso: () => boolean;
  authingWithPassword: () => boolean;
}
