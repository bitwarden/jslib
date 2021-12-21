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

import { AuthService } from "jslib-common/services/auth.service";

import { Utils } from "jslib-common/misc/utils";

import { Account, AccountProfile, AccountTokens } from "jslib-common/models/domain/account";
import { AuthResult } from "jslib-common/models/domain/authResult";
import { SymmetricCryptoKey } from "jslib-common/models/domain/symmetricCryptoKey";

import { IdentityTokenResponse } from "jslib-common/models/response/identityTokenResponse";

import { TwoFactorService } from "jslib-common/abstractions/twoFactor.service";
import { HashPurpose } from "jslib-common/enums/hashPurpose";
import { TwoFactorProviderType } from "jslib-common/enums/twoFactorProviderType";
import { DeviceRequest } from "jslib-common/models/request/deviceRequest";
import { PasswordTokenRequest } from "jslib-common/models/request/identityToken/passwordTokenRequest";

describe("Cipher Service", () => {
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

  let authService: AuthService;

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
  const keyConnectorUrl = "KEY_CONNECTOR_URL";
  const kdf = 0;
  const kdfIterations = 10000;
  const userId = Utils.newGuid();

  const decodedToken = {
    sub: userId,
    email: email,
    premium: false,
  };

  const ssoCode = "SSO_CODE";
  const ssoCodeVerifier = "SSO_CODE_VERIFIER";
  const ssoRedirectUrl = "SSO_REDIRECT_URL";
  const ssoOrgId = "SSO_ORG_ID";

  const twoFactorProviderType = TwoFactorProviderType.Authenticator;
  const twoFactorToken = "TWO_FACTOR_TOKEN";
  const twoFactorRemember = true;

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

    authService = new AuthService(
      cryptoService,
      apiService,
      tokenService,
      appIdService,
      platformUtilsService,
      messagingService,
      logService,
      keyConnectorService,
      environmentService,
      stateService,
      twoFactorService,
      setCryptoKeys
    );

    appIdService.getAppId().resolves(deviceId);
    tokenService.decodeToken(accessToken).resolves(decodedToken);
  });

  describe("Master Password authentication", () => {
    beforeEach(() => {
      passwordLogInSetup();
    });

    it("works in simple cases (e.g. no 2FA, no captcha)", async () => {
      // Arrange
      apiService.postIdentityToken(Arg.any()).resolves(newTokenResponse());
      tokenService.getTwoFactorToken().resolves(null);

      // Act
      const result = await authService.logIn(email, masterPassword);

      // Assert
      // Api call:
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

      // Sets local environment:
      commonSuccessAssertions();
      cryptoService.received(1).setKey(preloginKey);
      cryptoService.received(1).setKeyHash(localHashedPassword);
      cryptoService.received(1).setEncKey(encKey);
      cryptoService.received(1).setEncPrivateKey(privateKey);

      // Negative tests
      apiService.didNotReceive().postAccountKeys(Arg.any()); // Did not generate new private key pair
      keyConnectorService.didNotReceive().getAndSetKey(Arg.any()); // Did not fetch Key Connector key
      keyConnectorService.didNotReceive().convertNewSsoUserToKeyConnector(Arg.all()); // Did not send key to Key Connector
      tokenService.didNotReceive().setTwoFactorToken(Arg.any()); // Did not save 2FA token

      // Return result:
      const expected = buildAuthResponse();
      expect(result).toEqual(expected);
    });

    it("rejects login if CAPTCHA is required", async () => {
      // Arrange
      const siteKey = "CAPTCHA_SITE_KEY";
      const tokenResponse = newTokenResponse();
      (tokenResponse as any).siteKey = siteKey;

      apiService.postIdentityToken(Arg.any()).resolves(tokenResponse);

      // Act
      const result = await authService.logIn(email, masterPassword);

      // Assert
      stateService.didNotReceive().addAccount(Arg.any());
      messagingService.didNotReceive().send(Arg.any());

      const expected = new AuthResult();
      expected.captchaSiteKey = siteKey;
      expect(result).toEqual(expected);
    });

    it("does not set crypto keys if setCryptoKeys is false", async () => {
      // Arrange
      apiService.postIdentityToken(Arg.any()).resolves(newTokenResponse());

      // Re-init authService with setCryptoKeys = false
      authService = new AuthService(
        cryptoService,
        apiService,
        tokenService,
        appIdService,
        platformUtilsService,
        messagingService,
        logService,
        keyConnectorService,
        environmentService,
        stateService,
        twoFactorService,
        false
      );

      // Act
      await authService.logIn(email, masterPassword);

      // Assertions
      commonSuccessAssertions();
      cryptoService.didNotReceive().setKey(Arg.any());
      cryptoService.didNotReceive().setKeyHash(Arg.any());
      cryptoService.didNotReceive().setEncKey(Arg.any());
      cryptoService.didNotReceive().setEncPrivateKey(Arg.any());
    });

    it("makes a new public and private key for an old account", async () => {
      const tokenResponse = newTokenResponse();
      tokenResponse.privateKey = null;

      apiService.postIdentityToken(Arg.any()).resolves(tokenResponse);

      await authService.logIn(email, masterPassword);

      commonSuccessAssertions();
      apiService.received(1).postAccountKeys(Arg.any());
    });
  });

  // SSO tests
  describe("Single sign-on authentication", () => {
    it("handles authentication with SSO in simple cases", async () => {
      // Arrange
      apiService.postIdentityToken(Arg.any()).resolves(newTokenResponse());
      tokenService.getTwoFactorToken().resolves(null);

      // Act
      const result = await authService.logInSso(ssoCode, ssoCodeVerifier, ssoRedirectUrl, ssoOrgId);

      // Assert
      // Api call:
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

      // Sets local environment:
      commonSuccessAssertions();
      cryptoService.received(1).setEncPrivateKey(privateKey);
      cryptoService.received(1).setEncKey(encKey);

      // Negative tests
      cryptoService.didNotReceive().setKey(preloginKey); // Not set by SSO
      cryptoService.didNotReceive().setKeyHash(localHashedPassword); // Not set by SSO
      apiService.didNotReceive().postAccountKeys(Arg.any()); // Did not generate new private key pair
      keyConnectorService.didNotReceive().getAndSetKey(Arg.any()); // Did not fetch Key Connector key
      keyConnectorService.didNotReceive().convertNewSsoUserToKeyConnector(Arg.all()); // Did not send key to Key Connector
      tokenService.didNotReceive().setTwoFactorToken(Arg.any()); // Did not save 2FA token

      // Return result:
      const expected = buildAuthResponse();
      expect(result).toEqual(expected);
    });

    it("does not set keys for new SSO user flow", async () => {
      const tokenResponse = newTokenResponse();
      tokenResponse.key = null;
      apiService.postIdentityToken(Arg.any()).resolves(tokenResponse);

      await authService.logInSso(ssoCode, ssoCodeVerifier, ssoRedirectUrl, ssoOrgId);

      cryptoService.didNotReceive().setEncPrivateKey(privateKey);
      cryptoService.didNotReceive().setEncKey(encKey);
    });

    it("gets and sets KeyConnector key for enrolled user", async () => {
      const tokenResponse = newTokenResponse();
      tokenResponse.keyConnectorUrl = keyConnectorUrl;

      apiService.postIdentityToken(Arg.any()).resolves(tokenResponse);

      await authService.logInSso(ssoCode, ssoCodeVerifier, ssoRedirectUrl, ssoOrgId);

      commonSuccessAssertions();
      keyConnectorService.received(1).getAndSetKey(keyConnectorUrl);
    });

    it("converts new SSO user to Key Connector on first login", async () => {
      const tokenResponse = newTokenResponse();
      tokenResponse.keyConnectorUrl = keyConnectorUrl;
      tokenResponse.key = null;

      apiService.postIdentityToken(Arg.any()).resolves(tokenResponse);

      await authService.logInSso(ssoCode, ssoCodeVerifier, ssoRedirectUrl, ssoOrgId);

      commonSuccessAssertions();
      keyConnectorService
        .received(1)
        .convertNewSsoUserToKeyConnector(kdf, kdfIterations, keyConnectorUrl, ssoOrgId);
    });
  });

  describe("Api Key authentication", () => {
    it("works in simple cases", async () => {
      apiService.postIdentityToken(Arg.any()).resolves(newTokenResponse());
      tokenService.getTwoFactorToken().resolves(null);

      const result = await authService.logInApiKey(apiClientId, apiClientSecret);

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

      // Sets local environment:
      stateService.received(1).setApiKeyClientId(apiClientId);
      stateService.received(1).setApiKeyClientSecret(apiClientSecret);
      commonSuccessAssertions();

      cryptoService.received(1).setEncKey(encKey);
      cryptoService.received(1).setEncPrivateKey(privateKey);

      // Negative tests
      apiService.didNotReceive().postAccountKeys(Arg.any()); // Did not generate new private key pair
      keyConnectorService.didNotReceive().getAndSetKey(Arg.any()); // Did not fetch Key Connector key
      keyConnectorService.didNotReceive().convertNewSsoUserToKeyConnector(Arg.all()); // Did not send key to Key Connector
      tokenService.didNotReceive().setTwoFactorToken(Arg.any()); // Did not save 2FA token

      // Return result:
      const expected = buildAuthResponse();
      expect(result).toEqual(expected);
    });
  });

  describe("Two-factor authentication", () => {
    beforeEach(() => {
      passwordLogInSetup();
    });

    it("rejects login if 2FA is required", async () => {
      const twoFactorProviders = new Map<number, null>([[1, null]]);
      const tokenResponse = newTokenResponse();
      (tokenResponse as any).twoFactorProviders2 = twoFactorProviders;

      apiService.postIdentityToken(Arg.any()).resolves(tokenResponse);

      const result = await authService.logIn(email, masterPassword);

      stateService.didNotReceive().addAccount(Arg.any());
      messagingService.didNotReceive().send(Arg.any());

      const expected = new AuthResult();
      expected.twoFactorProviders = twoFactorProviders;
      expected.captchaSiteKey = undefined;
      expect(result).toEqual(expected);
    });

    it("uses stored 2FA token", async () => {
      tokenService.getTwoFactorToken().resolves(twoFactorToken);

      await authService.logIn(email, masterPassword);

      apiService.received(1).postIdentityToken(
        Arg.is((actual) => {
          const passwordTokenRequest = actual as any;
          return (
            passwordTokenRequest.email === email &&
            passwordTokenRequest.masterPasswordHash === hashedPassword &&
            passwordTokenRequest.device.identifier === deviceId &&
            passwordTokenRequest.twoFactor.provider === TwoFactorProviderType.Remember &&
            passwordTokenRequest.twoFactor.token === twoFactorToken &&
            passwordTokenRequest.twoFactor.remember === false &&
            passwordTokenRequest.captchaResponse == null
          );
        })
      );
    });

    it("uses 2FA token entered by user at the same time as the Master Password", async () => {
      passwordLogInSetup();

      await authService.logIn(email, masterPassword, {
        provider: twoFactorProviderType,
        token: twoFactorToken,
        remember: twoFactorRemember,
      });

      apiService.received(1).postIdentityToken(
        Arg.is((actual) => {
          const passwordTokenRequest = actual as any;
          return (
            passwordTokenRequest.email === email &&
            passwordTokenRequest.masterPasswordHash === hashedPassword &&
            passwordTokenRequest.device.identifier === deviceId &&
            passwordTokenRequest.twoFactor.provider === twoFactorProviderType &&
            passwordTokenRequest.twoFactor.token === twoFactorToken &&
            passwordTokenRequest.twoFactor.remember === twoFactorRemember &&
            passwordTokenRequest.captchaResponse == null
          );
        })
      );
    });

    it("logInTwoFactor: uses 2FA token entered by user from the 2FA page", async () => {
      (authService as any).savedTokenRequest = new PasswordTokenRequest(
        email,
        hashedPassword,
        null,
        null,
        {
          identifier: deviceId,
        } as DeviceRequest
      );

      await authService.logInTwoFactor({
        provider: twoFactorProviderType,
        token: twoFactorToken,
        remember: twoFactorRemember,
      });

      apiService.received(1).postIdentityToken(
        Arg.is((actual) => {
          const passwordTokenRequest = actual as any;
          return (
            passwordTokenRequest.email === email &&
            passwordTokenRequest.masterPasswordHash === hashedPassword &&
            passwordTokenRequest.device.identifier === deviceId &&
            passwordTokenRequest.twoFactor.provider === twoFactorProviderType &&
            passwordTokenRequest.twoFactor.token === twoFactorToken &&
            passwordTokenRequest.twoFactor.remember === twoFactorRemember &&
            passwordTokenRequest.captchaResponse == null
          );
        })
      );
    });
  });

  // Helper functions

  function passwordLogInSetup() {
    cryptoService.makeKey(masterPassword, email, Arg.any(), Arg.any()).resolves(preloginKey);
    cryptoService.hashPassword(masterPassword, Arg.any()).resolves(hashedPassword);
    cryptoService
      .hashPassword(masterPassword, Arg.any(), HashPurpose.LocalAuthorization)
      .resolves(localHashedPassword);
  }

  function commonSuccessAssertions() {
    stateService.received(1).addAccount(
      new Account({
        profile: {
          ...new AccountProfile(),
          ...{
            userId: userId,
            email: email,
            hasPremiumPersonally: false,
            kdfIterations: kdfIterations,
            kdfType: kdf,
          },
        },
        tokens: {
          ...new AccountTokens(),
          ...{
            accessToken: accessToken,
            refreshToken: refreshToken,
          },
        },
      })
    );
    stateService.received(1).setBiometricLocked(false);
    messagingService.received(1).send("loggedIn");
  }

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

  function buildAuthResponse() {
    const expected = new AuthResult();
    expected.forcePasswordReset = false;
    expected.resetMasterPassword = false;
    expected.twoFactorProviders = null;
    expected.captchaSiteKey = undefined;
    return expected;
  }
});
