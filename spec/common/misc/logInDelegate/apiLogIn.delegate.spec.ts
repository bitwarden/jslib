import { Arg, Substitute, SubstituteOf } from "@fluffy-spoon/substitute";

import { ApiService } from "jslib-common/abstractions/api.service";
import { AppIdService } from "jslib-common/abstractions/appId.service";
import { CryptoService } from "jslib-common/abstractions/crypto.service";
import { EnvironmentService } from "jslib-common/abstractions/environment.service";
import { KeyConnectorService } from "jslib-common/abstractions/keyConnector.service";
import { LogService } from "jslib-common/abstractions/log.service";
import { MessagingService } from "jslib-common/abstractions/messaging.service";
import { PlatformUtilsService } from "jslib-common/abstractions/platformUtils.service";
import { StateService } from "jslib-common/abstractions/state.service";
import { TokenService } from "jslib-common/abstractions/token.service";
import { TwoFactorService } from "jslib-common/abstractions/twoFactor.service";

import { ApiLogInDelegate } from "jslib-common/misc/logInDelegate/apiLogin.delegate";

import { Utils } from "jslib-common/misc/utils";

import { tokenResponseFactory } from "./logIn.delegate.spec";

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
  const setCryptoKeys = true;

  let apiLogInDelegate: ApiLogInDelegate;

  const deviceId = Utils.newGuid();
  const keyConnectorUrl = "KEY_CONNECTOR_URL";
  const apiClientId = "API_CLIENT_ID";
  const apiClientSecret = "API_CLIENT_SECRET";

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

    appIdService.getAppId().resolves(deviceId);
    tokenService.getTwoFactorToken().resolves(null);

    apiLogInDelegate = await ApiLogInDelegate.new(
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
      keyConnectorService,
      apiClientId,
      apiClientSecret
    );
  });

  it("sends api key credentials to the server", async () => {
    await apiLogInDelegate.logIn();

    apiService.received(1).postIdentityToken(
      Arg.is((actual) => {
        const apiTokenRequest = actual as any;
        console.log(apiTokenRequest.device.identifier);
        console.log(apiTokenRequest.twoFactor.provider);
        console.log(apiTokenRequest.twoFactor.token);
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
    apiService.postIdentityToken(Arg.any()).resolves(tokenResponseFactory());

    await apiLogInDelegate.logIn();

    stateService.received(1).setApiKeyClientId(apiClientId);
    stateService.received(1).setApiKeyClientSecret(apiClientSecret);
    stateService.received(1).addAccount(Arg.any());
  });

  it("gets and sets the Key Connector key if required", async () => {
    const tokenResponse = tokenResponseFactory();
    tokenResponse.apiUseKeyConnector = true;

    apiService.postIdentityToken(Arg.any()).resolves(tokenResponse);
    environmentService.getKeyConnectorUrl().returns(keyConnectorUrl);

    await apiLogInDelegate.logIn();

    keyConnectorService.received(1).getAndSetKey(keyConnectorUrl);
  });
});
