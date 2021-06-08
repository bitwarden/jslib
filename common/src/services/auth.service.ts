import { HashPurpose } from '../enums/hashPurpose';
import { KdfType } from '../enums/kdfType';
import { TwoFactorProviderType } from '../enums/twoFactorProviderType';

import { AuthResult } from '../models/domain/authResult';
import { SymmetricCryptoKey } from '../models/domain/symmetricCryptoKey';

import { DeviceRequest } from '../models/request/deviceRequest';
import { KeysRequest } from '../models/request/keysRequest';
import { PreloginRequest } from '../models/request/preloginRequest';
import { TokenRequest } from '../models/request/tokenRequest';

import { IdentityTokenResponse } from '../models/response/identityTokenResponse';
import { IdentityTwoFactorResponse } from '../models/response/identityTwoFactorResponse';

import { ApiService } from '../abstractions/api.service';
import { AppIdService } from '../abstractions/appId.service';
import { AuthService as AuthServiceAbstraction } from '../abstractions/auth.service';
import { CryptoService } from '../abstractions/crypto.service';
import { I18nService } from '../abstractions/i18n.service';
import { LogService } from '../abstractions/log.service';
import { MessagingService } from '../abstractions/messaging.service';
import { PlatformUtilsService } from '../abstractions/platformUtils.service';
import { TokenService } from '../abstractions/token.service';
import { UserService } from '../abstractions/user.service';
import { VaultTimeoutService } from '../abstractions/vaultTimeout.service';

export const TwoFactorProviders = {
    [TwoFactorProviderType.Authenticator]: {
        type: TwoFactorProviderType.Authenticator,
        name: null as string,
        description: null as string,
        priority: 1,
        sort: 1,
        premium: false,
    },
    [TwoFactorProviderType.Yubikey]: {
        type: TwoFactorProviderType.Yubikey,
        name: null as string,
        description: null as string,
        priority: 3,
        sort: 2,
        premium: true,
    },
    [TwoFactorProviderType.Duo]: {
        type: TwoFactorProviderType.Duo,
        name: 'Duo',
        description: null as string,
        priority: 2,
        sort: 3,
        premium: true,
    },
    [TwoFactorProviderType.OrganizationDuo]: {
        type: TwoFactorProviderType.OrganizationDuo,
        name: 'Duo (Organization)',
        description: null as string,
        priority: 10,
        sort: 4,
        premium: false,
    },
    [TwoFactorProviderType.Email]: {
        type: TwoFactorProviderType.Email,
        name: null as string,
        description: null as string,
        priority: 0,
        sort: 6,
        premium: false,
    },
    [TwoFactorProviderType.WebAuthn]: {
        type: TwoFactorProviderType.WebAuthn,
        name: null as string,
        description: null as string,
        priority: 4,
        sort: 5,
        premium: true,
    },
};

export class AuthService implements AuthServiceAbstraction {
    email: string;
    masterPasswordHash: string;
    localMasterPasswordHash: string;
    code: string;
    codeVerifier: string;
    ssoRedirectUrl: string;
    clientId: string;
    clientSecret: string;
    twoFactorProvidersData: Map<TwoFactorProviderType, { [key: string]: string; }>;
    selectedTwoFactorProviderType: TwoFactorProviderType = null;

    private key: SymmetricCryptoKey;

    constructor(private cryptoService: CryptoService, protected apiService: ApiService,
        private userService: UserService, protected tokenService: TokenService,
        protected appIdService: AppIdService, private i18nService: I18nService,
        protected platformUtilsService: PlatformUtilsService, private messagingService: MessagingService,
        private vaultTimeoutService: VaultTimeoutService, private logService: LogService,
        private setCryptoKeys = true) {
    }

    init() {
        TwoFactorProviders[TwoFactorProviderType.Email].name = this.i18nService.t('emailTitle');
        TwoFactorProviders[TwoFactorProviderType.Email].description = this.i18nService.t('emailDesc');

        TwoFactorProviders[TwoFactorProviderType.Authenticator].name = this.i18nService.t('authenticatorAppTitle');
        TwoFactorProviders[TwoFactorProviderType.Authenticator].description =
            this.i18nService.t('authenticatorAppDesc');

        TwoFactorProviders[TwoFactorProviderType.Duo].description = this.i18nService.t('duoDesc');

        TwoFactorProviders[TwoFactorProviderType.OrganizationDuo].name =
            'Duo (' + this.i18nService.t('organization') + ')';
        TwoFactorProviders[TwoFactorProviderType.OrganizationDuo].description =
            this.i18nService.t('duoOrganizationDesc');

        TwoFactorProviders[TwoFactorProviderType.WebAuthn].name = this.i18nService.t('webAuthnTitle');
        TwoFactorProviders[TwoFactorProviderType.WebAuthn].description = this.i18nService.t('webAuthnDesc');

        TwoFactorProviders[TwoFactorProviderType.Yubikey].name = this.i18nService.t('yubiKeyTitle');
        TwoFactorProviders[TwoFactorProviderType.Yubikey].description = this.i18nService.t('yubiKeyDesc');
    }

    async logIn(email: string, masterPassword: string): Promise<AuthResult> {
        this.selectedTwoFactorProviderType = null;
        const key = await this.makePreloginKey(masterPassword, email);
        const hashedPassword = await this.cryptoService.hashPassword(masterPassword, key);
        const localHashedPassword = await this.cryptoService.hashPassword(masterPassword, key,
            HashPurpose.LocalAuthorization);
        return await this.logInHelper(email, hashedPassword, localHashedPassword, null, null, null, null, null,
            key, null, null, null);
    }

    async logInSso(code: string, codeVerifier: string, redirectUrl: string): Promise<AuthResult> {
        this.selectedTwoFactorProviderType = null;
        return await this.logInHelper(null, null, null, code, codeVerifier, redirectUrl, null, null,
            null, null, null, null);
    }

    async logInApiKey(clientId: string, clientSecret: string): Promise<AuthResult> {
        this.selectedTwoFactorProviderType = null;
        return await this.logInHelper(null, null, null, null, null, null, clientId, clientSecret,
            null, null, null, null);
    }

    async logInTwoFactor(twoFactorProvider: TwoFactorProviderType, twoFactorToken: string,
        remember?: boolean): Promise<AuthResult> {
        return await this.logInHelper(this.email, this.masterPasswordHash, this.localMasterPasswordHash, this.code,
            this.codeVerifier, this.ssoRedirectUrl, this.clientId, this.clientSecret, this.key, twoFactorProvider,
            twoFactorToken, remember);
    }

    async logInComplete(email: string, masterPassword: string, twoFactorProvider: TwoFactorProviderType,
        twoFactorToken: string, remember?: boolean): Promise<AuthResult> {
        this.selectedTwoFactorProviderType = null;
        const key = await this.makePreloginKey(masterPassword, email);
        const hashedPassword = await this.cryptoService.hashPassword(masterPassword, key);
        const localHashedPassword = await this.cryptoService.hashPassword(masterPassword, key,
            HashPurpose.LocalAuthorization);
        return await this.logInHelper(email, hashedPassword, localHashedPassword, null, null, null, null, null, key,
            twoFactorProvider, twoFactorToken, remember);
    }

    async logInSsoComplete(code: string, codeVerifier: string, redirectUrl: string,
        twoFactorProvider: TwoFactorProviderType, twoFactorToken: string, remember?: boolean): Promise<AuthResult> {
        this.selectedTwoFactorProviderType = null;
        return await this.logInHelper(null, null, null, code, codeVerifier, redirectUrl, null,
            null, null, twoFactorProvider, twoFactorToken, remember);
    }

    async logInApiKeyComplete(clientId: string, clientSecret: string, twoFactorProvider: TwoFactorProviderType,
        twoFactorToken: string, remember?: boolean): Promise<AuthResult> {
        this.selectedTwoFactorProviderType = null;
        return await this.logInHelper(null, null, null, null, null, null, clientId, clientSecret, null,
            twoFactorProvider, twoFactorToken, remember);
    }

    logOut(callback: Function) {
        callback();
        this.messagingService.send('loggedOut');
    }

    getSupportedTwoFactorProviders(win: Window): any[] {
        const providers: any[] = [];
        if (this.twoFactorProvidersData == null) {
            return providers;
        }

        if (this.twoFactorProvidersData.has(TwoFactorProviderType.OrganizationDuo) &&
            this.platformUtilsService.supportsDuo()) {
            providers.push(TwoFactorProviders[TwoFactorProviderType.OrganizationDuo]);
        }

        if (this.twoFactorProvidersData.has(TwoFactorProviderType.Authenticator)) {
            providers.push(TwoFactorProviders[TwoFactorProviderType.Authenticator]);
        }

        if (this.twoFactorProvidersData.has(TwoFactorProviderType.Yubikey)) {
            providers.push(TwoFactorProviders[TwoFactorProviderType.Yubikey]);
        }

        if (this.twoFactorProvidersData.has(TwoFactorProviderType.Duo) && this.platformUtilsService.supportsDuo()) {
            providers.push(TwoFactorProviders[TwoFactorProviderType.Duo]);
        }

        if (this.twoFactorProvidersData.has(TwoFactorProviderType.WebAuthn) && this.platformUtilsService.supportsWebAuthn(win)) {
            providers.push(TwoFactorProviders[TwoFactorProviderType.WebAuthn]);
        }

        if (this.twoFactorProvidersData.has(TwoFactorProviderType.Email)) {
            providers.push(TwoFactorProviders[TwoFactorProviderType.Email]);
        }

        return providers;
    }

    getDefaultTwoFactorProvider(webAuthnSupported: boolean): TwoFactorProviderType {
        if (this.twoFactorProvidersData == null) {
            return null;
        }

        if (this.selectedTwoFactorProviderType != null &&
            this.twoFactorProvidersData.has(this.selectedTwoFactorProviderType)) {
            return this.selectedTwoFactorProviderType;
        }

        let providerType: TwoFactorProviderType = null;
        let providerPriority = -1;
        this.twoFactorProvidersData.forEach((value, type) => {
            const provider = (TwoFactorProviders as any)[type];
            if (provider != null && provider.priority > providerPriority) {
                if (type === TwoFactorProviderType.WebAuthn && !webAuthnSupported) {
                    return;
                }

                providerType = type;
                providerPriority = provider.priority;
            }
        });

        return providerType;
    }

    async makePreloginKey(masterPassword: string, email: string): Promise<SymmetricCryptoKey> {
        email = email.trim().toLowerCase();
        let kdf: KdfType = null;
        let kdfIterations: number = null;
        try {
            const preloginResponse = await this.apiService.postPrelogin(new PreloginRequest(email));
            if (preloginResponse != null) {
                kdf = preloginResponse.kdf;
                kdfIterations = preloginResponse.kdfIterations;
            }
        } catch (e) {
            if (e == null || e.statusCode !== 404) {
                throw e;
            }
        }
        return this.cryptoService.makeKey(masterPassword, email, kdf, kdfIterations);
    }

    authingWithApiKey(): boolean {
        return this.clientId != null && this.clientSecret != null;
    }

    authingWithSso(): boolean {
        return this.code != null && this.codeVerifier != null && this.ssoRedirectUrl != null;
    }

    authingWithPassword(): boolean {
        return this.email != null && this.masterPasswordHash != null;
    }

    private async logInHelper(email: string, hashedPassword: string, localHashedPassword: string, code: string,
        codeVerifier: string, redirectUrl: string, clientId: string, clientSecret: string, key: SymmetricCryptoKey,
        twoFactorProvider?: TwoFactorProviderType, twoFactorToken?: string, remember?: boolean): Promise<AuthResult> {
        const storedTwoFactorToken = await this.tokenService.getTwoFactorToken(email);
        const appId = await this.appIdService.getAppId();
        const deviceRequest = new DeviceRequest(appId, this.platformUtilsService);

        let emailPassword: string[] = [];
        let codeCodeVerifier: string[] = [];
        let clientIdClientSecret: string[] = [];

        if (email != null && hashedPassword != null) {
            emailPassword = [email, hashedPassword];
        } else {
            emailPassword = null;
        }
        if (code != null && codeVerifier != null && redirectUrl != null) {
            codeCodeVerifier = [code, codeVerifier, redirectUrl];
        } else {
            codeCodeVerifier = null;
        }
        if (clientId != null && clientSecret != null) {
            clientIdClientSecret = [clientId, clientSecret];
        } else {
            clientIdClientSecret = null;
        }

        let request: TokenRequest;
        if (twoFactorToken != null && twoFactorProvider != null) {
            request = new TokenRequest(emailPassword, codeCodeVerifier, clientIdClientSecret, twoFactorProvider,
                twoFactorToken, remember, deviceRequest);
        } else if (storedTwoFactorToken != null) {
            request = new TokenRequest(emailPassword, codeCodeVerifier, clientIdClientSecret, TwoFactorProviderType.Remember,
                storedTwoFactorToken, false, deviceRequest);
        } else {
            request = new TokenRequest(emailPassword, codeCodeVerifier, clientIdClientSecret, null,
                null, false, deviceRequest);
        }

        const response = await this.apiService.postIdentityToken(request);

        this.clearState();
        const result = new AuthResult();
        result.twoFactor = !(response as any).accessToken;

        if (result.twoFactor) {
            // two factor required
            const twoFactorResponse = response as IdentityTwoFactorResponse;
            this.email = email;
            this.masterPasswordHash = hashedPassword;
            this.localMasterPasswordHash = localHashedPassword;
            this.code = code;
            this.codeVerifier = codeVerifier;
            this.ssoRedirectUrl = redirectUrl;
            this.clientId = clientId;
            this.clientSecret = clientSecret;
            this.key = this.setCryptoKeys ? key : null;
            this.twoFactorProvidersData = twoFactorResponse.twoFactorProviders2;
            result.twoFactorProviders = twoFactorResponse.twoFactorProviders2;
            return result;
        }

        const tokenResponse = response as IdentityTokenResponse;
        result.resetMasterPassword = tokenResponse.resetMasterPassword;
        if (tokenResponse.twoFactorToken != null) {
            await this.tokenService.setTwoFactorToken(tokenResponse.twoFactorToken, email);
        }

        await this.tokenService.setTokens(tokenResponse.accessToken, tokenResponse.refreshToken);
        await this.userService.setInformation(this.tokenService.getUserId(), this.tokenService.getEmail(),
            tokenResponse.kdf, tokenResponse.kdfIterations);
        if (this.setCryptoKeys) {
            if (key != null) {
                await this.cryptoService.setKey(key);
            }
            if (localHashedPassword != null) {
                await this.cryptoService.setKeyHash(localHashedPassword);
            }

            // Skip this step during SSO new user flow. No key is returned from server.
            if (code == null || tokenResponse.key != null) {
                await this.cryptoService.setEncKey(tokenResponse.key);

                // User doesn't have a key pair yet (old account), let's generate one for them
                if (tokenResponse.privateKey == null) {
                    try {
                        const keyPair = await this.cryptoService.makeKeyPair();
                        await this.apiService.postAccountKeys(new KeysRequest(keyPair[0], keyPair[1].encryptedString));
                        tokenResponse.privateKey = keyPair[1].encryptedString;
                    } catch (e) {
                        // tslint:disable-next-line
                        this.logService.error(e);
                    }
                }

                await this.cryptoService.setEncPrivateKey(tokenResponse.privateKey);
            }
        }

        if (this.vaultTimeoutService != null) {
            this.vaultTimeoutService.biometricLocked = false;
        }
        this.messagingService.send('loggedIn');
        return result;
    }

    private clearState(): void {
        this.key = null;
        this.email = null;
        this.masterPasswordHash = null;
        this.localMasterPasswordHash = null;
        this.code = null;
        this.codeVerifier = null;
        this.ssoRedirectUrl = null;
        this.clientId = null;
        this.clientSecret = null;
        this.twoFactorProvidersData = null;
        this.selectedTwoFactorProviderType = null;
    }
}
