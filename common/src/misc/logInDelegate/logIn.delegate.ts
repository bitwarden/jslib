import { TwoFactorProviderType } from "../../enums/twoFactorProviderType";

import { Account, AccountProfile, AccountTokens } from "../../models/domain/account";
import { AuthResult } from "../../models/domain/authResult";

import { DeviceRequest } from "../../models/request/deviceRequest";
import { KeysRequest } from "../../models/request/keysRequest";

import { ApiTokenRequest } from "../../models/request/identityToken/apiTokenRequest";
import { PasswordTokenRequest } from "../../models/request/identityToken/passwordTokenRequest";
import { SsoTokenRequest } from "../../models/request/identityToken/ssoTokenRequest";
import { TokenRequestTwoFactor } from "../../models/request/identityToken/tokenRequest";

import { IdentityTokenResponse } from "../../models/response/identityTokenResponse";
import { IdentityTwoFactorResponse } from "../../models/response/identityTwoFactorResponse";

import { ApiService } from "../../abstractions/api.service";
import { AppIdService } from "../../abstractions/appId.service";
import { CryptoService } from "../../abstractions/crypto.service";
import { LogService } from "../../abstractions/log.service";
import { MessagingService } from "../../abstractions/messaging.service";
import { PlatformUtilsService } from "../../abstractions/platformUtils.service";
import { StateService } from "../../abstractions/state.service";
import { TokenService } from "../../abstractions/token.service";

import { TwoFactorService } from "../../abstractions/twoFactor.service";
import { IdentityCaptchaResponse } from "../../models/response/identityCaptchaResponse";

export abstract class LogInDelegate {
  protected abstract tokenRequest: ApiTokenRequest | PasswordTokenRequest | SsoTokenRequest;

  constructor(
    protected cryptoService: CryptoService,
    protected apiService: ApiService,
    protected tokenService: TokenService,
    protected appIdService: AppIdService,
    protected platformUtilsService: PlatformUtilsService,
    private messagingService: MessagingService,
    private logService: LogService,
    protected stateService: StateService,
    protected twoFactorService: TwoFactorService,
    protected setCryptoKeys = true
  ) {}

  abstract onSuccessfulLogin(
    response: IdentityTokenResponse | IdentityTwoFactorResponse | IdentityTokenResponse
  ): Promise<void>;

  async logIn(): Promise<AuthResult> {
    this.twoFactorService.clearSelectedProvider();

    const response = await this.apiService.postIdentityToken(this.tokenRequest);

    return this.processTokenResponse(response);
  }

  async logInTwoFactor(twoFactor: TokenRequestTwoFactor): Promise<AuthResult> {
    this.tokenRequest.setTwoFactor(twoFactor);
    return this.logIn();
  }

  protected async processTokenResponse(
    response: IdentityTokenResponse | IdentityTwoFactorResponse | IdentityCaptchaResponse
  ): Promise<AuthResult> {
    const result = new AuthResult();

    result.captchaSiteKey = (response as IdentityCaptchaResponse).siteKey;
    if (result.requiresCaptcha) {
      return result;
    }

    result.twoFactorProviders = (response as IdentityTwoFactorResponse).twoFactorProviders2;
    if (result.requiresTwoFactor) {
      this.twoFactorService.setProviders(result.twoFactorProviders);
      return result;
    }

    const tokenResponse = response as IdentityTokenResponse;
    result.resetMasterPassword = tokenResponse.resetMasterPassword;
    result.forcePasswordReset = tokenResponse.forcePasswordReset;

    await this.saveAccountInformation(tokenResponse);

    if (tokenResponse.twoFactorToken != null) {
      await this.tokenService.setTwoFactorToken(tokenResponse.twoFactorToken);
    }

    const newSsoUser = tokenResponse.key == null;
    if (this.setCryptoKeys && !newSsoUser) {
      await this.cryptoService.setEncKey(tokenResponse.key);
      await this.cryptoService.setEncPrivateKey(
        tokenResponse.privateKey ?? (await this.createKeyPairForOldAccount())
      );
    }

    await this.onSuccessfulLogin(tokenResponse);

    await this.stateService.setBiometricLocked(false);
    this.messagingService.send("loggedIn");

    return result;
  }

  protected async buildDeviceRequest() {
    const appId = await this.appIdService.getAppId();
    return new DeviceRequest(appId, this.platformUtilsService);
  }

  protected async buildTwoFactor(userProvidedTwoFactor: TokenRequestTwoFactor) {
    if (userProvidedTwoFactor != null) {
      return userProvidedTwoFactor;
    }

    const storedTwoFactorToken = await this.tokenService.getTwoFactorToken();
    if (storedTwoFactorToken != null) {
      return {
        token: storedTwoFactorToken,
        provider: TwoFactorProviderType.Remember,
        remember: false,
      };
    }

    return {
      token: null,
      provider: null,
      remember: false,
    };
  }

  protected async saveAccountInformation(tokenResponse: IdentityTokenResponse) {
    const accountInformation = await this.tokenService.decodeToken(tokenResponse.accessToken);
    await this.stateService.addAccount(
      new Account({
        profile: {
          ...new AccountProfile(),
          ...{
            userId: accountInformation.sub,
            email: accountInformation.email,
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
      })
    );
  }

  private async createKeyPairForOldAccount() {
    try {
      const [publicKey, privateKey] = await this.cryptoService.makeKeyPair();
      await this.apiService.postAccountKeys(
        new KeysRequest(publicKey, privateKey.encryptedString)
      );
      return keyPair[1].encryptedString;
    } catch (e) {
      this.logService.error(e);
    }
  }
}
