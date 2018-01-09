import { EnvironmentUrls } from '../models/domain/environmentUrls';

import { CipherRequest } from '../models/request/cipherRequest';
import { FolderRequest } from '../models/request/folderRequest';
import { PasswordHintRequest } from '../models/request/passwordHintRequest';
import { RegisterRequest } from '../models/request/registerRequest';
import { TokenRequest } from '../models/request/tokenRequest';
import { TwoFactorEmailRequest } from '../models/request/twoFactorEmailRequest';

import { CipherResponse } from '../models/response/cipherResponse';
import { FolderResponse } from '../models/response/folderResponse';
import { IdentityTokenResponse } from '../models/response/identityTokenResponse';
import { SyncResponse } from '../models/response/syncResponse';

export interface ApiService {
    urlsSet: boolean;
    baseUrl: string;
    identityBaseUrl: string;
    deviceType: string;
    logoutCallback: Function;
    setUrls(urls: EnvironmentUrls);
    postIdentityToken(request: TokenRequest): Promise<IdentityTokenResponse | any>;
    refreshIdentityToken(): Promise<any>;
    postTwoFactorEmail(request: TwoFactorEmailRequest): Promise<any>;
    getAccountRevisionDate(): Promise<number>;
    postPasswordHint(request: PasswordHintRequest): Promise<any>;
    postRegister(request: RegisterRequest): Promise<any>;
    postFolder(request: FolderRequest): Promise<FolderResponse>;
    putFolder(id: string, request: FolderRequest): Promise<FolderResponse>;
    deleteFolder(id: string): Promise<any>;
    postCipher(request: CipherRequest): Promise<CipherResponse>;
    putCipher(id: string, request: CipherRequest): Promise<CipherResponse>;
    deleteCipher(id: string): Promise<any>;
    postCipherAttachment(id: string, data: FormData): Promise<CipherResponse>;
    deleteCipherAttachment(id: string, attachmentId: string): Promise<any>;
    getSync(): Promise<SyncResponse>;
}
