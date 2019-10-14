import { KdfType } from '../enums/kdfType';
import { TwoFactorProviderType } from '../enums/twoFactorProviderType';

import { AuthResult } from '../models/domain/authResult';
import { SymmetricCryptoKey } from '../models/domain/symmetricCryptoKey';

import { DeviceRequest } from '../models/request/deviceRequest';
import { KeysRequest } from '../models/request/keysRequest';
import { PreloginRequest } from '../models/request/preloginRequest';
import { TokenRequest } from '../models/request/tokenRequest';

import { ErrorResponse } from '../models/response/errorResponse';
import { IdentityTokenResponse } from '../models/response/identityTokenResponse';
import { IdentityTwoFactorResponse } from '../models/response/identityTwoFactorResponse';

import { ApiService } from '../abstractions/api.service';
import { AppIdService } from '../abstractions/appId.service';
import { AuthService as AuthServiceAbstraction } from '../abstractions/auth.service';
import { CryptoService } from '../abstractions/crypto.service';
import { I18nService } from '../abstractions/i18n.service';
import { MessagingService } from '../abstractions/messaging.service';
import { PlatformUtilsService } from '../abstractions/platformUtils.service';
import { TokenService } from '../abstractions/token.service';
import { UserService } from '../abstractions/user.service';

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
    [TwoFactorProviderType.U2f]: {
        type: TwoFactorProviderType.U2f,
        name: null as string,
        description: null as string,
        priority: 4,
        sort: 5,
        premium: true,
    },
    [TwoFactorProviderType.Email]: {
        type: TwoFactorProviderType.Email,
        name: null as string,
        description: null as string,
        priority: 0,
        sort: 6,
        premium: false,
    },
};

export class AuthService implements AuthServiceAbstraction {
    email: string;
    masterPasswordHash: string;
    twoFactorProvidersData: Map<TwoFactorProviderType, { [key: string]: string; }>;
    selectedTwoFactorProviderType: TwoFactorProviderType = null;

    private key: SymmetricCryptoKey;
    private kdf: KdfType;
    private kdfIterations: number;

    constructor(private cryptoService: CryptoService, private apiService: ApiService,
        private userService: UserService, private tokenService: TokenService,
        private appIdService: AppIdService, private i18nService: I18nService,
        private platformUtilsService: PlatformUtilsService, private messagingService: MessagingService,
        private setCryptoKeys = true) { }

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

        TwoFactorProviders[TwoFactorProviderType.U2f].name = this.i18nService.t('u2fTitle');
        TwoFactorProviders[TwoFactorProviderType.U2f].description = this.i18nService.t('u2fDesc');

        TwoFactorProviders[TwoFactorProviderType.Yubikey].name = this.i18nService.t('yubiKeyTitle');
        TwoFactorProviders[TwoFactorProviderType.Yubikey].description = this.i18nService.t('yubiKeyDesc');
    }

    async logIn(email: string, masterPassword: string): Promise<AuthResult> {
        this.selectedTwoFactorProviderType = null;
        const key = await this.makePreloginKey(masterPassword, email);
        const hashedPassword = await this.cryptoService.hashPassword(masterPassword, key);
        return await this.logInHelper(email, hashedPassword, key);
    }

    async logInTwoFactor(twoFactorProvider: TwoFactorProviderType, twoFactorToken: string,
        remember?: boolean): Promise<AuthResult> {
        return await this.logInHelper(this.email, this.masterPasswordHash, this.key, twoFactorProvider,
            twoFactorToken, remember);
    }

    async logInComplete(email: string, masterPassword: string, twoFactorProvider: TwoFactorProviderType,
        twoFactorToken: string, remember?: boolean): Promise<AuthResult> {
        this.selectedTwoFactorProviderType = null;
        const key = await this.makePreloginKey(masterPassword, email);
        const hashedPassword = await this.cryptoService.hashPassword(masterPassword, key);
        return await this.logInHelper(email, hashedPassword, key, twoFactorProvider, twoFactorToken, remember);
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

        if (this.twoFactorProvidersData.has(TwoFactorProviderType.U2f) && this.platformUtilsService.supportsU2f(win)) {
            providers.push(TwoFactorProviders[TwoFactorProviderType.U2f]);
        }

        if (this.twoFactorProvidersData.has(TwoFactorProviderType.Email)) {
            providers.push(TwoFactorProviders[TwoFactorProviderType.Email]);
        }

        return providers;
    }

    getDefaultTwoFactorProvider(u2fSupported: boolean): TwoFactorProviderType {
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
                if (type === TwoFactorProviderType.U2f && !u2fSupported) {
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
        this.kdf = null;
        this.kdfIterations = null;
        try {
            const preloginResponse = await this.apiService.postPrelogin(new PreloginRequest(email));
            if (preloginResponse != null) {
                this.kdf = preloginResponse.kdf;
                this.kdfIterations = preloginResponse.kdfIterations;
            }
        } catch (e) {
            if (e == null || e.statusCode !== 404) {
                throw e;
            }
        }
        return this.cryptoService.makeKey(masterPassword, email, this.kdf, this.kdfIterations);
    }

    private async logInHelper(email: string, hashedPassword: string, key: SymmetricCryptoKey,
        twoFactorProvider?: TwoFactorProviderType, twoFactorToken?: string, remember?: boolean): Promise<AuthResult> {
        const storedTwoFactorToken = await this.tokenService.getTwoFactorToken(email);
        const appId = await this.appIdService.getAppId();
        const deviceRequest = new DeviceRequest(appId, this.platformUtilsService);

        let request: TokenRequest;
        if (twoFactorToken != null && twoFactorProvider != null) {
            request = new TokenRequest(email, hashedPassword, twoFactorProvider, twoFactorToken, remember,
                deviceRequest);
        } else if (storedTwoFactorToken != null) {
            request = new TokenRequest(email, hashedPassword, TwoFactorProviderType.Remember,
                storedTwoFactorToken, false, deviceRequest);
        } else {
            request = new TokenRequest(email, hashedPassword, null, null, false, deviceRequest);
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
            this.key = this.setCryptoKeys ? key : null;
            this.twoFactorProvidersData = twoFactorResponse.twoFactorProviders2;
            result.twoFactorProviders = twoFactorResponse.twoFactorProviders2;
            return result;
        }

        const tokenResponse = response as IdentityTokenResponse;
        if (tokenResponse.twoFactorToken != null) {
            await this.tokenService.setTwoFactorToken(tokenResponse.twoFactorToken, email);
        }

        await this.tokenService.setTokens(tokenResponse.accessToken, tokenResponse.refreshToken);
        await this.userService.setInformation(this.tokenService.getUserId(), this.tokenService.getEmail(),
            this.kdf, this.kdfIterations);
        if (this.setCryptoKeys) {
            await this.cryptoService.setKey(key);
            await this.cryptoService.setKeyHash(hashedPassword);
            await this.cryptoService.setEncKey(tokenResponse.key);

            // User doesn't have a key pair yet (old account), let's generate one for them
            if (tokenResponse.privateKey == null) {
                try {
                    const keyPair = await this.cryptoService.makeKeyPair();
                    await this.apiService.postAccountKeys(new KeysRequest(keyPair[0], keyPair[1].encryptedString));
                    tokenResponse.privateKey = keyPair[1].encryptedString;
                } catch (e) {
                    // tslint:disable-next-line
                    console.error(e);
                }
            }

            await this.cryptoService.setEncPrivateKey(tokenResponse.privateKey);
        }

        this.messagingService.send('loggedIn');
        return result;
    }

    private clearState(): void {
        this.email = null;
        this.masterPasswordHash = null;
        this.twoFactorProvidersData = null;
        this.selectedTwoFactorProviderType = null;
    }
}
