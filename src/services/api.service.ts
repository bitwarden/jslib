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
import { ImportDirectoryRequest } from '../models/request/importDirectoryRequest';
import { PasswordHintRequest } from '../models/request/passwordHintRequest';
import { PasswordRequest } from '../models/request/passwordRequest';
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
    private usingBaseUrl = false;

    constructor(private tokenService: TokenService, private platformUtilsService: PlatformUtilsService,
        private logoutCallback: (expired: boolean) => Promise<void>) {
        const device = platformUtilsService.getDevice();
        this.deviceType = device.toString();
        this.isWebClient = device === DeviceType.Web;
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
        // Desktop
        //this.apiBaseUrl = 'http://localhost:4000';
        //this.identityBaseUrl = 'http://localhost:33656';

        // Desktop HTTPS
        //this.apiBaseUrl = 'https://localhost:44377';
        //this.identityBaseUrl = 'https://localhost:44392';

        // Desktop external
        //this.apiBaseUrl = 'http://192.168.1.3:4000';
        //this.identityBaseUrl = 'http://192.168.1.3:33656';

        // Preview
        //this.apiBaseUrl = 'https://preview-api.bitwarden.com';
        //this.identityBaseUrl = 'https://preview-identity.bitwarden.com';

        // Production
        if (this.isWebClient) {
            this.apiBaseUrl = 'https://vault.bitwarden.com/api';
            this.identityBaseUrl = 'https://vault.bitwarden.com/identity';
        } else {
            this.apiBaseUrl = 'https://api.bitwarden.com';
            this.identityBaseUrl = 'https://identity.bitwarden.com';
        }
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
        const response = await fetch(new Request(this.apiBaseUrl + '/two-factor/send-email-login', {
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
        const response = await fetch(new Request(this.apiBaseUrl + '/accounts/profile', {
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

    async putProfile(request: UpdateProfileRequest): Promise<ProfileResponse> {
        const authHeader = await this.handleTokenState();
        const response = await fetch(new Request(this.apiBaseUrl + '/accounts/profile', {
            body: JSON.stringify(request),
            cache: 'no-cache',
            credentials: this.getCredentials(),
            headers: new Headers({
                'Accept': 'application/json',
                'Content-Type': 'application/json; charset=utf-8',
                'Authorization': authHeader,
                'Device-Type': this.deviceType,
            }),
            method: 'PUT',
        }));

        if (response.status === 200) {
            const responseJson = await response.json();
            return new ProfileResponse(responseJson);
        } else {
            const error = await this.handleError(response, false);
            return Promise.reject(error);
        }
    }

    async postEmailToken(request: EmailTokenRequest): Promise<any> {
        const authHeader = await this.handleTokenState();
        const response = await fetch(new Request(this.apiBaseUrl + '/accounts/email-token', {
            body: JSON.stringify(request),
            cache: 'no-cache',
            credentials: this.getCredentials(),
            headers: new Headers({
                'Accept': 'application/json',
                'Content-Type': 'application/json; charset=utf-8',
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

    async postEmail(request: EmailRequest): Promise<any> {
        const authHeader = await this.handleTokenState();
        const response = await fetch(new Request(this.apiBaseUrl + '/accounts/email', {
            body: JSON.stringify(request),
            cache: 'no-cache',
            credentials: this.getCredentials(),
            headers: new Headers({
                'Accept': 'application/json',
                'Content-Type': 'application/json; charset=utf-8',
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

    async postPassword(request: PasswordRequest): Promise<any> {
        const authHeader = await this.handleTokenState();
        const response = await fetch(new Request(this.apiBaseUrl + '/accounts/password', {
            body: JSON.stringify(request),
            cache: 'no-cache',
            credentials: this.getCredentials(),
            headers: new Headers({
                'Accept': 'application/json',
                'Content-Type': 'application/json; charset=utf-8',
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

    async getAccountRevisionDate(): Promise<number> {
        const authHeader = await this.handleTokenState();
        const response = await fetch(new Request(this.apiBaseUrl + '/accounts/revision-date', {
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
        const response = await fetch(new Request(this.apiBaseUrl + '/accounts/password-hint', {
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
        const response = await fetch(new Request(this.apiBaseUrl + '/accounts/register', {
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
        const response = await fetch(new Request(this.apiBaseUrl + '/folders', {
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
        const response = await fetch(new Request(this.apiBaseUrl + '/folders/' + id, {
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
        const response = await fetch(new Request(this.apiBaseUrl + '/folders/' + id, {
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
        const response = await fetch(new Request(this.apiBaseUrl + '/ciphers', {
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
        const response = await fetch(new Request(this.apiBaseUrl + '/ciphers/' + id, {
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
        const response = await fetch(new Request(this.apiBaseUrl + '/ciphers/' + id, {
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
        const response = await fetch(new Request(this.apiBaseUrl + '/ciphers', {
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
        const response = await fetch(new Request(this.apiBaseUrl + '/ciphers/move', {
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
        const response = await fetch(new Request(this.apiBaseUrl + '/ciphers/' + id + '/share', {
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
        const response = await fetch(new Request(this.apiBaseUrl + '/ciphers/share', {
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
        const response = await fetch(new Request(this.apiBaseUrl + '/ciphers/' + id + '/collections', {
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
        const response = await fetch(new Request(this.apiBaseUrl + '/ciphers/' + id + '/attachment', {
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
        const response = await fetch(new Request(this.apiBaseUrl + '/ciphers/' + id + '/attachment/' + attachmentId, {
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
        const response = await fetch(new Request(this.apiBaseUrl + '/ciphers/' + id + '/attachment/' +
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
        const response = await fetch(new Request(this.apiBaseUrl + '/sync', {
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
        const response = await fetch(new Request(this.apiBaseUrl + '/organizations/' + organizationId + '/import', {
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
