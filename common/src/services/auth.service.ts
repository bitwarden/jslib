import { HashPurpose } from "../enums/hashPurpose";
import { KdfType } from "../enums/kdfType";
import { TwoFactorProviderType } from "../enums/twoFactorProviderType";

import { AccountProfile, AccountTokens } from "../models/domain/account";
import { AuthResult } from "../models/domain/authResult";
import { SymmetricCryptoKey } from "../models/domain/symmetricCryptoKey";

import { SetKeyConnectorKeyRequest } from "../models/request/account/setKeyConnectorKeyRequest";
import { DeviceRequest } from "../models/request/deviceRequest";
import { KeyConnectorUserKeyRequest } from "../models/request/keyConnectorUserKeyRequest";
import { KeysRequest } from "../models/request/keysRequest";
import { PreloginRequest } from "../models/request/preloginRequest";

import { ApiTokenRequest } from "../models/request/identityToken/apiTokenRequest";
import { PasswordTokenRequest } from "../models/request/identityToken/passwordTokenRequest";
import { SsoTokenRequest } from "../models/request/identityToken/ssoTokenRequest";
import { TwoFactorData } from "../models/request/identityToken/tokenRequest";

import { IdentityTokenResponse } from "../models/response/identityTokenResponse";
import { IdentityTwoFactorResponse } from "../models/response/identityTwoFactorResponse";

import { ApiService } from "../abstractions/api.service";
import { AppIdService } from "../abstractions/appId.service";
import { AuthService as AuthServiceAbstraction } from "../abstractions/auth.service";
import { CryptoService } from "../abstractions/crypto.service";
import { CryptoFunctionService } from "../abstractions/cryptoFunction.service";
import { EnvironmentService } from "../abstractions/environment.service";
import { KeyConnectorService } from "../abstractions/keyConnector.service";
import { LogService } from "../abstractions/log.service";
import { MessagingService } from "../abstractions/messaging.service";
import { PlatformUtilsService } from "../abstractions/platformUtils.service";
import { StateService } from "../abstractions/state.service";
import { TokenService } from "../abstractions/token.service";

import { TwoFactorService } from "../abstractions/twoFactor.service";
import { Utils } from "../misc/utils";

export class AuthService implements AuthServiceAbstraction {
  email: string;
  masterPasswordHash: string;
  localMasterPasswordHash: string;
  code: string;
  codeVerifier: string;
  ssoRedirectUrl: string;
  clientId: string;
  clientSecret: string;
  captchaToken: string;

  private key: SymmetricCryptoKey;

  constructor(
    private cryptoService: CryptoService,
    protected apiService: ApiService,
    protected tokenService: TokenService,
    protected appIdService: AppIdService,
    protected platformUtilsService: PlatformUtilsService,
    private messagingService: MessagingService,
    private logService: LogService,
    protected cryptoFunctionService: CryptoFunctionService,
    private keyConnectorService: KeyConnectorService,
    protected environmentService: EnvironmentService,
    protected stateService: StateService,
    private twoFactorService: TwoFactorService,
    private setCryptoKeys = true
  ) {}

  async logIn(email: string, masterPassword: string, captchaToken?: string): Promise<AuthResult> {
    this.twoFactorService.clearSelectedProvider();
    const key = await this.makePreloginKey(masterPassword, email);
    const hashedPassword = await this.cryptoService.hashPassword(masterPassword, key);
    const localHashedPassword = await this.cryptoService.hashPassword(
      masterPassword,
      key,
      HashPurpose.LocalAuthorization
    );
    return await this.logInHelper(
      email,
      hashedPassword,
      localHashedPassword,
      null,
      null,
      null,
      null,
      null,
      key,
      null,
      null,
      null,
      captchaToken,
      null
    );
  }

  async logInSso(
    code: string,
    codeVerifier: string,
    redirectUrl: string,
    orgId: string
  ): Promise<AuthResult> {
    this.twoFactorService.clearSelectedProvider();
    return await this.logInHelper(
      null,
      null,
      null,
      code,
      codeVerifier,
      redirectUrl,
      null,
      null,
      null,
      null,
      null,
      null,
      null,
      orgId
    );
  }

  async logInApiKey(clientId: string, clientSecret: string): Promise<AuthResult> {
    this.twoFactorService.clearSelectedProvider();
    return await this.logInHelper(
      null,
      null,
      null,
      null,
      null,
      null,
      clientId,
      clientSecret,
      null,
      null,
      null,
      null,
      null,
      null
    );
  }

  async logInTwoFactor(
    twoFactorProvider: TwoFactorProviderType,
    twoFactorToken: string,
    remember?: boolean
  ): Promise<AuthResult> {
    return await this.logInHelper(
      this.email,
      this.masterPasswordHash,
      this.localMasterPasswordHash,
      this.code,
      this.codeVerifier,
      this.ssoRedirectUrl,
      this.clientId,
      this.clientSecret,
      this.key,
      twoFactorProvider,
      twoFactorToken,
      remember,
      this.captchaToken,
      null
    );
  }

  async logInComplete(
    email: string,
    masterPassword: string,
    twoFactorProvider: TwoFactorProviderType,
    twoFactorToken: string,
    remember?: boolean,
    captchaToken?: string
  ): Promise<AuthResult> {
    this.twoFactorService.clearSelectedProvider();
    const key = await this.makePreloginKey(masterPassword, email);
    const hashedPassword = await this.cryptoService.hashPassword(masterPassword, key);
    const localHashedPassword = await this.cryptoService.hashPassword(
      masterPassword,
      key,
      HashPurpose.LocalAuthorization
    );
    return await this.logInHelper(
      email,
      hashedPassword,
      localHashedPassword,
      null,
      null,
      null,
      null,
      null,
      key,
      twoFactorProvider,
      twoFactorToken,
      remember,
      captchaToken,
      null
    );
  }

  async logInSsoComplete(
    code: string,
    codeVerifier: string,
    redirectUrl: string,
    twoFactorProvider: TwoFactorProviderType,
    twoFactorToken: string,
    remember?: boolean
  ): Promise<AuthResult> {
    this.twoFactorService.clearSelectedProvider();
    return await this.logInHelper(
      null,
      null,
      null,
      code,
      codeVerifier,
      redirectUrl,
      null,
      null,
      null,
      twoFactorProvider,
      twoFactorToken,
      remember,
      null,
      null
    );
  }

  async logInApiKeyComplete(
    clientId: string,
    clientSecret: string,
    twoFactorProvider: TwoFactorProviderType,
    twoFactorToken: string,
    remember?: boolean
  ): Promise<AuthResult> {
    this.twoFactorService.clearSelectedProvider();
    return await this.logInHelper(
      null,
      null,
      null,
      null,
      null,
      null,
      clientId,
      clientSecret,
      null,
      twoFactorProvider,
      twoFactorToken,
      remember,
      null,
      null
    );
  }

  logOut(callback: Function) {
    callback();
    this.messagingService.send("loggedOut");
  }

  authingWithApiKey(): boolean {
    return this.clientId != null && this.clientSecret != null;
  }

  authingWithSso(): boolean {
    return this.code != null && this.codeVerifier != null && this.ssoRedirectUrl != null;
  }

  authingWithPassword(): boolean {
    return this.email != null && this.masterPasswordHash != null;
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

  private async logInHelper(
    email: string,
    hashedPassword: string,
    localHashedPassword: string,
    code: string,
    codeVerifier: string,
    redirectUrl: string,
    clientId: string,
    clientSecret: string,
    key: SymmetricCryptoKey,
    twoFactorProvider?: TwoFactorProviderType,
    twoFactorToken?: string,
    remember?: boolean,
    captchaToken?: string,
    orgId?: string
  ): Promise<AuthResult> {
    const request = await this.createTokenRequest(
      email,
      hashedPassword,
      code,
      codeVerifier,
      redirectUrl,
      clientId,
      clientSecret,
      twoFactorToken,
      twoFactorProvider,
      remember,
      captchaToken
    );

    const response = await this.apiService.postIdentityToken(request);

    this.clearState();
    const result = new AuthResult();

    result.captchaSiteKey = (response as any).siteKey;
    if (!!result.captchaSiteKey) {
      return result;
    }

    result.twoFactor = !!(response as any).twoFactorProviders2;
    if (result.twoFactor) {
      this.saveState(
        email,
        hashedPassword,
        localHashedPassword,
        code,
        codeVerifier,
        redirectUrl,
        clientId,
        clientSecret,
        key,
        (response as IdentityTwoFactorResponse).twoFactorProviders2
      );

      result.twoFactorProviders = (response as IdentityTwoFactorResponse).twoFactorProviders2;
      return result;
    }

    const tokenResponse = response as IdentityTokenResponse;
    result.resetMasterPassword = tokenResponse.resetMasterPassword;
    result.forcePasswordReset = tokenResponse.forcePasswordReset;

    this.saveAccountInformation(tokenResponse, clientId, clientSecret);

    if (tokenResponse.twoFactorToken != null) {
      await this.tokenService.setTwoFactorToken(tokenResponse.twoFactorToken, email);
    }

    if (this.setCryptoKeys) {
      if (key != null) {
        await this.cryptoService.setKey(key);
      }
      if (localHashedPassword != null) {
        await this.cryptoService.setKeyHash(localHashedPassword);
      }

      if (!this.isNewSsoUser(code, tokenResponse.key)) {
        if (tokenResponse.keyConnectorUrl != null) {
          await this.keyConnectorService.getAndSetKey(tokenResponse.keyConnectorUrl);
        } else if (tokenResponse.apiUseKeyConnector) {
          const keyConnectorUrl = this.environmentService.getKeyConnectorUrl();
          await this.keyConnectorService.getAndSetKey(keyConnectorUrl);
        }

        await this.cryptoService.setEncKey(tokenResponse.key);

        // User doesn't have a key pair yet (old account), let's generate one for them
        if (tokenResponse.privateKey == null) {
          const newKeyPair = await this.createKeyPair();
          await this.cryptoService.setEncPrivateKey(newKeyPair);
        } else {
          await this.cryptoService.setEncPrivateKey(tokenResponse.privateKey);
        }
      } else if (tokenResponse.keyConnectorUrl != null) {
        await this.convertNewUserToKeyConnector(tokenResponse, orgId);
      }
    }

    await this.stateService.setBiometricLocked(false);
    this.messagingService.send("loggedIn");

    return result;
  }

  private async createDeviceRequest() {
    const appId = await this.appIdService.getAppId();
    return new DeviceRequest(appId, this.platformUtilsService);
  }

  private async createTokenRequest(
    email: string,
    hashedPassword: string,
    code: string,
    codeVerifier: string,
    redirectUrl: string,
    clientId: string,
    clientSecret: string,
    twoFactorToken: string,
    twoFactorProvider: TwoFactorProviderType,
    remember: boolean,
    captchaToken: string
  ) {
    const deviceRequest = await this.createDeviceRequest();
    const storedTwoFactorToken = await this.tokenService.getTwoFactorToken(email);

    const twoFactor: TwoFactorData = {
      token: null,
      provider: null,
      remember: false,
    };

    if (twoFactorToken != null && twoFactorProvider != null) {
      twoFactor.token = twoFactorToken;
      twoFactor.provider = twoFactorProvider;
      twoFactor.remember = remember;
    } else if (storedTwoFactorToken != null) {
      twoFactor.token = storedTwoFactorToken;
      twoFactor.provider = TwoFactorProviderType.Remember;
    }

    if (email != null && hashedPassword != null) {
      return new PasswordTokenRequest(
        email,
        hashedPassword,
        twoFactor,
        captchaToken,
        deviceRequest
      );
    } else if (code != null && codeVerifier != null && redirectUrl != null) {
      return new SsoTokenRequest(
        code,
        codeVerifier,
        redirectUrl,
        twoFactor,
        captchaToken,
        deviceRequest
      );
    } else if (clientId != null && clientSecret != null) {
      return new ApiTokenRequest(clientId, clientSecret, twoFactor, captchaToken, deviceRequest);
    } else {
      throw new Error("No credentials provided.");
    }
  }

  private async saveAccountInformation(
    tokenResponse: IdentityTokenResponse,
    clientId: string,
    clientSecret: string
  ) {
    const accountInformation = await this.tokenService.decodeToken(tokenResponse.accessToken);
    await this.stateService.addAccount({
      profile: {
        ...new AccountProfile(),
        ...{
          userId: accountInformation.sub,
          email: accountInformation.email,
          apiKeyClientId: clientId,
          apiKeyClientSecret: clientSecret,
          hasPremiumPersonally: accountInformation.premium,
          kdfIterations: tokenResponse.kdfIterations,
          kdfType: tokenResponse.kdf,
        },
      },
      tokens: {
        ...new AccountTokens(),
        ...{
          accessToken: tokenResponse.accessToken,
          refreshToken: tokenResponse.refreshToken,
        },
      },
    });
  }

  private async convertNewUserToKeyConnector(tokenResponse: IdentityTokenResponse, orgId: string) {
    const password = await this.cryptoFunctionService.randomBytes(64);

    const k = await this.cryptoService.makeKey(
      Utils.fromBufferToB64(password),
      await this.tokenService.getEmail(),
      tokenResponse.kdf,
      tokenResponse.kdfIterations
    );
    const keyConnectorRequest = new KeyConnectorUserKeyRequest(k.encKeyB64);
    await this.cryptoService.setKey(k);

    const encKey = await this.cryptoService.makeEncKey(k);
    await this.cryptoService.setEncKey(encKey[1].encryptedString);

    const [pubKey, privKey] = await this.cryptoService.makeKeyPair();

    try {
      await this.apiService.postUserKeyToKeyConnector(
        tokenResponse.keyConnectorUrl,
        keyConnectorRequest
      );
    } catch (e) {
      throw new Error("Unable to reach key connector");
    }

    const keys = new KeysRequest(pubKey, privKey.encryptedString);
    const setPasswordRequest = new SetKeyConnectorKeyRequest(
      encKey[1].encryptedString,
      tokenResponse.kdf,
      tokenResponse.kdfIterations,
      orgId,
      keys
    );
    await this.apiService.postSetKeyConnectorKey(setPasswordRequest);
  }

  private async createKeyPair() {
    try {
      const keyPair = await this.cryptoService.makeKeyPair();
      await this.apiService.postAccountKeys(
        new KeysRequest(keyPair[0], keyPair[1].encryptedString)
      );
      return keyPair[1].encryptedString;
    } catch (e) {
      this.logService.error(e);
    }
  }

  private saveState(
    email: string,
    hashedPassword: string,
    localHashedPassword: string,
    code: string,
    codeVerifier: string,
    redirectUrl: string,
    clientId: string,
    clientSecret: string,
    key: SymmetricCryptoKey,
    twoFactorProviders: Map<TwoFactorProviderType, { [key: string]: string }>
  ) {
    this.email = email;
    this.masterPasswordHash = hashedPassword;
    this.localMasterPasswordHash = localHashedPassword;
    this.code = code;
    this.codeVerifier = codeVerifier;
    this.ssoRedirectUrl = redirectUrl;
    this.clientId = clientId;
    this.clientSecret = clientSecret;
    this.key = this.setCryptoKeys ? key : null;
    this.twoFactorService.setProviders(twoFactorProviders);
  }

  private clearState(): void {
    this.key = null;
    this.email = null;
    this.masterPasswordHash = null;
    this.localMasterPasswordHash = null;
    this.code = null;
    this.codeVerifier = null;
    this.ssoRedirectUrl = null;
    this.clientId = null;
    this.clientSecret = null;
    this.twoFactorService.clearProviders();
    this.twoFactorService.clearSelectedProvider();
  }

  private isNewSsoUser(code: string, key: string) {
    return code != null && key == null;
  }
}
