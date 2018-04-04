import { TwoFactorProviderType } from '../enums/twoFactorProviderType';

import { AuthResult } from '../models/domain/authResult';
import { SymmetricCryptoKey } from '../models/domain/symmetricCryptoKey';

import { DeviceRequest } from '../models/request/deviceRequest';
import { TokenRequest } from '../models/request/tokenRequest';

import { IdentityTokenResponse } from '../models/response/identityTokenResponse';
import { IdentityTwoFactorResponse } from '../models/response/identityTwoFactorResponse';

import { ConstantsService } from '../services/constants.service';

import { ApiService } from '../abstractions/api.service';
import { AppIdService } from '../abstractions/appId.service';
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
    },
    [TwoFactorProviderType.Yubikey]: {
        type: TwoFactorProviderType.Yubikey,
        name: null as string,
        description: null as string,
        priority: 3,
    },
    [TwoFactorProviderType.Duo]: {
        type: TwoFactorProviderType.Duo,
        name: 'Duo',
        description: null as string,
        priority: 2,
    },
    [TwoFactorProviderType.U2f]: {
        type: TwoFactorProviderType.U2f,
        name: null as string,
        description: null as string,
        priority: 4,
    },
    [TwoFactorProviderType.Email]: {
        type: TwoFactorProviderType.Email,
        name: null as string,
        description: null as string,
        priority: 0,
    },
    [TwoFactorProviderType.OrganizationDuo]: {
        type: TwoFactorProviderType.OrganizationDuo,
        name: 'Duo (Organization)',
        description: null as string,
        priority: 10,
    },
};

export class AuthService {
    email: string;
    masterPasswordHash: string;
    twoFactorProviders: Map<TwoFactorProviderType, { [key: string]: string; }>;
    selectedTwoFactorProviderType: TwoFactorProviderType = null;

    private key: SymmetricCryptoKey;

    constructor(private cryptoService: CryptoService, private apiService: ApiService, private userService: UserService,
        private tokenService: TokenService, private appIdService: AppIdService, private i18nService: I18nService,
        private platformUtilsService: PlatformUtilsService, private constantsService: ConstantsService,
        private messagingService: MessagingService) {
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

        TwoFactorProviders[TwoFactorProviderType.U2f].name = this.i18nService.t('u2fTitle');
        TwoFactorProviders[TwoFactorProviderType.U2f].description = this.i18nService.t('u2fDesc');

        TwoFactorProviders[TwoFactorProviderType.Yubikey].name = this.i18nService.t('yubiKeyTitle');
        TwoFactorProviders[TwoFactorProviderType.Yubikey].description = this.i18nService.t('yubiKeyDesc');
    }

    async logIn(email: string, masterPassword: string): Promise<AuthResult> {
        this.selectedTwoFactorProviderType = null;
        email = email.toLowerCase();
        const key = this.cryptoService.makeKey(masterPassword, email);
        const hashedPassword = await this.cryptoService.hashPassword(masterPassword, key);
        return await this.logInHelper(email, hashedPassword, key);
    }

    async logInTwoFactor(twoFactorProvider: TwoFactorProviderType, twoFactorToken: string,
        remember?: boolean): Promise<AuthResult> {
        return await this.logInHelper(this.email, this.masterPasswordHash, this.key, twoFactorProvider,
            twoFactorToken, remember);
    }

    logOut(callback: Function) {
        callback();
        this.messagingService.send('loggedOut');
    }

    getDefaultTwoFactorProvider(u2fSupported: boolean): TwoFactorProviderType {
        if (this.twoFactorProviders == null) {
            return null;
        }

        if (this.selectedTwoFactorProviderType != null &&
            this.twoFactorProviders.has(this.selectedTwoFactorProviderType)) {
            return this.selectedTwoFactorProviderType;
        }

        let providerType: TwoFactorProviderType = null;
        let providerPriority = -1;
        this.twoFactorProviders.forEach((value, type) => {
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
            request = new TokenRequest(email, hashedPassword, this.constantsService.twoFactorProvider.remember,
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
            this.key = key;
            this.twoFactorProviders = twoFactorResponse.twoFactorProviders2;
            result.twoFactorProviders = twoFactorResponse.twoFactorProviders2;
            return result;
        }

        const tokenResponse = response as IdentityTokenResponse;
        if (tokenResponse.twoFactorToken != null) {
            this.tokenService.setTwoFactorToken(tokenResponse.twoFactorToken, email);
        }

        await this.tokenService.setTokens(tokenResponse.accessToken, tokenResponse.refreshToken);
        await this.cryptoService.setKey(key);
        await this.cryptoService.setKeyHash(hashedPassword);
        await this.userService.setUserIdAndEmail(this.tokenService.getUserId(), this.tokenService.getEmail());
        await this.cryptoService.setEncKey(tokenResponse.key);
        await this.cryptoService.setEncPrivateKey(tokenResponse.privateKey);

        this.messagingService.send('loggedIn');
        return result;
    }

    private clearState(): void {
        this.email = null;
        this.masterPasswordHash = null;
        this.twoFactorProviders = null;
        this.selectedTwoFactorProviderType = null;
    }
}
