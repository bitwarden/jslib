import { ConstantsService } from './constants.service';

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
import { FolderRequest } from '../models/request/folderRequest';
import { ImportDirectoryRequest } from '../models/request/importDirectoryRequest';
import { PasswordHintRequest } from '../models/request/passwordHintRequest';
import { RegisterRequest } from '../models/request/registerRequest';
import { TokenRequest } from '../models/request/tokenRequest';
import { TwoFactorEmailRequest } from '../models/request/twoFactorEmailRequest';

import { CipherResponse } from '../models/response/cipherResponse';
import { ErrorResponse } from '../models/response/errorResponse';
import { FolderResponse } from '../models/response/folderResponse';
import { IdentityTokenResponse } from '../models/response/identityTokenResponse';
import { IdentityTwoFactorResponse } from '../models/response/identityTwoFactorResponse';
import { ProfileResponse } from '../models/response/profileResponse';
import { SyncResponse } from '../models/response/syncResponse';

export class ApiService implements ApiServiceAbstraction {
    urlsSet: boolean = false;
    baseUrl: string;
    identityBaseUrl: string;
    deviceType: string;
    isWebClient = false;
    usingBaseUrl = false;

    constructor(private tokenService: TokenService, private platformUtilsService: PlatformUtilsService,
        private logoutCallback: (expired: boolean) => Promise<void>) {
        this.deviceType = platformUtilsService.getDevice().toString();
        this.isWebClient = platformUtilsService.identityClientId === 'web';
    }

    setUrls(urls: EnvironmentUrls): void {
        this.urlsSet = true;

        if (urls.base != null) {
            this.usingBaseUrl = true;
            this.baseUrl = urls.base + '/api';
            this.identityBaseUrl = urls.base + '/identity';
            return;
        }

        if (urls.api != null && urls.identity != null) {
            this.baseUrl = urls.api;
            this.identityBaseUrl = urls.identity;
            return;
        }

        /* tslint:disable */
        // Desktop
        //this.baseUrl = 'http://localhost:4000';
        //this.identityBaseUrl = 'http://localhost:33656';

        // Desktop HTTPS
        //this.baseUrl = 'https://localhost:44377';
        //this.identityBaseUrl = 'https://localhost:44392';

        // Desktop external
        //this.baseUrl = 'http://192.168.1.3:4000';
        //this.identityBaseUrl = 'http://192.168.1.3:33656';

        // Preview
        //this.baseUrl = 'https://preview-api.bitwarden.com';
        //this.identityBaseUrl = 'https://preview-identity.bitwarden.com';

        // Production
        this.baseUrl = 'https://api.bitwarden.com';
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

    async postTwoFactorEmail(request: TwoFactorEmailRequest): Promise<any> {
        const response = await fetch(new Request(this.baseUrl + '/two-factor/send-email-login', {
            body: JSON.stringify(request),
            cache: 'no-cache',
            credentials: this.getCredentials(),
            headers: new Headers({
                'Content-Type': 'application/json; charset=utf-8',
                'Device-Type': this.deviceType,
            }),
            method: 'POST',
        }));

        if (response.status !== 200) {
            const error = await this.handleError(response, false);
            return Promise.reject(error);
        }
    }

    // Account APIs

    async getProfile(): Promise<ProfileResponse> {
        const authHeader = await this.handleTokenState();
        const response = await fetch(new Request(this.baseUrl + '/accounts/profile', {
            cache: 'no-cache',
            credentials: this.getCredentials(),
            headers: new Headers({
                'Accept': 'application/json',
                'Authorization': authHeader,
                'Device-Type': this.deviceType,
            }),
        }));

        if (response.status === 200) {
            const responseJson = await response.json();
            return new ProfileResponse(responseJson);
        } else {
            const error = await this.handleError(response, false);
            return Promise.reject(error);
        }
    }

    async getAccountRevisionDate(): Promise<number> {
        const authHeader = await this.handleTokenState();
        const response = await fetch(new Request(this.baseUrl + '/accounts/revision-date', {
            cache: 'no-cache',
            credentials: this.getCredentials(),
            headers: new Headers({
                'Accept': 'application/json',
                'Authorization': authHeader,
                'Device-Type': this.deviceType,
            }),
        }));

        if (response.status === 200) {
            return (await response.json() as number);
        } else {
            const error = await this.handleError(response, false);
            return Promise.reject(error);
        }
    }

    async postPasswordHint(request: PasswordHintRequest): Promise<any> {
        const response = await fetch(new Request(this.baseUrl + '/accounts/password-hint', {
            body: JSON.stringify(request),
            cache: 'no-cache',
            credentials: this.getCredentials(),
            headers: new Headers({
                'Content-Type': 'application/json; charset=utf-8',
                'Device-Type': this.deviceType,
            }),
            method: 'POST',
        }));

        if (response.status !== 200) {
            const error = await this.handleError(response, false);
            return Promise.reject(error);
        }
    }

    async postRegister(request: RegisterRequest): Promise<any> {
        const response = await fetch(new Request(this.baseUrl + '/accounts/register', {
            body: JSON.stringify(request),
            cache: 'no-cache',
            credentials: this.getCredentials(),
            headers: new Headers({
                'Content-Type': 'application/json; charset=utf-8',
                'Device-Type': this.deviceType,
            }),
            method: 'POST',
        }));

        if (response.status !== 200) {
            const error = await this.handleError(response, false);
            return Promise.reject(error);
        }
    }

    // Folder APIs

    async postFolder(request: FolderRequest): Promise<FolderResponse> {
        const authHeader = await this.handleTokenState();
        const response = await fetch(new Request(this.baseUrl + '/folders', {
            body: JSON.stringify(request),
            cache: 'no-cache',
            credentials: this.getCredentials(),
            headers: new Headers({
                'Accept': 'application/json',
                'Authorization': authHeader,
                'Content-Type': 'application/json; charset=utf-8',
                'Device-Type': this.deviceType,
            }),
            method: 'POST',
        }));

        if (response.status === 200) {
            const responseJson = await response.json();
            return new FolderResponse(responseJson);
        } else {
            const error = await this.handleError(response, false);
            return Promise.reject(error);
        }
    }

    async putFolder(id: string, request: FolderRequest): Promise<FolderResponse> {
        const authHeader = await this.handleTokenState();
        const response = await fetch(new Request(this.baseUrl + '/folders/' + id, {
            body: JSON.stringify(request),
            cache: 'no-cache',
            credentials: this.getCredentials(),
            headers: new Headers({
                'Accept': 'application/json',
                'Authorization': authHeader,
                'Content-Type': 'application/json; charset=utf-8',
                'Device-Type': this.deviceType,
            }),
            method: 'PUT',
        }));

        if (response.status === 200) {
            const responseJson = await response.json();
            return new FolderResponse(responseJson);
        } else {
            const error = await this.handleError(response, false);
            return Promise.reject(error);
        }
    }

    async deleteFolder(id: string): Promise<any> {
        const authHeader = await this.handleTokenState();
        const response = await fetch(new Request(this.baseUrl + '/folders/' + id, {
            cache: 'no-cache',
            credentials: this.getCredentials(),
            headers: new Headers({
                'Authorization': authHeader,
                'Device-Type': this.deviceType,
            }),
            method: 'DELETE',
        }));

        if (response.status !== 200) {
            const error = await this.handleError(response, false);
            return Promise.reject(error);
        }
    }

    // Cipher APIs

    async postCipher(request: CipherRequest): Promise<CipherResponse> {
        const authHeader = await this.handleTokenState();
        const response = await fetch(new Request(this.baseUrl + '/ciphers', {
            body: JSON.stringify(request),
            cache: 'no-cache',
            credentials: this.getCredentials(),
            headers: new Headers({
                'Accept': 'application/json',
                'Authorization': authHeader,
                'Content-Type': 'application/json; charset=utf-8',
                'Device-Type': this.deviceType,
            }),
            method: 'POST',
        }));

        if (response.status === 200) {
            const responseJson = await response.json();
            return new CipherResponse(responseJson);
        } else {
            const error = await this.handleError(response, false);
            return Promise.reject(error);
        }
    }

    async putCipher(id: string, request: CipherRequest): Promise<CipherResponse> {
        const authHeader = await this.handleTokenState();
        const response = await fetch(new Request(this.baseUrl + '/ciphers/' + id, {
            body: JSON.stringify(request),
            cache: 'no-cache',
            credentials: this.getCredentials(),
            headers: new Headers({
                'Accept': 'application/json',
                'Authorization': authHeader,
                'Content-Type': 'application/json; charset=utf-8',
                'Device-Type': this.deviceType,
            }),
            method: 'PUT',
        }));

        if (response.status === 200) {
            const responseJson = await response.json();
            return new CipherResponse(responseJson);
        } else {
            const error = await this.handleError(response, false);
            return Promise.reject(error);
        }
    }

    async deleteCipher(id: string): Promise<any> {
        const authHeader = await this.handleTokenState();
        const response = await fetch(new Request(this.baseUrl + '/ciphers/' + id, {
            cache: 'no-cache',
            credentials: this.getCredentials(),
            headers: new Headers({
                'Authorization': authHeader,
                'Device-Type': this.deviceType,
            }),
            method: 'DELETE',
        }));

        if (response.status !== 200) {
            const error = await this.handleError(response, false);
            return Promise.reject(error);
        }
    }

    async deleteManyCiphers(request: CipherBulkDeleteRequest): Promise<any> {
        const authHeader = await this.handleTokenState();
        const response = await fetch(new Request(this.baseUrl + '/ciphers', {
            body: JSON.stringify(request),
            cache: 'no-cache',
            credentials: this.getCredentials(),
            headers: new Headers({
                'Accept': 'application/json',
                'Authorization': authHeader,
                'Content-Type': 'application/json; charset=utf-8',
                'Device-Type': this.deviceType,
            }),
            method: 'DELETE',
        }));

        if (response.status !== 200) {
            const error = await this.handleError(response, false);
            return Promise.reject(error);
        }
    }

    async putMoveCiphers(request: CipherBulkMoveRequest): Promise<any> {
        const authHeader = await this.handleTokenState();
        const response = await fetch(new Request(this.baseUrl + '/ciphers/move', {
            body: JSON.stringify(request),
            cache: 'no-cache',
            credentials: this.getCredentials(),
            headers: new Headers({
                'Accept': 'application/json',
                'Authorization': authHeader,
                'Content-Type': 'application/json; charset=utf-8',
                'Device-Type': this.deviceType,
            }),
            method: 'PUT',
        }));

        if (response.status !== 200) {
            const error = await this.handleError(response, false);
            return Promise.reject(error);
        }
    }

    async putShareCipher(id: string, request: CipherShareRequest): Promise<any> {
        const authHeader = await this.handleTokenState();
        const response = await fetch(new Request(this.baseUrl + '/ciphers/' + id + '/share', {
            body: JSON.stringify(request),
            cache: 'no-cache',
            credentials: this.getCredentials(),
            headers: new Headers({
                'Accept': 'application/json',
                'Authorization': authHeader,
                'Content-Type': 'application/json; charset=utf-8',
                'Device-Type': this.deviceType,
            }),
            method: 'PUT',
        }));

        if (response.status !== 200) {
            const error = await this.handleError(response, false);
            return Promise.reject(error);
        }
    }

    async putShareCiphers(request: CipherBulkShareRequest): Promise<any> {
        const authHeader = await this.handleTokenState();
        const response = await fetch(new Request(this.baseUrl + '/ciphers/share', {
            body: JSON.stringify(request),
            cache: 'no-cache',
            credentials: this.getCredentials(),
            headers: new Headers({
                'Accept': 'application/json',
                'Authorization': authHeader,
                'Content-Type': 'application/json; charset=utf-8',
                'Device-Type': this.deviceType,
            }),
            method: 'PUT',
        }));

        if (response.status !== 200) {
            const error = await this.handleError(response, false);
            return Promise.reject(error);
        }
    }

    async putCipherCollections(id: string, request: CipherCollectionsRequest): Promise<any> {
        const authHeader = await this.handleTokenState();
        const response = await fetch(new Request(this.baseUrl + '/ciphers/' + id + '/collections', {
            body: JSON.stringify(request),
            cache: 'no-cache',
            credentials: this.getCredentials(),
            headers: new Headers({
                'Accept': 'application/json',
                'Authorization': authHeader,
                'Content-Type': 'application/json; charset=utf-8',
                'Device-Type': this.deviceType,
            }),
            method: 'PUT',
        }));

        if (response.status !== 200) {
            const error = await this.handleError(response, false);
            return Promise.reject(error);
        }
    }

    // Attachments APIs

    async postCipherAttachment(id: string, data: FormData): Promise<CipherResponse> {
        const authHeader = await this.handleTokenState();
        const response = await fetch(new Request(this.baseUrl + '/ciphers/' + id + '/attachment', {
            body: data,
            cache: 'no-cache',
            credentials: this.getCredentials(),
            headers: new Headers({
                'Accept': 'application/json',
                'Authorization': authHeader,
                'Device-Type': this.deviceType,
            }),
            method: 'POST',
        }));

        if (response.status === 200) {
            const responseJson = await response.json();
            return new CipherResponse(responseJson);
        } else {
            const error = await this.handleError(response, false);
            return Promise.reject(error);
        }
    }

    async deleteCipherAttachment(id: string, attachmentId: string): Promise<any> {
        const authHeader = await this.handleTokenState();
        const response = await fetch(new Request(this.baseUrl + '/ciphers/' + id + '/attachment/' + attachmentId, {
            cache: 'no-cache',
            credentials: this.getCredentials(),
            headers: new Headers({
                'Authorization': authHeader,
                'Device-Type': this.deviceType,
            }),
            method: 'DELETE',
        }));

        if (response.status !== 200) {
            const error = await this.handleError(response, false);
            return Promise.reject(error);
        }
    }

    async postShareCipherAttachment(id: string, attachmentId: string, data: FormData,
        organizationId: string): Promise<any> {
        const authHeader = await this.handleTokenState();
        const response = await fetch(new Request(this.baseUrl + '/ciphers/' + id + '/attachment/' +
            attachmentId + '/share?organizationId=' + organizationId, {
                body: data,
                cache: 'no-cache',
                credentials: this.getCredentials(),
                headers: new Headers({
                    'Accept': 'application/json',
                    'Authorization': authHeader,
                    'Device-Type': this.deviceType,
                }),
                method: 'POST',
            }));

        if (response.status !== 200) {
            const error = await this.handleError(response, false);
            return Promise.reject(error);
        }
    }

    // Sync APIs

    async getSync(): Promise<SyncResponse> {
        const authHeader = await this.handleTokenState();
        const response = await fetch(new Request(this.baseUrl + '/sync', {
            cache: 'no-cache',
            credentials: this.getCredentials(),
            headers: new Headers({
                'Accept': 'application/json',
                'Authorization': authHeader,
                'Device-Type': this.deviceType,
            }),
        }));

        if (response.status === 200) {
            const responseJson = await response.json();
            return new SyncResponse(responseJson);
        } else {
            const error = await this.handleError(response, false);
            return Promise.reject(error);
        }
    }

    async postImportDirectory(organizationId: string, request: ImportDirectoryRequest): Promise<any> {
        const authHeader = await this.handleTokenState();
        const response = await fetch(new Request(this.baseUrl + '/organizations/' + organizationId + '/import', {
            body: JSON.stringify(request),
            cache: 'no-cache',
            credentials: this.getCredentials(),
            headers: new Headers({
                'Accept': 'application/json',
                'Authorization': authHeader,
                'Content-Type': 'application/json; charset=utf-8',
                'Device-Type': this.deviceType,
            }),
            method: 'POST',
        }));

        if (response.status !== 200) {
            const error = await this.handleError(response, false);
            return Promise.reject(error);
        }
    }

    // Helpers

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
