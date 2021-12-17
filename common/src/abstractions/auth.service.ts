import { AuthResult } from "../models/domain/authResult";
import { SymmetricCryptoKey } from "../models/domain/symmetricCryptoKey";
import { TwoFactorData } from '../models/request/identityToken/tokenRequest';

export abstract class AuthService {
  email: string;
  masterPasswordHash: string;
  code: string;
  codeVerifier: string;
  ssoRedirectUrl: string;
  clientId: string;
  clientSecret: string;

  logIn: (email: string, masterPassword: string, twoFactor: TwoFactorData, captchaToken?: string) => Promise<AuthResult>;
  logInSso: (
    code: string,
    codeVerifier: string,
    redirectUrl: string,
    twoFactor: TwoFactorData,
    orgId: string
  ) => Promise<AuthResult>;
  logInApiKey: (clientId: string, clientSecret: string, twoFactor: TwoFactorData) => Promise<AuthResult>;
  logInTwoFactor: (
    twoFactor: TwoFactorData
  ) => Promise<AuthResult>;
  logOut: (callback: Function) => void;
  makePreloginKey: (masterPassword: string, email: string) => Promise<SymmetricCryptoKey>;
  authingWithApiKey: () => boolean;
  authingWithSso: () => boolean;
  authingWithPassword: () => boolean;
}
