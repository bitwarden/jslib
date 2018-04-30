import { EnvironmentUrls } from '../models/domain/environmentUrls';

import { CipherRequest } from '../models/request/cipherRequest';
import { FolderRequest } from '../models/request/folderRequest';
import { ImportDirectoryRequest } from '../models/request/importDirectoryRequest';
import { PasswordHintRequest } from '../models/request/passwordHintRequest';
import { RegisterRequest } from '../models/request/registerRequest';
import { TokenRequest } from '../models/request/tokenRequest';
import { TwoFactorEmailRequest } from '../models/request/twoFactorEmailRequest';

import { CipherResponse } from '../models/response/cipherResponse';
import { FolderResponse } from '../models/response/folderResponse';
import { IdentityTokenResponse } from '../models/response/identityTokenResponse';
import { IdentityTwoFactorResponse } from '../models/response/identityTwoFactorResponse';
import { SyncResponse } from '../models/response/syncResponse';

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
    postImportDirectory: (organizationId: string, request: ImportDirectoryRequest) => Promise<any>;
}
