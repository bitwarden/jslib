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

import { PasswordLogInDelegate } from "jslib-common/services/logInDelegate/passwordLogin.delegate";

import { Utils } from "jslib-common/misc/utils";

import { SymmetricCryptoKey } from "jslib-common/models/domain/symmetricCryptoKey";

import { IdentityTokenResponse } from "jslib-common/models/response/identityTokenResponse";

import { TwoFactorService } from "jslib-common/abstractions/twoFactor.service";
import { HashPurpose } from "jslib-common/enums/hashPurpose";

describe("PasswordLogInDelegate", () => {
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

  let passwordLogInDelegate: PasswordLogInDelegate;

  const email = "hello@world.com";
  const masterPassword = "password";
  const hashedPassword = "HASHED_PASSWORD";
  const localHashedPassword = "LOCAL_HASHED_PASSWORD";
  const preloginKey = new SymmetricCryptoKey(
    Utils.fromB64ToArray(
      "N2KWjlLpfi5uHjv+YcfUKIpZ1l+W+6HRensmIqD+BFYBf6N/dvFpJfWwYnVBdgFCK2tJTAIMLhqzIQQEUmGFgg=="
    )
  );
  const deviceId = Utils.newGuid();
  const accessToken = "ACCESS_TOKEN";
  const refreshToken = "REFRESH_TOKEN";
  const encKey = "ENC_KEY";
  const privateKey = "PRIVATE_KEY";
  const kdf = 0;
  const kdfIterations = 10000;
  const userId = Utils.newGuid();

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

    passwordLogInDelegate = new PasswordLogInDelegate(
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
      authService
    );

    appIdService.getAppId().resolves(deviceId);
  });

  beforeEach(() => {
    authService.makePreloginKey(Arg.any(), Arg.any()).resolves(preloginKey);
    cryptoService.hashPassword(masterPassword, Arg.any()).resolves(hashedPassword);
    cryptoService
      .hashPassword(masterPassword, Arg.any(), HashPurpose.LocalAuthorization)
      .resolves(localHashedPassword);
  });

  it("sends master password credentials to the server", async () => {
    tokenService.getTwoFactorToken().resolves(null);

    await passwordLogInDelegate.init(email, masterPassword);
    const result = await passwordLogInDelegate.logIn();

    apiService.received(1).postIdentityToken(
      Arg.is((actual) => {
        const passwordTokenRequest = actual as any; // Need to access private fields
        return (
          passwordTokenRequest.email === email &&
          passwordTokenRequest.masterPasswordHash === hashedPassword &&
          passwordTokenRequest.device.identifier === deviceId &&
          passwordTokenRequest.twoFactor.provider == null &&
          passwordTokenRequest.twoFactor.token == null &&
          passwordTokenRequest.captchaResponse == null
        );
      })
    );
  });

  it("sets the local environment after a successful login", async () => {
    apiService.postIdentityToken(Arg.any()).resolves(newTokenResponse());
    tokenService.getTwoFactorToken().resolves(null);

    await passwordLogInDelegate.init(email, masterPassword);
    await passwordLogInDelegate.logIn();

    cryptoService.received(1).setKey(preloginKey);
    cryptoService.received(1).setKeyHash(localHashedPassword);
  });

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
