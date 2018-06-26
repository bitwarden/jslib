import { DeviceType } from '../enums/deviceType';

import { ApiService as ApiServiceAbstraction } from '../abstractions/api.service';
import { PlatformUtilsService } from '../abstractions/platformUtils.service';
import { TokenService } from '../abstractions/token.service';

import { EnvironmentUrls } from '../models/domain/environmentUrls';

import { CipherBulkDeleteRequest } from '../models/request/cipherBulkDeleteRequest';
import { CipherBulkMoveRequest } from '../models/request/cipherBulkMoveRequest';
import { CipherBulkShareRequest } from '../models/request/cipherBulkShareRequest';
import { CipherCollectionsRequest } from '../models/request/cipherCollectionsRequest';
import { CipherRequest } from '../models/request/cipherRequest';
import { CipherShareRequest } from '../models/request/cipherShareRequest';
import { EmailRequest } from '../models/request/emailRequest';
import { EmailTokenRequest } from '../models/request/emailTokenRequest';
import { FolderRequest } from '../models/request/folderRequest';
import { ImportCiphersRequest } from '../models/request/importCiphersRequest';
import { ImportDirectoryRequest } from '../models/request/importDirectoryRequest';
import { ImportOrganizationCiphersRequest } from '../models/request/importOrganizationCiphersRequest';
import { PasswordHintRequest } from '../models/request/passwordHintRequest';
import { PasswordRequest } from '../models/request/passwordRequest';
import { PasswordVerificationRequest } from '../models/request/passwordVerificationRequest';
import { RegisterRequest } from '../models/request/registerRequest';
import { TokenRequest } from '../models/request/tokenRequest';
import { TwoFactorEmailRequest } from '../models/request/twoFactorEmailRequest';
import { UpdateProfileRequest } from '../models/request/updateProfileRequest';

import { CipherResponse } from '../models/response/cipherResponse';
import { ErrorResponse } from '../models/response/errorResponse';
import { FolderResponse } from '../models/response/folderResponse';
import { IdentityTokenResponse } from '../models/response/identityTokenResponse';
import { IdentityTwoFactorResponse } from '../models/response/identityTwoFactorResponse';
import { ProfileResponse } from '../models/response/profileResponse';
import { SyncResponse } from '../models/response/syncResponse';

export class ApiService implements ApiServiceAbstraction {
    urlsSet: boolean = false;
    apiBaseUrl: string;
    identityBaseUrl: string;

    private deviceType: string;
    private isWebClient = false;
    private isDesktopClient = false;
    private usingBaseUrl = false;

    constructor(private tokenService: TokenService, private platformUtilsService: PlatformUtilsService,
        private logoutCallback: (expired: boolean) => Promise<void>) {
        const device = platformUtilsService.getDevice();
        this.deviceType = device.toString();
        this.isWebClient = device === DeviceType.Web;
        this.isDesktopClient = device === DeviceType.Windows || device === DeviceType.MacOs ||
            device === DeviceType.Linux;
    }

    setUrls(urls: EnvironmentUrls): void {
        this.urlsSet = true;

        if (urls.base != null) {
            this.usingBaseUrl = true;
            this.apiBaseUrl = urls.base + '/api';
            this.identityBaseUrl = urls.base + '/identity';
            return;
        }

        if (urls.api != null && urls.identity != null) {
            this.apiBaseUrl = urls.api;
            this.identityBaseUrl = urls.identity;
            return;
        }

        /* tslint:disable */
        // Local Dev
        //this.apiBaseUrl = 'http://localhost:4000';
        //this.identityBaseUrl = 'http://localhost:33656';

        // Production
        this.apiBaseUrl = 'https://api.bitwarden.com';
        this.identityBaseUrl = 'https://identity.bitwarden.com';
        /* tslint:enable */
    }

    // Auth APIs

    async postIdentityToken(request: TokenRequest): Promise<IdentityTokenResponse | IdentityTwoFactorResponse> {
        const response = await fetch(new Request(this.identityBaseUrl + '/connect/token', {
            body: this.qsStringify(request.toIdentityToken(this.platformUtilsService.identityClientId)),
            credentials: this.getCredentials(),
            cache: 'no-cache',
            headers: new Headers({
                'Content-Type': 'application/x-www-form-urlencoded; charset=utf-8',
                'Accept': 'application/json',
                'Device-Type': this.deviceType,
            }),
            method: 'POST',
        }));

        let responseJson: any = null;
        const typeHeader = response.headers.get('content-type');
        if (typeHeader != null && typeHeader.indexOf('application/json') > -1) {
            responseJson = await response.json();
        }

        if (responseJson != null) {
            if (response.status === 200) {
                return new IdentityTokenResponse(responseJson);
            } else if (response.status === 400 && responseJson.TwoFactorProviders2 &&
                Object.keys(responseJson.TwoFactorProviders2).length) {
                await this.tokenService.clearTwoFactorToken(request.email);
                return new IdentityTwoFactorResponse(responseJson);
            }
        }

        return Promise.reject(new ErrorResponse(responseJson, response.status, true));
    }

    async refreshIdentityToken(): Promise<any> {
        try {
            await this.doRefreshToken();
        } catch (e) {
            return Promise.reject(null);
        }
    }

    // Two Factor APIs

    postTwoFactorEmail(request: TwoFactorEmailRequest): Promise<any> {
        return this.send('POST', '/two-factor/send-email-login', request, false, false);
    }

    // Account APIs

    async getProfile(): Promise<ProfileResponse> {
        const r = await this.send('GET', '/accounts/profile', null, true, true);
        return new ProfileResponse(r);
    }

    async putProfile(request: UpdateProfileRequest): Promise<ProfileResponse> {
        const r = await this.send('PUT', '/accounts/profile', request, true, true);
        return new ProfileResponse(r);
    }

    postEmailToken(request: EmailTokenRequest): Promise<any> {
        return this.send('POST', '/accounts/email-token', request, true, false);
    }

    postEmail(request: EmailRequest): Promise<any> {
        return this.send('POST', '/accounts/email', request, true, false);
    }

    postPassword(request: PasswordRequest): Promise<any> {
        return this.send('POST', '/accounts/password', request, true, false);
    }

    postSecurityStamp(request: PasswordVerificationRequest): Promise<any> {
        return this.send('POST', '/accounts/security-stamp', request, true, false);
    }

    postDeleteAccount(request: PasswordVerificationRequest): Promise<any> {
        return this.send('POST', '/accounts/delete', request, true, false);
    }

    async getAccountRevisionDate(): Promise<number> {
        const r = await this.send('GET', '/accounts/revision-date', null, true, true);
        return r as number;
    }

    postPasswordHint(request: PasswordHintRequest): Promise<any> {
        return this.send('POST', '/accounts/password-hint', request, false, false);
    }

    postRegister(request: RegisterRequest): Promise<any> {
        return this.send('POST', '/accounts/register', request, false, false);
    }

    // Folder APIs

    async postFolder(request: FolderRequest): Promise<FolderResponse> {
        const r = await this.send('POST', '/folders', request, true, true);
        return new FolderResponse(r);
    }

    async putFolder(id: string, request: FolderRequest): Promise<FolderResponse> {
        const r = await this.send('PUT', '/folders/' + id, request, true, true);
        return new FolderResponse(r);
    }

    deleteFolder(id: string): Promise<any> {
        return this.send('DELETE', '/folders/' + id, null, true, false);
    }

    // Cipher APIs

    async postCipher(request: CipherRequest): Promise<CipherResponse> {
        const r = await this.send('POST', '/ciphers', request, true, true);
        return new CipherResponse(r);
    }

    async putCipher(id: string, request: CipherRequest): Promise<CipherResponse> {
        const r = await this.send('PUT', '/ciphers/' + id, request, true, true);
        return new CipherResponse(r);
    }

    deleteCipher(id: string): Promise<any> {
        return this.send('DELETE', '/ciphers/' + id, null, true, false);
    }

    deleteManyCiphers(request: CipherBulkDeleteRequest): Promise<any> {
        return this.send('DELETE', '/ciphers', request, true, false);
    }

    putMoveCiphers(request: CipherBulkMoveRequest): Promise<any> {
        return this.send('PUT', '/ciphers/move', request, true, false);
    }

    putShareCipher(id: string, request: CipherShareRequest): Promise<any> {
        return this.send('PUT', '/ciphers/' + id + '/share', request, true, false);
    }

    putShareCiphers(request: CipherBulkShareRequest): Promise<any> {
        return this.send('PUT', '/ciphers/share', request, true, false);
    }

    putCipherCollections(id: string, request: CipherCollectionsRequest): Promise<any> {
        return this.send('PUT', '/ciphers/' + id + '/collections', request, true, false);
    }

    postPurgeCiphers(request: PasswordVerificationRequest): Promise<any> {
        return this.send('POST', '/ciphers/purge', request, true, false);
    }

    postImportCiphers(request: ImportCiphersRequest): Promise<any> {
        return this.send('POST', '/ciphers/import', request, true, false);
    }

    postImportOrganizationCiphers(request: ImportOrganizationCiphersRequest): Promise<any> {
        return this.send('POST', '/ciphers/import-organization', request, true, false);
    }

    // Attachments APIs

    async postCipherAttachment(id: string, data: FormData): Promise<CipherResponse> {
        const r = await this.send('POST', '/ciphers/' + id + '/attachment', data, true, true);
        return new CipherResponse(r);
    }

    deleteCipherAttachment(id: string, attachmentId: string): Promise<any> {
        return this.send('DELETE', '/ciphers/' + id + '/attachment/' + attachmentId, null, true, false);
    }

    postShareCipherAttachment(id: string, attachmentId: string, data: FormData,
        organizationId: string): Promise<any> {
        return this.send('POST', '/ciphers/' + id + '/attachment/' +
            attachmentId + '/share?organizationId=' + organizationId, data, true, false);
    }

    // Sync APIs

    async getSync(): Promise<SyncResponse> {
        const path = this.isDesktopClient || this.isWebClient ? '/sync?excludeDomains=true' : '/sync';
        const r = await this.send('GET', path, null, true, true);
        return new SyncResponse(r);
    }

    async postImportDirectory(organizationId: string, request: ImportDirectoryRequest): Promise<any> {
        return this.send('POST', '/organizations/' + organizationId + '/import', request, true, false);
    }

    // Helpers

    private async send(method: 'GET' | 'POST' | 'PUT' | 'DELETE', path: string, body: any,
        authed: boolean, hasResponse: boolean): Promise<any> {
        const headers = new Headers({
            'Device-Type': this.deviceType,
        });

        const requestInit: RequestInit = {
            cache: 'no-cache',
            credentials: this.getCredentials(),
            method: method,
        };

        if (authed) {
            const authHeader = await this.handleTokenState();
            headers.set('Authorization', authHeader);
        }
        if (body != null) {
            if (typeof body === 'string') {
                requestInit.body = body;
                headers.set('Content-Type', 'application/x-www-form-urlencoded; charset=utf-8');
            } else if (typeof body === 'object') {
                if (body instanceof FormData) {
                    requestInit.body = body;
                } else {
                    headers.set('Content-Type', 'application/json; charset=utf-8');
                    requestInit.body = JSON.stringify(body);
                }
            }
        }
        if (hasResponse) {
            headers.set('Accept', 'application/json');
        }

        requestInit.headers = headers;
        const response = await fetch(new Request(this.apiBaseUrl + path, requestInit));

        if (hasResponse && response.status === 200) {
            const responseJson = await response.json();
            return responseJson;
        } else if (response.status !== 200) {
            const error = await this.handleError(response, false);
            return Promise.reject(error);
        }
    }

    private async handleError(response: Response, tokenError: boolean): Promise<ErrorResponse> {
        if ((tokenError && response.status === 400) || response.status === 401 || response.status === 403) {
            await this.logoutCallback(true);
            return null;
        }

        let responseJson: any = null;
        const typeHeader = response.headers.get('content-type');
        if (typeHeader != null && typeHeader.indexOf('application/json') > -1) {
            responseJson = await response.json();
        }

        return new ErrorResponse(responseJson, response.status, tokenError);
    }

    private async handleTokenState(): Promise<string> {
        let accessToken = await this.tokenService.getToken();
        if (this.tokenService.tokenNeedsRefresh()) {
            const tokenResponse = await this.doRefreshToken();
            accessToken = tokenResponse.accessToken;
        }

        return 'Bearer ' + accessToken;
    }

    private async doRefreshToken(): Promise<IdentityTokenResponse> {
        const refreshToken = await this.tokenService.getRefreshToken();
        if (refreshToken == null || refreshToken === '') {
            throw new Error();
        }

        const decodedToken = this.tokenService.decodeToken();
        const response = await fetch(new Request(this.identityBaseUrl + '/connect/token', {
            body: this.qsStringify({
                grant_type: 'refresh_token',
                client_id: decodedToken.client_id,
                refresh_token: refreshToken,
            }),
            cache: 'no-cache',
            credentials: this.getCredentials(),
            headers: new Headers({
                'Content-Type': 'application/x-www-form-urlencoded; charset=utf-8',
                'Accept': 'application/json',
                'Device-Type': this.deviceType,
            }),
            method: 'POST',
        }));

        if (response.status === 200) {
            const responseJson = await response.json();
            const tokenResponse = new IdentityTokenResponse(responseJson);
            await this.tokenService.setTokens(tokenResponse.accessToken, tokenResponse.refreshToken);
            return tokenResponse;
        } else {
            const error = await this.handleError(response, true);
            return Promise.reject(error);
        }
    }

    private qsStringify(params: any): string {
        return Object.keys(params).map((key) => {
            return encodeURIComponent(key) + '=' + encodeURIComponent(params[key]);
        }).join('&');
    }

    private getCredentials(): RequestCredentials {
        if (!this.isWebClient || this.usingBaseUrl) {
            return 'include';
        }
        return undefined;
    }
}
