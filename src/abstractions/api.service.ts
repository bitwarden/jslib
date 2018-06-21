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
import { PasswordVerificationRequest } from '../models/request/passwordVerificationRequest';
import { RegisterRequest } from '../models/request/registerRequest';
import { TokenRequest } from '../models/request/tokenRequest';
import { TwoFactorEmailRequest } from '../models/request/twoFactorEmailRequest';
import { UpdateProfileRequest } from '../models/request/updateProfileRequest';

import { CipherResponse } from '../models/response/cipherResponse';
import { FolderResponse } from '../models/response/folderResponse';
import { IdentityTokenResponse } from '../models/response/identityTokenResponse';
import { IdentityTwoFactorResponse } from '../models/response/identityTwoFactorResponse';
import { ProfileResponse } from '../models/response/profileResponse';
import { SyncResponse } from '../models/response/syncResponse';

export abstract class ApiService {
    urlsSet: boolean;
    apiBaseUrl: string;
    identityBaseUrl: string;

    setUrls: (urls: EnvironmentUrls) => void;
    postIdentityToken: (request: TokenRequest) => Promise<IdentityTokenResponse | IdentityTwoFactorResponse>;
    refreshIdentityToken: () => Promise<any>;
    postTwoFactorEmail: (request: TwoFactorEmailRequest) => Promise<any>;
    getProfile: () => Promise<ProfileResponse>;
    putProfile: (request: UpdateProfileRequest) => Promise<ProfileResponse>;
    postEmailToken: (request: EmailTokenRequest) => Promise<any>;
    postEmail: (request: EmailRequest) => Promise<any>;
    postPassword: (request: PasswordRequest) => Promise<any>;
    postSecurityStamp: (request: PasswordVerificationRequest) => Promise<any>;
    postDeleteAccount: (request: PasswordVerificationRequest) => Promise<any>;
    getAccountRevisionDate: () => Promise<number>;
    postPasswordHint: (request: PasswordHintRequest) => Promise<any>;
    postRegister: (request: RegisterRequest) => Promise<any>;
    postFolder: (request: FolderRequest) => Promise<FolderResponse>;
    putFolder: (id: string, request: FolderRequest) => Promise<FolderResponse>;
    deleteFolder: (id: string) => Promise<any>;
    postCipher: (request: CipherRequest) => Promise<CipherResponse>;
    putCipher: (id: string, request: CipherRequest) => Promise<CipherResponse>;
    deleteCipher: (id: string) => Promise<any>;
    deleteManyCiphers: (request: CipherBulkDeleteRequest) => Promise<any>;
    putMoveCiphers: (request: CipherBulkMoveRequest) => Promise<any>;
    putShareCipher: (id: string, request: CipherShareRequest) => Promise<any>;
    putShareCiphers: (request: CipherBulkShareRequest) => Promise<any>;
    putCipherCollections: (id: string, request: CipherCollectionsRequest) => Promise<any>;
    postPurgeCiphers: (request: PasswordVerificationRequest) => Promise<any>;
    postCipherAttachment: (id: string, data: FormData) => Promise<CipherResponse>;
    deleteCipherAttachment: (id: string, attachmentId: string) => Promise<any>;
    postShareCipherAttachment: (id: string, attachmentId: string, data: FormData,
        organizationId: string) => Promise<any>;
    getSync: () => Promise<SyncResponse>;
    postImportDirectory: (organizationId: string, request: ImportDirectoryRequest) => Promise<any>;
}
