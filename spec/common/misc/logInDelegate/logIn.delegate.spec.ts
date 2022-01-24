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
import { TwoFactorService } from "jslib-common/abstractions/twoFactor.service";

import { PasswordLogInDelegate } from "jslib-common/misc/logInDelegate/passwordLogin.delegate";

import { Utils } from "jslib-common/misc/utils";

import { Account, AccountProfile, AccountTokens } from "jslib-common/models/domain/account";
import { AuthResult } from "jslib-common/models/domain/authResult";

import { IdentityCaptchaResponse } from "jslib-common/models/response/identityCaptchaResponse";
import { IdentityTokenResponse } from "jslib-common/models/response/identityTokenResponse";
import { IdentityTwoFactorResponse } from "jslib-common/models/response/identityTwoFactorResponse";

import { TokenRequestTwoFactor } from "jslib-common/models/request/identityToken/tokenRequest";

import { TwoFactorProviderType } from "jslib-common/enums/twoFactorProviderType";

const email = "hello@world.com";
const masterPassword = "password";

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

  let passwordLogInDelegate: PasswordLogInDelegate;

  beforeEach(async () => {
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

    tokenService.getTwoFactorToken().resolves(null);

    appIdService.getAppId().resolves(deviceId);

    passwordLogInDelegate = null; // PasswordLogInDelegate must be initialized by each describe block
  });

  describe("base class", () => {
    beforeEach(async () => {
      await setupLogInDelegate();
    });

    it("sets the local environment after a successful login", async () => {
      apiService.postIdentityToken(Arg.any()).resolves(tokenResponseFactory());
      tokenService.decodeToken(accessToken).resolves(decodedToken);

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

      const result = await passwordLogInDelegate.logIn();

      stateService.didNotReceive().addAccount(Arg.any());
      messagingService.didNotReceive().send(Arg.any());

      const expected = new AuthResult();
      expected.captchaSiteKey = captchaSiteKey;
      expect(result).toEqual(expected);
    });

    it("does not set crypto keys if setCryptoKeys is false", async () => {
      apiService.postIdentityToken(Arg.any()).resolves(tokenResponseFactory());
      await setupLogInDelegate(false);

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

      await passwordLogInDelegate.logIn();

      apiService.received(1).postAccountKeys(Arg.any());
    });
  });

  describe("Two-factor authentication", () => {
    it("rejects login if 2FA is required", async () => {
      await setupLogInDelegate();
      const tokenResponse = tokenResponseFactory();
      (tokenResponse as any).twoFactorProviders2 = twoFactorProviders;

      apiService.postIdentityToken(Arg.any()).resolves(tokenResponse);

      const result = await passwordLogInDelegate.logIn();

      stateService.didNotReceive().addAccount(Arg.any());
      messagingService.didNotReceive().send(Arg.any());

      const expected = new AuthResult();
      expected.twoFactorProviders = twoFactorProviders;
      expected.captchaSiteKey = undefined;
      expect(result).toEqual(expected);
    });

    it("sends stored 2FA token to server", async () => {
      tokenService = Substitute.for<TokenService>();
      tokenService.getTwoFactorToken().resolves(twoFactorToken);
      await setupLogInDelegate();

      await passwordLogInDelegate.logIn();

      apiService.received(1).postIdentityToken(
        Arg.is((actual) => {
          const passwordTokenRequest = actual as any;
          return (
            passwordTokenRequest.twoFactor.provider === TwoFactorProviderType.Remember &&
            passwordTokenRequest.twoFactor.token === twoFactorToken &&
            passwordTokenRequest.twoFactor.remember === false
          );
        })
      );
    });

    it("sends 2FA token provided by user to server (single step)", async () => {
      // This occurs if the user enters the 2FA code as an argument in the CLI
      await setupLogInDelegate(true, {
        provider: twoFactorProviderType,
        token: twoFactorToken,
        remember: twoFactorRemember,
      });

      await passwordLogInDelegate.logIn();

      apiService.received(1).postIdentityToken(
        Arg.is((actual) => {
          const passwordTokenRequest = actual as any;
          return (
            passwordTokenRequest.twoFactor.provider === twoFactorProviderType &&
            passwordTokenRequest.twoFactor.token === twoFactorToken &&
            passwordTokenRequest.twoFactor.remember === twoFactorRemember
          );
        })
      );
    });

    it("sends 2FA token provided by user to server (two-step)", async () => {
      await setupLogInDelegate();

      await passwordLogInDelegate.logInTwoFactor({
        provider: twoFactorProviderType,
        token: twoFactorToken,
        remember: twoFactorRemember,
      });

      apiService.received(1).postIdentityToken(
        Arg.is((actual) => {
          const passwordTokenRequest = actual as any;
          return (
            passwordTokenRequest.twoFactor.provider === twoFactorProviderType &&
            passwordTokenRequest.twoFactor.token === twoFactorToken &&
            passwordTokenRequest.twoFactor.remember === twoFactorRemember
          );
        })
      );
    });
  });

  async function setupLogInDelegate(setCryptoKeys = true, twoFactor: TokenRequestTwoFactor = null) {
    // The base class is abstract so we test it via PasswordLogInDelegate
    passwordLogInDelegate = await PasswordLogInDelegate.new(
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
      authService,
      email,
      masterPassword,
      null,
      twoFactor
    );
  }
});
