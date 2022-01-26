import { KdfType } from "../enums/kdfType";

import { ApiLogInDelegate } from "../misc/logInDelegate/apiLogin.delegate";
import { PasswordLogInDelegate, PasswordLogInDelegateFactory } from "../misc/logInDelegate/passwordLogin.delegate";
import { SsoLogInDelegate } from "../misc/logInDelegate/ssoLogin.delegate";
import { AuthResult } from "../models/domain/authResult";
import { SymmetricCryptoKey } from "../models/domain/symmetricCryptoKey";

import { PreloginRequest } from "../models/request/preloginRequest";

import { TokenRequestTwoFactor } from "../models/request/identityToken/tokenRequest";

import { ApiService } from "../abstractions/api.service";
import { AuthService as AuthServiceAbstraction } from "../abstractions/auth.service";
import { CryptoService } from "../abstractions/crypto.service";
import { MessagingService } from "../abstractions/messaging.service";

import { LogInDelegate } from "../misc/logInDelegate/logIn.delegate";

export class AuthService implements AuthServiceAbstraction {
  get email(): string {
    return this.logInDelegate instanceof PasswordLogInDelegate ? this.logInDelegate.email : null;
  }

  get masterPasswordHash(): string {
    return this.logInDelegate instanceof PasswordLogInDelegate
      ? this.logInDelegate.masterPasswordHash
      : null;
  }
  private logInDelegate: LogInDelegate;

  constructor(
    private cryptoService: CryptoService,
    private apiService: ApiService,
    private messagingService: MessagingService,
    private passwordLogInDelegateFactory: PasswordLogInDelegateFactory
  ) {}

  async logIn(
    email: string,
    masterPassword: string,
    twoFactor?: TokenRequestTwoFactor,
    captchaToken?: string
  ): Promise<AuthResult> {
    const delegate = await this.passwordLogInDelegateFactory(
      email,
      masterPassword,
      captchaToken,
      twoFactor
    );

    return this.startLogin(delegate);
  }

  async logInSso(
    code: string,
    codeVerifier: string,
    redirectUrl: string,
    orgId: string,
    twoFactor?: TokenRequestTwoFactor
  ): Promise<AuthResult> {
    // const ssoLogInDelegate = await SsoLogInDelegate.new(
    //   this.cryptoService,
    //   this.apiService,
    //   this.tokenService,
    //   this.appIdService,
    //   this.platformUtilsService,
    //   this.messagingService,
    //   this.logService,
    //   this.stateService,
    //   this.twoFactorService,
    //   this.keyConnectorService,
    //   code,
    //   codeVerifier,
    //   redirectUrl,
    //   orgId,
    //   twoFactor
    // );

    // return this.startLogin(ssoLogInDelegate);
    return null;
  }

  async logInApiKey(
    clientId: string,
    clientSecret: string,
    twoFactor?: TokenRequestTwoFactor
  ): Promise<AuthResult> {
    // const apiLogInDelegate = await ApiLogInDelegate.new(
    //   this.cryptoService,
    //   this.apiService,
    //   this.tokenService,
    //   this.appIdService,
    //   this.platformUtilsService,
    //   this.messagingService,
    //   this.logService,
    //   this.stateService,
    //   this.twoFactorService,
    //   this.environmentService,
    //   this.keyConnectorService,
    //   clientId,
    //   clientSecret,
    //   twoFactor
    // );

    // return this.startLogin(apiLogInDelegate);
    return null;
  }

  async logInTwoFactor(twoFactor: TokenRequestTwoFactor): Promise<AuthResult> {
    try {
      return await this.logInDelegate.logInTwoFactor(twoFactor);
    } finally {
      this.logInDelegate = null;
    }
  }

  logOut(callback: Function) {
    callback();
    this.messagingService.send("loggedOut");
  }

  authingWithApiKey(): boolean {
    return this.logInDelegate instanceof ApiLogInDelegate;
  }

  authingWithSso(): boolean {
    return this.logInDelegate instanceof SsoLogInDelegate;
  }

  authingWithPassword(): boolean {
    return this.logInDelegate instanceof PasswordLogInDelegate;
  }

  async makePreloginKey(masterPassword: string, email: string): Promise<SymmetricCryptoKey> {
    email = email.trim().toLowerCase();
    let kdf: KdfType = null;
    let kdfIterations: number = null;
    try {
      const preloginResponse = await this.apiService.postPrelogin(new PreloginRequest(email));
      if (preloginResponse != null) {
        kdf = preloginResponse.kdf;
        kdfIterations = preloginResponse.kdfIterations;
      }
    } catch (e) {
      if (e == null || e.statusCode !== 404) {
        throw e;
      }
    }
    return this.cryptoService.makeKey(masterPassword, email, kdf, kdfIterations);
  }

  protected async startLogin(
    delegate: ApiLogInDelegate | SsoLogInDelegate | PasswordLogInDelegate
  ): Promise<AuthResult> {
    this.logInDelegate = null;
    const result = await delegate.logIn();
    if (result.requiresTwoFactor) {
      this.logInDelegate = delegate;
    }

    return result;
  }
}
