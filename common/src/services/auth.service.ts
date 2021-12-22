import { KdfType } from "../enums/kdfType";

import { ApiLogInDelegate } from './logInDelegate/apiLogin.delegate';
import { AuthResult } from "../models/domain/authResult";
import { PasswordLogInDelegate } from './logInDelegate/passwordLogin.delegate';
import { SsoLogInDelegate } from './logInDelegate/ssoLogin.delegate';
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
import { LogInDelegate } from './logInDelegate/logIn.delegate';

export class AuthService implements AuthServiceAbstraction {
  private logInService: LogInDelegate;

  constructor(
    private cryptoService: CryptoService,
    protected apiService: ApiService,
    protected tokenService: TokenService,
    protected appIdService: AppIdService,
    protected platformUtilsService: PlatformUtilsService,
    private messagingService: MessagingService,
    private logService: LogService,
    private keyConnectorService: KeyConnectorService,
    protected environmentService: EnvironmentService,
    protected stateService: StateService,
    private twoFactorService: TwoFactorService,
    private setCryptoKeys = true
  ) {}

  get email(): string {
    return this.logInService instanceof PasswordLogInDelegate
      ? this.logInService.email
      : null;
  }

  get masterPasswordHash(): string {
    return this.logInService instanceof PasswordLogInDelegate
      ? this.logInService.masterPasswordHash
      : null;
  }

  async logIn(
    email: string,
    masterPassword: string,
    twoFactor?: TokenRequestTwoFactor,
    captchaToken?: string
  ): Promise<AuthResult> {
    const passwordLogInService = new PasswordLogInDelegate(this.cryptoService, this.apiService, this.tokenService,
      this.appIdService, this.platformUtilsService, this.messagingService, this.logService, this.stateService,
      this.setCryptoKeys, this.twoFactorService, this);

    await passwordLogInService.init(email, masterPassword, captchaToken, twoFactor);
    
    this.logInService = passwordLogInService;
    return this.logInService.logIn();
  }

  async logInSso(
    code: string,
    codeVerifier: string,
    redirectUrl: string,
    orgId: string,
    twoFactor?: TokenRequestTwoFactor
  ): Promise<AuthResult> {
    const ssoLogInService = new SsoLogInDelegate(this.cryptoService, this.apiService, this.tokenService,
      this.appIdService, this.platformUtilsService, this.messagingService, this.logService, this.stateService,
      this.setCryptoKeys, this.twoFactorService, this.keyConnectorService);
    
    await ssoLogInService.init(code, codeVerifier, redirectUrl, orgId, twoFactor);

    this.logInService = ssoLogInService;
    return this.logInService.logIn();
  }

  async logInApiKey(
    clientId: string,
    clientSecret: string,
    twoFactor?: TokenRequestTwoFactor
  ): Promise<AuthResult> {
    const apiLogInService = new ApiLogInDelegate(this.cryptoService, this.apiService, this.tokenService, this.appIdService,
      this.platformUtilsService, this.messagingService, this.logService, this.stateService, this.setCryptoKeys,
      this.twoFactorService, this.environmentService, this.keyConnectorService);

    await apiLogInService.init(clientId, clientSecret, twoFactor);

    this.logInService = apiLogInService;
    return this.logInService.logIn();
  }

  async logInTwoFactor(twoFactor: TokenRequestTwoFactor): Promise<AuthResult> {
    return this.logInService.logInTwoFactor(twoFactor);
  }

  logOut(callback: Function) {
    callback();
    this.messagingService.send("loggedOut");
  }

  authingWithApiKey(): boolean {
    return this.logInService instanceof ApiLogInDelegate;
  }

  authingWithSso(): boolean {
    return this.logInService instanceof SsoLogInDelegate;
  }

  authingWithPassword(): boolean {
    return this.logInService instanceof PasswordLogInDelegate;
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
}
