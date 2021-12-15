import { Arg, Substitute, SubstituteOf } from '@fluffy-spoon/substitute';

import { ApiService } from 'jslib-common/abstractions/api.service';
import { AppIdService } from 'jslib-common/abstractions/appId.service';
import { CryptoFunctionService } from 'jslib-common/abstractions/cryptoFunction.service';
import { CryptoService } from 'jslib-common/abstractions/crypto.service';
import { EnvironmentService } from 'jslib-common/abstractions/environment.service'
import { I18nService } from 'jslib-common/abstractions/i18n.service';
import { KeyConnectorService } from 'jslib-common/abstractions/keyConnector.service'
import { LogService } from 'jslib-common/abstractions/log.service';
import { MessagingService } from 'jslib-common/abstractions/messaging.service';
import { PlatformUtilsService } from 'jslib-common/abstractions/platformUtils.service';
import { TokenService } from 'jslib-common/abstractions/token.service';
import { VaultTimeoutService } from 'jslib-common/abstractions/vaultTimeout.service'

import { AuthService } from 'jslib-common/services/auth.service';

import { Utils } from 'jslib-common/misc/utils';
import { SymmetricCryptoKey } from 'jslib-common/models/domain/symmetricCryptoKey';
import { HashPurpose } from 'jslib-common/enums/hashPurpose';
import { AuthResult } from 'jslib-common/models/domain/authResult';
import { IdentityTokenResponse } from 'jslib-common/models/response/identityTokenResponse';
import { StateService } from 'jslib-common/abstractions/state.service';
import { AccountProfile, AccountTokens } from 'jslib-common/models/domain/account';

describe('Cipher Service', () => {
    let cryptoService: SubstituteOf<CryptoService>;
    let apiService: SubstituteOf<ApiService>;
    let tokenService: SubstituteOf<TokenService>;
    let appIdService: SubstituteOf<AppIdService>;
    let i18nService: SubstituteOf<I18nService>;
    let platformUtilsService: SubstituteOf<PlatformUtilsService>;
    let messagingService: SubstituteOf<MessagingService>;
    let vaultTimeoutService: SubstituteOf<VaultTimeoutService>;
    let logService: SubstituteOf<LogService>;
    let cryptoFunctionService: SubstituteOf<CryptoFunctionService>;
    let environmentService: SubstituteOf<EnvironmentService>;
    let keyConnectorService: SubstituteOf<KeyConnectorService>;
    let stateService: SubstituteOf<StateService>;
    let setCryptoKeys = true;

    const email = 'hello@world.com';
    const masterPassword = 'password';
    const hashedPassword = 'HASHED_PASSWORD';
    const localHashedPassword = 'LOCAL_HASHED_PASSWORD';
    const preloginKey = new SymmetricCryptoKey(Utils.fromB64ToArray('XVs4Gg+EdUXb9mHsSA6iOa5e88iVLvUtP/L0OXIamVA='));
    const deviceId = Utils.newGuid();
    const accessToken = 'ACCESS_TOKEN';
    const refreshToken = 'REFRESH_TOKEN';
    const encKey = 'ENC_KEY';
    const privateKey = 'PRIVATE_KEY';
    const kdf = 0;
    const kdfIterations = 10000;
    const userId = Utils.newGuid();
    const decodedToken = {
        sub: userId,
        email: email,
        premium: false,
    };

    let authService: AuthService;

    beforeEach(() => {
        cryptoService = Substitute.for<CryptoService>();
        apiService = Substitute.for<ApiService>();
        tokenService = Substitute.for<TokenService>();
        appIdService = Substitute.for<AppIdService>();
        i18nService = Substitute.for<I18nService>();
        platformUtilsService = Substitute.for<PlatformUtilsService>();
        messagingService = Substitute.for<MessagingService>();
        vaultTimeoutService = Substitute.for<VaultTimeoutService>();
        logService = Substitute.for<LogService>();
        cryptoFunctionService = Substitute.for<CryptoFunctionService>();
        environmentService = Substitute.for<EnvironmentService>();
        stateService = Substitute.for<StateService>();
        keyConnectorService = Substitute.for<KeyConnectorService>();

        authService = new AuthService(cryptoService, apiService, tokenService, appIdService, i18nService,
            platformUtilsService, messagingService, vaultTimeoutService, logService, cryptoFunctionService,
            keyConnectorService, environmentService, stateService, setCryptoKeys);
        authService.init();
    });

    function logInSetup() {
        // Arrange for logIn and logInComplete
        cryptoService.makeKey(masterPassword, email, Arg.any(), Arg.any()).resolves(preloginKey);
        cryptoService.hashPassword(masterPassword, Arg.any()).resolves(hashedPassword);
        cryptoService.hashPassword(masterPassword, Arg.any(), HashPurpose.LocalAuthorization).resolves(localHashedPassword);
    }

    function commonSetup() {
        // For logInHelper, i.e. always required
        appIdService.getAppId().resolves(deviceId);

        tokenService.decodeToken(accessToken).resolves(decodedToken)
    }

    function newTokenResponse() {
        const tokenResponse = new IdentityTokenResponse({});
        (tokenResponse as any).twoFactorProviders2 = false;
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

    it('logIn method: simple call: no 2FA, captcha or password reset', async () => {
        logInSetup();
        commonSetup();
        const tokenResponse = newTokenResponse();

        tokenService.getTwoFactorToken(email).resolves(null);
        apiService.postIdentityToken(Arg.any()).resolves(tokenResponse);

        const expected = new AuthResult();
        expected.forcePasswordReset = false;
        expected.resetMasterPassword = false;
        expected.twoFactor = false;
        expected.twoFactorProviders = null;
        expected.captchaSiteKey = undefined;

        // Act
        const result = await authService.logIn(email, masterPassword);

        // Assert
        // Api call:
        apiService.received(1).postIdentityToken(Arg.is(actual => 
            actual.email === email &&
            actual.masterPasswordHash === hashedPassword &&
            actual.device.identifier === deviceId &&
            actual.provider == null &&
            actual.token == null &&
            actual.captchaResponse == null));

        // Sets local environment:
        stateService.received(1).addAccount({
            profile: {
                ...new AccountProfile(),
                ...{
                    userId: userId,
                    email: email,
                    apiKeyClientId: null,
                    apiKeyClientSecret: null,
                    hasPremiumPersonally: false,
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
        cryptoService.received(1).setKey(preloginKey);
        cryptoService.received(1).setKeyHash(localHashedPassword);
        cryptoService.received(1).setEncKey(encKey);
        cryptoService.received(1).setEncPrivateKey(privateKey);
        stateService.received(1).setBiometricLocked(false);

        messagingService.received(1).send('loggedIn');

        // Negative tests
        apiService.didNotReceive().postAccountKeys(Arg.any()); // Did not generate new private key pair
        keyConnectorService.didNotReceive().getAndSetKey(Arg.any()); // Did not fetch Key Connector key
        apiService.didNotReceive().postUserKeyToKeyConnector(Arg.any(), Arg.any()); // Did not send key to KC
        tokenService.didNotReceive().setTwoFactorToken(Arg.any(), Arg.any()); // Did not save 2FA token

        // Return result:
        expect(result).toEqual(expected);
    });
});
