import { KdfType } from "../enums/kdfType";

import { ApiLogInDelegate } from "../misc/logInDelegate/apiLogin.delegate";
import { PasswordLogInDelegate } from "../misc/logInDelegate/passwordLogin.delegate";
import { SsoLogInDelegate } from "../misc/logInDelegate/ssoLogin.delegate";
import { AuthResult } from "../models/domain/authResult";
import { SymmetricCryptoKey } from "../models/domain/symmetricCryptoKey";

import { PreloginRequest } from "../models/request/preloginRequest";

import { TokenRequestTwoFactor } from "../models/request/identityToken/tokenRequest";

import { ApiService } from "../abstractions/api.service";
import { AppIdService } from "../abstractions/appId.service";
import { AuthService as AuthServiceAbstraction } from "../abstractions/auth.service";
import { CryptoService } from "../abstractions/crypto.service";
import { EnvironmentService } from "../abstractions/environment.service";
import { KeyConnectorService } from "../abstractions/keyConnector.service";
import { LogService } from "../abstractions/log.service";
import { MessagingService } from "../abstractions/messaging.service";
import { PlatformUtilsService } from "../abstractions/platformUtils.service";
import { StateService } from "../abstractions/state.service";
import { TokenService } from "../abstractions/token.service";
import { TwoFactorService } from "../abstractions/twoFactor.service";
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
    protected cryptoService: CryptoService,
    protected apiService: ApiService,
    protected tokenService: TokenService,
    protected appIdService: AppIdService,
    protected platformUtilsService: PlatformUtilsService,
    protected messagingService: MessagingService,
    protected logService: LogService,
    protected keyConnectorService: KeyConnectorService,
    protected environmentService: EnvironmentService,
    protected stateService: StateService,
    protected twoFactorService: TwoFactorService
  ) {}

  async logIn(
    email: string,
    masterPassword: string,
    twoFactor?: TokenRequestTwoFactor,
    captchaToken?: string
  ): Promise<AuthResult> {
    const passwordLogInDelegate = await PasswordLogInDelegate.new(
      this.cryptoService,
      this.apiService,
      this.tokenService,
      this.appIdService,
      this.platformUtilsService,
      this.messagingService,
      this.logService,
      this.stateService,
      this.twoFactorService,
      this,
      email,
      masterPassword,
      captchaToken,
      twoFactor
    );

    return this.startLogin(passwordLogInDelegate);
  }

  async logInSso(
    code: string,
    codeVerifier: string,
    redirectUrl: string,
    orgId: string,
    twoFactor?: TokenRequestTwoFactor
  ): Promise<AuthResult> {
    const ssoLogInDelegate = await SsoLogInDelegate.new(
      this.cryptoService,
      this.apiService,
      this.tokenService,
      this.appIdService,
      this.platformUtilsService,
      this.messagingService,
      this.logService,
      this.stateService,
      this.twoFactorService,
      this.keyConnectorService,
      code,
      codeVerifier,
      redirectUrl,
      orgId,
      twoFactor
    );

    return this.startLogin(ssoLogInDelegate);
  }

  async logInApiKey(
    clientId: string,
    clientSecret: string,
    twoFactor?: TokenRequestTwoFactor
  ): Promise<AuthResult> {
    const apiLogInDelegate = await ApiLogInDelegate.new(
      this.cryptoService,
      this.apiService,
      this.tokenService,
      this.appIdService,
      this.platformUtilsService,
      this.messagingService,
      this.logService,
      this.stateService,
      this.twoFactorService,
      this.environmentService,
      this.keyConnectorService,
      clientId,
      clientSecret,
      twoFactor
    );

    return this.startLogin(apiLogInDelegate);
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
