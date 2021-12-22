import { Arg, Substitute, SubstituteOf } from "@fluffy-spoon/substitute";

import { ApiService } from "jslib-common/abstractions/api.service";
import { AppIdService } from "jslib-common/abstractions/appId.service";
import { AuthService } from "jslib-common/abstractions/auth.service";
import { CryptoService } from "jslib-common/abstractions/crypto.service";
import { LogService } from "jslib-common/abstractions/log.service";
import { MessagingService } from "jslib-common/abstractions/messaging.service";
import { PlatformUtilsService } from "jslib-common/abstractions/platformUtils.service";
import { StateService } from "jslib-common/abstractions/state.service";
import { TokenService } from "jslib-common/abstractions/token.service";

import { PasswordLogInDelegate } from "jslib-common/misc/logInDelegate/passwordLogin.delegate";

import { Utils } from "jslib-common/misc/utils";

import { Account, AccountProfile, AccountTokens } from "jslib-common/models/domain/account";
import { AuthResult } from "jslib-common/models/domain/authResult";
import { SymmetricCryptoKey } from "jslib-common/models/domain/symmetricCryptoKey";

import { IdentityTokenResponse } from "jslib-common/models/response/identityTokenResponse";

import { TwoFactorService } from "jslib-common/abstractions/twoFactor.service";
import { HashPurpose } from "jslib-common/enums/hashPurpose";
import { TwoFactorProviderType } from "jslib-common/enums/twoFactorProviderType";
import { IdentityCaptchaResponse } from "jslib-common/models/response/identityCaptchaResponse";
import { IdentityTwoFactorResponse } from "jslib-common/models/response/identityTwoFactorResponse";

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
const captchaSiteKey = "CAPTCHA_SITE_KEY";
const kdf = 0;
const kdfIterations = 10000;
const userId = Utils.newGuid();

const decodedToken = {
  sub: userId,
  email: email,
  premium: false,
};

const twoFactorProviderType = TwoFactorProviderType.Authenticator;
const twoFactorToken = "TWO_FACTOR_TOKEN";
const twoFactorRemember = true;
const twoFactorProviders = new Map<number, null>([[1, null]]);

export function tokenResponseFactory() {
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

describe("LogInDelegate", () => {
  let cryptoService: SubstituteOf<CryptoService>;
  let apiService: SubstituteOf<ApiService>;
  let tokenService: SubstituteOf<TokenService>;
  let appIdService: SubstituteOf<AppIdService>;
  let platformUtilsService: SubstituteOf<PlatformUtilsService>;
  let messagingService: SubstituteOf<MessagingService>;
  let logService: SubstituteOf<LogService>;
  let stateService: SubstituteOf<StateService>;
  let twoFactorService: SubstituteOf<TwoFactorService>;
  let authService: SubstituteOf<AuthService>;
  const setCryptoKeys = true;

  let passwordLogInDelegate: PasswordLogInDelegate;

  beforeEach(() => {
    cryptoService = Substitute.for<CryptoService>();
    apiService = Substitute.for<ApiService>();
    tokenService = Substitute.for<TokenService>();
    appIdService = Substitute.for<AppIdService>();
    platformUtilsService = Substitute.for<PlatformUtilsService>();
    messagingService = Substitute.for<MessagingService>();
    logService = Substitute.for<LogService>();
    stateService = Substitute.for<StateService>();
    twoFactorService = Substitute.for<TwoFactorService>();
    authService = Substitute.for<AuthService>();

    // The base class is abstract so we test it via PasswordLogInDelegate
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

  describe("base class", () => {
    it("sets the local environment after a successful login", async () => {
      apiService.postIdentityToken(Arg.any()).resolves(tokenResponseFactory());
      tokenService.getTwoFactorToken().resolves(null);
      tokenService.decodeToken(accessToken).resolves(decodedToken);

      await passwordLogInDelegate.init(email, masterPassword);
      await passwordLogInDelegate.logIn();

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
      cryptoService.received(1).setEncKey(encKey);
      cryptoService.received(1).setEncPrivateKey(privateKey);

      stateService.received(1).setBiometricLocked(false);
      messagingService.received(1).send("loggedIn");
    });

    it("builds AuthResult", async () => {
      const tokenResponse = tokenResponseFactory();
      tokenResponse.forcePasswordReset = true;
      tokenResponse.resetMasterPassword = true;
      (tokenResponse as any as IdentityTwoFactorResponse).twoFactorProviders2 = null;
      (tokenResponse as any as IdentityCaptchaResponse).siteKey = null;

      apiService.postIdentityToken(Arg.any()).resolves(tokenResponse);
      tokenService.getTwoFactorToken().resolves(null);

      await passwordLogInDelegate.init(email, masterPassword);
      const result = await passwordLogInDelegate.logIn();

      const expected = new AuthResult();
      expected.forcePasswordReset = true;
      expected.resetMasterPassword = true;
      expected.twoFactorProviders = null;
      expected.captchaSiteKey = null;
      expect(result).toEqual(expected);
    });

    it("rejects login if CAPTCHA is required", async () => {
      const tokenResponse = tokenResponseFactory();
      (tokenResponse as any).siteKey = captchaSiteKey;
      apiService.postIdentityToken(Arg.any()).resolves(tokenResponse);

      await passwordLogInDelegate.init(email, masterPassword);
      const result = await passwordLogInDelegate.logIn();

      stateService.didNotReceive().addAccount(Arg.any());
      messagingService.didNotReceive().send(Arg.any());

      const expected = new AuthResult();
      expected.captchaSiteKey = captchaSiteKey;
      expect(result).toEqual(expected);
    });

    it("does not set crypto keys if setCryptoKeys is false", async () => {
      apiService.postIdentityToken(Arg.any()).resolves(tokenResponseFactory());

      passwordLogInDelegate = new PasswordLogInDelegate(
        cryptoService,
        apiService,
        tokenService,
        appIdService,
        platformUtilsService,
        messagingService,
        logService,
        stateService,
        false,
        twoFactorService,
        authService
      );

      await passwordLogInDelegate.init(email, masterPassword);
      await passwordLogInDelegate.logIn();

      cryptoService.didNotReceive().setKey(Arg.any());
      cryptoService.didNotReceive().setKeyHash(Arg.any());
      cryptoService.didNotReceive().setEncKey(Arg.any());
      cryptoService.didNotReceive().setEncPrivateKey(Arg.any());
    });

    it("makes a new public and private key for an old account", async () => {
      const tokenResponse = tokenResponseFactory();
      tokenResponse.privateKey = null;

      apiService.postIdentityToken(Arg.any()).resolves(tokenResponse);

      await passwordLogInDelegate.init(email, masterPassword);
      await passwordLogInDelegate.logIn();

      apiService.received(1).postAccountKeys(Arg.any());
    });
  });

  describe("Two-factor authentication", () => {
    it("rejects login if 2FA is required", async () => {
      const tokenResponse = tokenResponseFactory();
      (tokenResponse as any).twoFactorProviders2 = twoFactorProviders;

      apiService.postIdentityToken(Arg.any()).resolves(tokenResponse);

      await passwordLogInDelegate.init(email, masterPassword);
      const result = await passwordLogInDelegate.logIn();

      stateService.didNotReceive().addAccount(Arg.any());
      messagingService.didNotReceive().send(Arg.any());

      const expected = new AuthResult();
      expected.twoFactorProviders = twoFactorProviders;
      expected.captchaSiteKey = undefined;
      expect(result).toEqual(expected);
    });

    it("sends stored 2FA token to server", async () => {
      passwordLogInSetup();
      tokenService.getTwoFactorToken().resolves(twoFactorToken);

      await passwordLogInDelegate.init(email, masterPassword);
      await passwordLogInDelegate.logIn();

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

    it("sends 2FA token provided by user to server (single step)", async () => {
      // This occurs if the user enters the 2FA code as an argument in the CLI

      passwordLogInSetup();
      await passwordLogInDelegate.init(email, masterPassword, null, {
        provider: twoFactorProviderType,
        token: twoFactorToken,
        remember: twoFactorRemember,
      });
      await passwordLogInDelegate.logIn();

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

    it("sends 2FA token provided by user to server (two-step)", async () => {
      passwordLogInSetup();
      await passwordLogInDelegate.init(email, masterPassword);
      await passwordLogInDelegate.logInTwoFactor({
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

  function passwordLogInSetup() {
    authService.makePreloginKey(Arg.any(), Arg.any()).resolves(preloginKey);
    cryptoService.hashPassword(masterPassword, Arg.any()).resolves(hashedPassword);
    cryptoService
      .hashPassword(masterPassword, Arg.any(), HashPurpose.LocalAuthorization)
      .resolves(localHashedPassword);
  }
});
