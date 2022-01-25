import { Arg, Substitute, SubstituteOf } from "@fluffy-spoon/substitute";

import { ApiService } from "jslib-common/abstractions/api.service";
import { AppIdService } from "jslib-common/abstractions/appId.service";
import { AuthService } from "jslib-common/abstractions/auth.service";
import { CryptoService } from "jslib-common/abstractions/crypto.service";
import { EnvironmentService } from "jslib-common/abstractions/environment.service";
import { KeyConnectorService } from "jslib-common/abstractions/keyConnector.service";
import { LogService } from "jslib-common/abstractions/log.service";
import { MessagingService } from "jslib-common/abstractions/messaging.service";
import { PlatformUtilsService } from "jslib-common/abstractions/platformUtils.service";
import { StateService } from "jslib-common/abstractions/state.service";
import { TokenService } from "jslib-common/abstractions/token.service";

import { SsoLogInDelegate } from "jslib-common/misc/logInDelegate/ssoLogin.delegate";

import { Utils } from "jslib-common/misc/utils";

import { TwoFactorService } from "jslib-common/abstractions/twoFactor.service";

import { identityTokenResponseFactory } from "./logIn.delegate.spec";

describe("SsoLogInDelegate", () => {
  let cryptoService: SubstituteOf<CryptoService>;
  let apiService: SubstituteOf<ApiService>;
  let tokenService: SubstituteOf<TokenService>;
  let appIdService: SubstituteOf<AppIdService>;
  let platformUtilsService: SubstituteOf<PlatformUtilsService>;
  let messagingService: SubstituteOf<MessagingService>;
  let logService: SubstituteOf<LogService>;
  let environmentService: SubstituteOf<EnvironmentService>;
  let keyConnectorService: SubstituteOf<KeyConnectorService>;
  let stateService: SubstituteOf<StateService>;
  let twoFactorService: SubstituteOf<TwoFactorService>;
  let authService: SubstituteOf<AuthService>;
  const setCryptoKeys = true;

  let ssoLogInDelegate: SsoLogInDelegate;

  const deviceId = Utils.newGuid();
  const encKey = "ENC_KEY";
  const privateKey = "PRIVATE_KEY";
  const keyConnectorUrl = "KEY_CONNECTOR_URL";
  const kdf = 0;
  const kdfIterations = 10000;

  const ssoCode = "SSO_CODE";
  const ssoCodeVerifier = "SSO_CODE_VERIFIER";
  const ssoRedirectUrl = "SSO_REDIRECT_URL";
  const ssoOrgId = "SSO_ORG_ID";

  beforeEach(async () => {
    cryptoService = Substitute.for<CryptoService>();
    apiService = Substitute.for<ApiService>();
    tokenService = Substitute.for<TokenService>();
    appIdService = Substitute.for<AppIdService>();
    platformUtilsService = Substitute.for<PlatformUtilsService>();
    messagingService = Substitute.for<MessagingService>();
    logService = Substitute.for<LogService>();
    environmentService = Substitute.for<EnvironmentService>();
    stateService = Substitute.for<StateService>();
    keyConnectorService = Substitute.for<KeyConnectorService>();
    twoFactorService = Substitute.for<TwoFactorService>();
    authService = Substitute.for<AuthService>();

    tokenService.getTwoFactorToken().resolves(null);
    appIdService.getAppId().resolves(deviceId);

    ssoLogInDelegate = await SsoLogInDelegate.new(
      cryptoService,
      apiService,
      tokenService,
      appIdService,
      platformUtilsService,
      messagingService,
      logService,
      stateService,
      setCryptoKeys,
      twoFactorService,
      keyConnectorService,
      ssoCode,
      ssoCodeVerifier,
      ssoRedirectUrl,
      ssoOrgId
    );
  });

  it("sends SSO information to server", async () => {
    apiService.postIdentityToken(Arg.any()).resolves(identityTokenResponseFactory());

    await ssoLogInDelegate.logIn();

    apiService.received(1).postIdentityToken(
      Arg.is((actual) => {
        const ssoTokenRequest = actual as any;
        return (
          ssoTokenRequest.code === ssoCode &&
          ssoTokenRequest.codeVerifier === ssoCodeVerifier &&
          ssoTokenRequest.redirectUri === ssoRedirectUrl &&
          ssoTokenRequest.device.identifier === deviceId &&
          ssoTokenRequest.twoFactor.provider == null &&
          ssoTokenRequest.twoFactor.token == null
        );
      })
    );
  });

  it("does not set keys for new SSO user flow", async () => {
    const tokenResponse = identityTokenResponseFactory();
    tokenResponse.key = null;
    apiService.postIdentityToken(Arg.any()).resolves(tokenResponse);

    await ssoLogInDelegate.logIn();

    cryptoService.didNotReceive().setEncPrivateKey(privateKey);
    cryptoService.didNotReceive().setEncKey(encKey);
  });

  it("gets and sets KeyConnector key for enrolled user", async () => {
    const tokenResponse = identityTokenResponseFactory();
    tokenResponse.keyConnectorUrl = keyConnectorUrl;

    apiService.postIdentityToken(Arg.any()).resolves(tokenResponse);

    await ssoLogInDelegate.logIn();

    keyConnectorService.received(1).getAndSetKey(keyConnectorUrl);
  });

  it("converts new SSO user to Key Connector on first login", async () => {
    const tokenResponse = identityTokenResponseFactory();
    tokenResponse.keyConnectorUrl = keyConnectorUrl;
    tokenResponse.key = null;

    apiService.postIdentityToken(Arg.any()).resolves(tokenResponse);

    await ssoLogInDelegate.logIn();

    keyConnectorService
      .received(1)
      .convertNewSsoUserToKeyConnector(kdf, kdfIterations, keyConnectorUrl, ssoOrgId);
  });
});
