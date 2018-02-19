import { EnvironmentUrls } from '../models/domain';

import {
    CipherRequest,
    FolderRequest,
    PasswordHintRequest,
    RegisterRequest,
    TokenRequest,
    TwoFactorEmailRequest,
} from '../models/request';

import {
    CipherResponse,
    FolderResponse,
    IdentityTokenResponse,
    IdentityTwoFactorResponse,
    SyncResponse,
} from '../models/response';

export abstract class ApiService {
    urlsSet: boolean;
    baseUrl: string;
    identityBaseUrl: string;
    deviceType: string;
    logoutCallback: Function;

    setUrls: (urls: EnvironmentUrls) => void;
    postIdentityToken: (request: TokenRequest) => Promise<IdentityTokenResponse | IdentityTwoFactorResponse>;
    refreshIdentityToken: () => Promise<any>;
    postTwoFactorEmail: (request: TwoFactorEmailRequest) => Promise<any>;
    getAccountRevisionDate: () => Promise<number>;
    postPasswordHint: (request: PasswordHintRequest) => Promise<any>;
    postRegister: (request: RegisterRequest) => Promise<any>;
    postFolder: (request: FolderRequest) => Promise<FolderResponse>;
    putFolder: (id: string, request: FolderRequest) => Promise<FolderResponse>;
    deleteFolder: (id: string) => Promise<any>;
    postCipher: (request: CipherRequest) => Promise<CipherResponse>;
    putCipher: (id: string, request: CipherRequest) => Promise<CipherResponse>;
    deleteCipher: (id: string) => Promise<any>;
    postCipherAttachment: (id: string, data: FormData) => Promise<CipherResponse>;
    deleteCipherAttachment: (id: string, attachmentId: string) => Promise<any>;
    getSync: () => Promise<SyncResponse>;
}
