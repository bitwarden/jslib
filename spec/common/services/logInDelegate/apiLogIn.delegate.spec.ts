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

import { ApiLogInDelegate } from "jslib-common/services/logInDelegate/apiLogin.delegate";

import { Utils } from "jslib-common/misc/utils";

import { IdentityTokenResponse } from "jslib-common/models/response/identityTokenResponse";

import { TwoFactorService } from "jslib-common/abstractions/twoFactor.service";

describe("ApiLogInDelegate", () => {
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

  let apiLogInDelegate: ApiLogInDelegate;

  const email = "hello@world.com";

  const deviceId = Utils.newGuid();
  const accessToken = "ACCESS_TOKEN";
  const refreshToken = "REFRESH_TOKEN";
  const encKey = "ENC_KEY";
  const privateKey = "PRIVATE_KEY";
  const keyConnectorUrl = "KEY_CONNECTOR_URL";
  const kdf = 0;
  const kdfIterations = 10000;
  const userId = Utils.newGuid();

  const decodedToken = {
    sub: userId,
    email: email,
    premium: false,
  };

  const apiClientId = "API_CLIENT_ID";
  const apiClientSecret = "API_CLIENT_SECRET";

  beforeEach(() => {
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

    apiLogInDelegate = new ApiLogInDelegate(
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
      environmentService,
      keyConnectorService
    );

    appIdService.getAppId().resolves(deviceId);
  });

  it("sends api key credentials to the server", async () => {
    tokenService.getTwoFactorToken().resolves(null);

    await apiLogInDelegate.init(apiClientId, apiClientSecret);
    await apiLogInDelegate.logIn();

    apiService.received(1).postIdentityToken(
      Arg.is((actual) => {
        const apiTokenRequest = actual as any;
        return (
          apiTokenRequest.clientId === apiClientId &&
          apiTokenRequest.clientSecret === apiClientSecret &&
          apiTokenRequest.device.identifier === deviceId &&
          apiTokenRequest.twoFactor.provider == null &&
          apiTokenRequest.twoFactor.token == null &&
          apiTokenRequest.captchaResponse == null
        );
      })
    );
  });

  it("sets the local environment after a successful login", async () => {
    apiService.postIdentityToken(Arg.any()).resolves(newTokenResponse());
    tokenService.getTwoFactorToken().resolves(null);

    await apiLogInDelegate.init(apiClientId, apiClientSecret);
    await apiLogInDelegate.logIn();

    stateService.received(1).setApiKeyClientId(apiClientId);
    stateService.received(1).setApiKeyClientSecret(apiClientSecret);
    stateService.received(1).addAccount(Arg.any());
  });

  it("gets and sets the Key Connector key if required", async () => {
    const tokenResponse = newTokenResponse();
    tokenResponse.apiUseKeyConnector = true;

    apiService.postIdentityToken(Arg.any()).resolves(tokenResponse);
    tokenService.getTwoFactorToken().resolves(null);
    environmentService.getKeyConnectorUrl().returns(keyConnectorUrl);

    await apiLogInDelegate.init(apiClientId, apiClientSecret);
    await apiLogInDelegate.logIn();

    keyConnectorService.received(1).getAndSetKey(keyConnectorUrl);
  });

  // Helper functions

  function newTokenResponse() {
    const tokenResponse = new IdentityTokenResponse({});
    (tokenResponse as any).twoFactorProviders2 = null;
    (tokenResponse as any).siteKey = undefined;
    tokenResponse.resetMasterPassword = false;
    tokenResponse.forcePasswordReset = false;
    tokenResponse.accessToken = accessToken;
    tokenResponse.refreshToken = refreshToken;
    tokenResponse.kdf = kdf;
    tokenResponse.kdfIterations = kdfIterations;
    tokenResponse.key = encKey;
    tokenResponse.privateKey = privateKey;
    return tokenResponse;
  }
});
