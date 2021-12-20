import { Arg, Substitute, SubstituteOf } from "@fluffy-spoon/substitute";

import { ApiService } from "jslib-common/abstractions/api.service";
import { AppIdService } from "jslib-common/abstractions/appId.service";
import { CryptoService } from "jslib-common/abstractions/crypto.service";
import { CryptoFunctionService } from "jslib-common/abstractions/cryptoFunction.service";
import { EnvironmentService } from "jslib-common/abstractions/environment.service";
import { KeyConnectorService } from "jslib-common/abstractions/keyConnector.service";
import { LogService } from "jslib-common/abstractions/log.service";
import { MessagingService } from "jslib-common/abstractions/messaging.service";
import { PlatformUtilsService } from "jslib-common/abstractions/platformUtils.service";
import { StateService } from "jslib-common/abstractions/state.service";
import { TokenService } from "jslib-common/abstractions/token.service";

import { AuthService } from "jslib-common/services/auth.service";

import { Utils } from "jslib-common/misc/utils";

import { AccountProfile, AccountTokens } from "jslib-common/models/domain/account";
import { AuthResult } from "jslib-common/models/domain/authResult";
import { EncString } from "jslib-common/models/domain/encString";
import { SymmetricCryptoKey } from "jslib-common/models/domain/symmetricCryptoKey";

import { IdentityTokenResponse } from "jslib-common/models/response/identityTokenResponse";

import { TwoFactorService } from "jslib-common/abstractions/twoFactor.service";
import { HashPurpose } from "jslib-common/enums/hashPurpose";
import { TwoFactorProviderType } from "jslib-common/enums/twoFactorProviderType";
import { PasswordTokenRequest } from "jslib-common/models/request/identityToken/passwordTokenRequest";
import { DeviceRequest } from "jslib-common/models/request/deviceRequest";

describe("Cipher Service", () => {
  let cryptoService: SubstituteOf<CryptoService>;
  let apiService: SubstituteOf<ApiService>;
  let tokenService: SubstituteOf<TokenService>;
  let appIdService: SubstituteOf<AppIdService>;
  let platformUtilsService: SubstituteOf<PlatformUtilsService>;
  let messagingService: SubstituteOf<MessagingService>;
  let logService: SubstituteOf<LogService>;
  let cryptoFunctionService: SubstituteOf<CryptoFunctionService>;
  let environmentService: SubstituteOf<EnvironmentService>;
  let keyConnectorService: SubstituteOf<KeyConnectorService>;
  let stateService: SubstituteOf<StateService>;
  let twoFactorService: SubstituteOf<TwoFactorService>;
  const setCryptoKeys = true;

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

  let authService: AuthService;

  beforeEach(() => {
    cryptoService = Substitute.for<CryptoService>();
    apiService = Substitute.for<ApiService>();
    tokenService = Substitute.for<TokenService>();
    appIdService = Substitute.for<AppIdService>();
    platformUtilsService = Substitute.for<PlatformUtilsService>();
    messagingService = Substitute.for<MessagingService>();
    logService = Substitute.for<LogService>();
    cryptoFunctionService = Substitute.for<CryptoFunctionService>();
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
  });

  function logInSetup() {
    // Arrange for logIn and logInComplete
    cryptoService.makeKey(masterPassword, email, Arg.any(), Arg.any()).resolves(preloginKey);
    cryptoService.hashPassword(masterPassword, Arg.any()).resolves(hashedPassword);
    cryptoService
      .hashPassword(masterPassword, Arg.any(), HashPurpose.LocalAuthorization)
      .resolves(localHashedPassword);
  }

  function commonSetup() {
    // For logInHelper, i.e. always required
    appIdService.getAppId().resolves(deviceId);

    tokenService.decodeToken(accessToken).resolves(decodedToken);
  }

  function commonSuccessAssertions() {
    stateService.received(1).addAccount({
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
    });
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

  function newAuthResponse() {
    const expected = new AuthResult();
    expected.forcePasswordReset = false;
    expected.resetMasterPassword = false;
    expected.twoFactorProviders = null;
    expected.captchaSiteKey = undefined;
    return expected;
  }

  it("logIn: works in the most simple case (no 2FA, no captcha, no password reset, no KC)", async () => {
    logInSetup();
    commonSetup();
    const tokenResponse = newTokenResponse();

    tokenService.getTwoFactorToken().resolves(null);
    apiService.postIdentityToken(Arg.any()).resolves(tokenResponse);

    const expected = newAuthResponse();

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
    keyConnectorService.didNotReceive().convertNewSsoUserToKeyConnector(Arg.all()); // Did not send key to KC
    tokenService.didNotReceive().setTwoFactorToken(Arg.any()); // Did not save 2FA token

    // Return result:
    expect(result).toEqual(expected);
  });

  it("logIn: bails out if captchaSiteKey is true", async () => {
    const siteKey = "CAPTCHA_SITE_KEY";

    logInSetup();
    commonSetup();
    const tokenResponse = newTokenResponse();
    (tokenResponse as any).siteKey = siteKey;

    tokenService.getTwoFactorToken().resolves(null);
    apiService.postIdentityToken(Arg.any()).resolves(tokenResponse);

    const expected = new AuthResult();
    expected.captchaSiteKey = siteKey;

    // Act
    const result = await authService.logIn(email, masterPassword);

    // Assertions
    stateService.didNotReceive().addAccount(Arg.any());
    messagingService.didNotReceive().send(Arg.any());
    expect(result).toEqual(expected);
  });

  it("logIn: does not set crypto keys if setCryptoKeys is false", async () => {
    logInSetup();
    commonSetup();
    const tokenResponse = newTokenResponse();

    tokenService.getTwoFactorToken().resolves(null);
    apiService.postIdentityToken(Arg.any()).resolves(tokenResponse);

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
    const result = await authService.logIn(email, masterPassword);

    // Assertions
    commonSuccessAssertions();
    cryptoService.didNotReceive().setKey(Arg.any());
    cryptoService.didNotReceive().setKeyHash(Arg.any());
    cryptoService.didNotReceive().setEncKey(Arg.any());
    cryptoService.didNotReceive().setEncPrivateKey(Arg.any());
  });

  it("logIn: makes new KeyPair for an old account", async () => {
    logInSetup();
    commonSetup();
    const tokenResponse = newTokenResponse();
    tokenResponse.privateKey = null;

    tokenService.getTwoFactorToken().resolves(null);
    apiService.postIdentityToken(Arg.any()).resolves(tokenResponse);

    const result = await authService.logIn(email, masterPassword);

    commonSuccessAssertions();
    apiService.received(1).postAccountKeys(Arg.any());
  });

  // 2FA

  it("logIn: bails out if 2FA is required", async () => {
    const twoFactorProviders = new Map<number, null>([[1, null]]);

    logInSetup();
    commonSetup();
    const tokenResponse = newTokenResponse();
    (tokenResponse as any).twoFactorProviders2 = twoFactorProviders;

    tokenService.getTwoFactorToken().resolves(null);
    apiService.postIdentityToken(Arg.any()).resolves(tokenResponse);

    const expected = new AuthResult();
    expected.twoFactorProviders = twoFactorProviders;
    expected.captchaSiteKey = undefined;

    const result = await authService.logIn(email, masterPassword);

    stateService.didNotReceive().addAccount(Arg.any());
    messagingService.didNotReceive().send(Arg.any());

    expect(result).toEqual(expected);
  });

  it("logIn: sends stored 2FA token to server", async () => {
    commonSetup();
    logInSetup();

    tokenService.getTwoFactorToken().resolves(twoFactorToken);

    await authService.logIn(email, masterPassword);

    apiService.received(1).postIdentityToken(
      Arg.is((actual) => {
        const passwordTokenRequest = actual as any;
        return (
          passwordTokenRequest.email === email &&
          passwordTokenRequest.masterPasswordHash === hashedPassword &&
          passwordTokenRequest.device.identifier === deviceId &&
          passwordTokenRequest.twoFactor.provider == TwoFactorProviderType.Remember &&
          passwordTokenRequest.twoFactor.token == twoFactorToken &&
          passwordTokenRequest.twoFactor.remember == false &&
          passwordTokenRequest.captchaResponse == null
        );
      })
    );
  });

  it("logIn: sends 2FA token entered by user to server", async () => {
    commonSetup();
    logInSetup();

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
          passwordTokenRequest.twoFactor.provider == twoFactorProviderType &&
          passwordTokenRequest.twoFactor.token == twoFactorToken &&
          passwordTokenRequest.twoFactor.remember == twoFactorRemember &&
          passwordTokenRequest.captchaResponse == null
        );
      })
    );
  });

  it("logInTwoFactor: sends 2FA token to server when using Master Password", async () => {
    commonSetup();

    const tokenRequest = new PasswordTokenRequest(email, hashedPassword, null, null, {
      identifier: deviceId,
    } as DeviceRequest);

    (authService as any).savedTokenRequest = tokenRequest;

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
          passwordTokenRequest.twoFactor.provider == twoFactorProviderType &&
          passwordTokenRequest.twoFactor.token == twoFactorToken &&
          passwordTokenRequest.twoFactor.remember == twoFactorRemember &&
          passwordTokenRequest.captchaResponse == null
        );
      })
    );
  });

  // SSO

  it("logInSso: user can log in with Sso", async () => {
    commonSetup();
    const tokenResponse = newTokenResponse();

    tokenService.getTwoFactorToken().resolves(null);
    apiService.postIdentityToken(Arg.any()).resolves(tokenResponse);

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
    // No keys are returned because SSO (even if we get Key Connector we do that later)
    cryptoService.didNotReceive().setKey(preloginKey);
    cryptoService.didNotReceive().setKeyHash(localHashedPassword);
    apiService.didNotReceive().postAccountKeys(Arg.any()); // Did not generate new private key pair
    keyConnectorService.didNotReceive().getAndSetKey(Arg.any()); // Did not fetch Key Connector key
    keyConnectorService.didNotReceive().convertNewSsoUserToKeyConnector(Arg.all()); // Did not send key to KC
    tokenService.didNotReceive().setTwoFactorToken(Arg.any()); // Did not save 2FA token

    // Return result:
    const expected = newAuthResponse();
    expect(result).toEqual(expected);
  });

  it("logInSso: do not set keys for new SSO user flow", async () => {
    commonSetup();
    const tokenResponse = newTokenResponse();
    tokenResponse.key = null;

    tokenService.getTwoFactorToken().resolves(null);
    apiService.postIdentityToken(Arg.any()).resolves(tokenResponse);

    const result = await authService.logInSso(ssoCode, ssoCodeVerifier, ssoRedirectUrl, ssoOrgId);

    // Assert
    cryptoService.didNotReceive().setEncPrivateKey(privateKey);
    cryptoService.didNotReceive().setEncKey(encKey);
  });

  it("logInSso: gets and sets KeyConnector key for enrolled user", async () => {
    commonSetup();
    const tokenResponse = newTokenResponse();
    tokenResponse.keyConnectorUrl = keyConnectorUrl;

    apiService.postIdentityToken(Arg.any()).resolves(tokenResponse);

    const result = await authService.logInSso(ssoCode, ssoCodeVerifier, ssoRedirectUrl, ssoOrgId);

    commonSuccessAssertions();
    keyConnectorService.received(1).getAndSetKey(keyConnectorUrl);
  });

  it("logInSso: new SSO user with Key Connector posts key to the server", async () => {
    const realEncKey: [SymmetricCryptoKey, EncString] = [
      new SymmetricCryptoKey(Utils.fromB64ToArray("T/tvXd/wvROlTu69qimTod1l7bnYltYOdx1es+xiiEI=")),
      new EncString(
        "2.j/dbf/fUThfQtOPLU5rbBQ==|u82vHRHBkNY4E44hNmv0BIJQx961Tgh7RJ/p2pGytnZckFn8jwu72GG6HMNhvG4+GGwoIEd4GgP+oOFBhqIHXh5niH4wT2kuuyeA22+0VZM=|r1q0wYATeXB4ejUY6CORagAtqwUT246sY+wp46Kj6pY="
      ),
    ];
    const pubKey =
      "MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEApqH10xpM+VyAfjLj1cwLm8ydOx/qZq4UcUji/lJ1+p0In1vs1BPeVa5MjaiCO8zrALfSckUfviFv74p7Eo0e4XwbJljnh5E2FdMLUL3oUjKiqCFZ9obdGzzGh7ImY1rnjAOEXjme/kbfWTeva54cv7SYBSoAK3IuNxJeQh1cICohMI/7VUCwlQgHITZ7dK0oQ/gIb/E7wX4TG5x0g6zjYjhWUjWjBaxkUodgF4d7KLd/d7OhM0EQSWA1oaR8nxEaAuAkB4AMNqQhzfZWNzdGJVYdr1j5cizVnDWPoTCk30kHc/Pffuo1hw7156XxLOiM46K/cgKEk9lHTf9s8bSouQIDAQAB";
    const privKey = new EncString(
      "2.NGK1ka8L+XG32nDAc4u36A==|XbdTogpmevDG2s55ZpJhwVizILBq+oXwIDFmZHXjCVOO2f6Iz1WiVvPvMfp/gqOIVZN770KUYpSiWvwgbuEWr9fKbqaqPUTs188rqMs8C3JWLgRpNeWvc2VNskl+A89lkb2BCHFsOXyxK/IaK85ORpY/PXobWlA1ese7DKqv4iEMjJvMKqPi5xTxLJ1uJGEwqNwOZN021I4RQxDgByYQCmjC2iCIR6rMuSwLRR2a9jwY+CLa/XslxIFkTe8dVzO5o2KXiYwz0UoN82tYxCHz9/8EQfaFI/CPFbE/OQtjN8mfF72i0JtRuYBH9y6yfPFUzYnZpZ7dHSYnF33+pUOALHR1WgJXaHz3VSRQR1yAuoF5ZARtWHn4buw0OXM9tnqcosCQ/BlP9ExN6httJGO6kxZpsbZs+DSCOzAWWxkaVwexE1QGZ+OrbJh8d0lzzlTW5QUukQL5y5cNoaBsF+U2qdb8a16/kxvPr56T9uhUoAfdV6mWyuhc/8Rl7sSMsrVZQ/YINrmjEDtkgFrcgdSxGhTnRJ5lIFDNS5ljyotcj6J8luVvC5gV58vO+AqhN9xTP3f88+Fn0EE5edX7WDqXQdxCGYtjrbGiKuSWXBe/b8NHdYP9t/snfMlR21OAun3Rw3yS/GRvZNPozdtGVPAgMTfy62rCbED6HS1EjNRaYzoL52Ges4uZVhFYxcmFFH4Ol8k8txVYwFihmt8caJHYGmK6m2ryfOkRKaWf0map5BevJYPrmd0WHtcAGmavuPXUYUoeXq14+Fo63lkq6z+YIBLTxTQChglia8sb7qp2Kc2NCs43DDRlmVCXmesedpj5HwrrywC5mGkl9D/Awp7NKcpO3n8kIcupeiRWI6v/Y+uBBebIEpVTBJhKC2klF3azUJRSm6/5i5YRIXQJ4KkzYSQyKeQIOQzCtNwifTtk/NBuPmnXAGS8SNaUToyr1SGCDvPYHtSC91pHYQ4gYKbR5la38xndj/d1id5xmN8fZBvn2G07p0VEPPSjKnzp1vvi3dr6m65acAUoGWVZGhkyy03wrUd8Jd2KqTByeVOTZ9jDTFzXdt00nJQaCJpN5gjaNuT77ESsg+Bot9j0clXvvOQvx1lQPe4EN12TXgCoUpgkEGKqy2cf5sbc5PJm4eYFKjJ8KobCJgpLMWhfmOpK1uB02BcZ9BQJLfAqb1IsZ65w0Z5MwuDI50eUFGUHccfdrgmS/Gf/BvK4nJOQFMeaOOEGEFp2TG4DU71Ft0uVO+9l58I3rkkaedejMu+fC0tTdK8GS8Dc4ASi2wqjrOkDXBoHAU3hSfdWxEXbm3k9CrI+a8UftYqguuOxg23288YSblc8V3ca+FNhOS1VkgteE+HGVLidzGoE+7dX2xqV2piW9ihEgLR3hoZU9Rl6G37oGKtTFn0HuWoK+idJpmobfiFqqdSObzQvFUcvqV5Rxa+R90AwUv9MqCNoAlYlQg7Hn6/l4zKqEXrmQsNr7QccVDTqlbBZpnk/PmS0OJ55RJ7Ow9tRGdbb6ePfq4XjMTx0knZDBdgPYZ0n9XSShR8RrN+nLA4yNoWkOeYoVIHEauHxVh+aDMOch1EhIViz4HW/CcSSd32dE3+NSfz8Uq8v/v1Bt2dkszf90cfxqRdJGV0=|u4eqyjxRrhrQf10L+quvC6rY5gRqVtZwg6YSLWgYv9Q="
    );

    commonSetup();

    const tokenResponse = newTokenResponse();
    tokenResponse.keyConnectorUrl = keyConnectorUrl;
    tokenResponse.key = null;

    cryptoFunctionService
      .randomBytes(Arg.any())
      .resolves(Utils.fromB64ToArray("bNr5Ykzpv9lXJF26Cyz8iGpeGjs9si6MYkiC5iZzy4H7fWnnevSvBvLL"));
    cryptoService.makeKey(Arg.any(), Arg.any(), kdf, kdfIterations).resolves(preloginKey);
    cryptoService.makeEncKey(preloginKey).resolves(realEncKey);
    cryptoService.makeKeyPair().resolves([pubKey, privKey]);

    apiService.postIdentityToken(Arg.any()).resolves(tokenResponse);

    const result = await authService.logInSso(ssoCode, ssoCodeVerifier, ssoRedirectUrl, ssoOrgId);

    commonSuccessAssertions();
    keyConnectorService.received(1).convertNewSsoUserToKeyConnector(kdf, kdfIterations, keyConnectorUrl, ssoOrgId);
  });

  // API

  it("logInApi: user can login with api key", async () => {
    commonSetup();
    tokenService.getTwoFactorToken().resolves(null);
    const tokenResponse = newTokenResponse();
    apiService.postIdentityToken(Arg.any()).resolves(tokenResponse);

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
    keyConnectorService.didNotReceive().convertNewSsoUserToKeyConnector(Arg.all()); // Did not send key to KC
    tokenService.didNotReceive().setTwoFactorToken(Arg.any()); // Did not save 2FA token

    // Return result:
    const expected = newAuthResponse();
    expect(result).toEqual(expected);
  });
});
