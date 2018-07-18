import { EnvironmentUrls } from '../models/domain/environmentUrls';

import { CipherBulkDeleteRequest } from '../models/request/cipherBulkDeleteRequest';
import { CipherBulkMoveRequest } from '../models/request/cipherBulkMoveRequest';
import { CipherBulkShareRequest } from '../models/request/cipherBulkShareRequest';
import { CipherCollectionsRequest } from '../models/request/cipherCollectionsRequest';
import { CipherRequest } from '../models/request/cipherRequest';
import { CipherShareRequest } from '../models/request/cipherShareRequest';
import { CollectionRequest } from '../models/request/collectionRequest';
import { DeleteRecoverRequest } from '../models/request/deleteRecoverRequest';
import { EmailRequest } from '../models/request/emailRequest';
import { EmailTokenRequest } from '../models/request/emailTokenRequest';
import { FolderRequest } from '../models/request/folderRequest';
import { GroupRequest } from '../models/request/groupRequest';
import { ImportCiphersRequest } from '../models/request/importCiphersRequest';
import { ImportDirectoryRequest } from '../models/request/importDirectoryRequest';
import { ImportOrganizationCiphersRequest } from '../models/request/importOrganizationCiphersRequest';
import { KeysRequest } from '../models/request/keysRequest';
import { OrganizationCreateRequest } from '../models/request/organizationCreateRequest';
import { OrganizationUpdateRequest } from '../models/request/organizationUpdateRequest';
import { OrganizationUserAcceptRequest } from '../models/request/organizationUserAcceptRequest';
import { OrganizationUserConfirmRequest } from '../models/request/organizationUserConfirmRequest';
import { OrganizationUserInviteRequest } from '../models/request/organizationUserInviteRequest';
import { OrganizationUserUpdateGroupsRequest } from '../models/request/organizationUserUpdateGroupsRequest';
import { OrganizationUserUpdateRequest } from '../models/request/organizationUserUpdateRequest';
import { PasswordHintRequest } from '../models/request/passwordHintRequest';
import { PasswordRequest } from '../models/request/passwordRequest';
import { PasswordVerificationRequest } from '../models/request/passwordVerificationRequest';
import { PaymentRequest } from '../models/request/paymentRequest';
import { RegisterRequest } from '../models/request/registerRequest';
import { SeatRequest } from '../models/request/seatRequest';
import { StorageRequest } from '../models/request/storageRequest';
import { TokenRequest } from '../models/request/tokenRequest';
import { TwoFactorEmailRequest } from '../models/request/twoFactorEmailRequest';
import { TwoFactorProviderRequest } from '../models/request/twoFactorProviderRequest';
import { TwoFactorRecoveryRequest } from '../models/request/twoFactorRecoveryRequest';
import { UpdateDomainsRequest } from '../models/request/updateDomainsRequest';
import { UpdateKeyRequest } from '../models/request/updateKeyRequest';
import { UpdateProfileRequest } from '../models/request/updateProfileRequest';
import { UpdateTwoFactorAuthenticatorRequest } from '../models/request/updateTwoFactorAuthenticatorRequest';
import { UpdateTwoFactorDuoRequest } from '../models/request/updateTwoFactorDuoRequest';
import { UpdateTwoFactorEmailRequest } from '../models/request/updateTwoFactorEmailRequest';
import { UpdateTwoFactorU2fRequest } from '../models/request/updateTwoFactorU2fRequest';
import { UpdateTwoFactorYubioOtpRequest } from '../models/request/updateTwoFactorYubioOtpRequest';
import { VerifyBankRequest } from '../models/request/verifyBankRequest';
import { VerifyDeleteRecoverRequest } from '../models/request/verifyDeleteRecoverRequest';
import { VerifyEmailRequest } from '../models/request/verifyEmailRequest';

import { BillingResponse } from '../models/response/billingResponse';
import { CipherResponse } from '../models/response/cipherResponse';
import {
    CollectionGroupDetailsResponse,
    CollectionResponse,
} from '../models/response/collectionResponse';
import { CollectionUserResponse } from '../models/response/collectionUserResponse';
import { DomainsResponse } from '../models/response/domainsResponse';
import { EventResponse } from '../models/response/eventResponse';
import { FolderResponse } from '../models/response/folderResponse';
import {
    GroupDetailsResponse,
    GroupResponse,
} from '../models/response/groupResponse';
import { GroupUserResponse } from '../models/response/groupUserResponse';
import { IdentityTokenResponse } from '../models/response/identityTokenResponse';
import { IdentityTwoFactorResponse } from '../models/response/identityTwoFactorResponse';
import { ListResponse } from '../models/response/listResponse';
import { OrganizationBillingResponse } from '../models/response/organizationBillingResponse';
import { OrganizationResponse } from '../models/response/organizationResponse';
import {
    OrganizationUserDetailsResponse,
    OrganizationUserUserDetailsResponse,
} from '../models/response/organizationUserResponse';
import { ProfileResponse } from '../models/response/profileResponse';
import { SyncResponse } from '../models/response/syncResponse';
import { TwoFactorAuthenticatorResponse } from '../models/response/twoFactorAuthenticatorResponse';
import { TwoFactorDuoResponse } from '../models/response/twoFactorDuoResponse';
import { TwoFactorEmailResponse } from '../models/response/twoFactorEmailResponse';
import { TwoFactorProviderResponse } from '../models/response/twoFactorProviderResponse';
import { TwoFactorRecoverResponse } from '../models/response/twoFactorRescoverResponse';
import { TwoFactorU2fResponse } from '../models/response/twoFactorU2fResponse';
import { TwoFactorYubiKeyResponse } from '../models/response/twoFactorYubiKeyResponse';
import { UserKeyResponse } from '../models/response/userKeyResponse';

export abstract class ApiService {
    urlsSet: boolean;
    apiBaseUrl: string;
    identityBaseUrl: string;

    setUrls: (urls: EnvironmentUrls) => void;
    postIdentityToken: (request: TokenRequest) => Promise<IdentityTokenResponse | IdentityTwoFactorResponse>;
    refreshIdentityToken: () => Promise<any>;

    getProfile: () => Promise<ProfileResponse>;
    getUserBilling: () => Promise<BillingResponse>;
    putProfile: (request: UpdateProfileRequest) => Promise<ProfileResponse>;
    postEmailToken: (request: EmailTokenRequest) => Promise<any>;
    postEmail: (request: EmailRequest) => Promise<any>;
    postPassword: (request: PasswordRequest) => Promise<any>;
    postSecurityStamp: (request: PasswordVerificationRequest) => Promise<any>;
    deleteAccount: (request: PasswordVerificationRequest) => Promise<any>;
    getAccountRevisionDate: () => Promise<number>;
    postPasswordHint: (request: PasswordHintRequest) => Promise<any>;
    postRegister: (request: RegisterRequest) => Promise<any>;
    postPremium: (data: FormData) => Promise<any>;
    postReinstatePremium: () => Promise<any>;
    postCancelPremium: () => Promise<any>;
    postAccountStorage: (request: StorageRequest) => Promise<any>;
    postAccountPayment: (request: PaymentRequest) => Promise<any>;
    postAccountLicense: (data: FormData) => Promise<any>;
    postAccountKey: (request: UpdateKeyRequest) => Promise<any>;
    postAccountKeys: (request: KeysRequest) => Promise<any>;
    postAccountVerifyEmail: () => Promise<any>;
    postAccountVerifyEmailToken: (request: VerifyEmailRequest) => Promise<any>;
    postAccountRecoverDelete: (request: DeleteRecoverRequest) => Promise<any>;
    postAccountRecoverDeleteToken: (request: VerifyDeleteRecoverRequest) => Promise<any>;

    postFolder: (request: FolderRequest) => Promise<FolderResponse>;
    putFolder: (id: string, request: FolderRequest) => Promise<FolderResponse>;
    deleteFolder: (id: string) => Promise<any>;

    getCipher: (id: string) => Promise<CipherResponse>;
    getCipherAdmin: (id: string) => Promise<CipherResponse>;
    getCiphersOrganization: (organizationId: string) => Promise<ListResponse<CipherResponse>>;
    postCipher: (request: CipherRequest) => Promise<CipherResponse>;
    postCipherAdmin: (request: CipherRequest) => Promise<CipherResponse>;
    putCipher: (id: string, request: CipherRequest) => Promise<CipherResponse>;
    putCipherAdmin: (id: string, request: CipherRequest) => Promise<CipherResponse>;
    deleteCipher: (id: string) => Promise<any>;
    deleteCipherAdmin: (id: string) => Promise<any>;
    deleteManyCiphers: (request: CipherBulkDeleteRequest) => Promise<any>;
    putMoveCiphers: (request: CipherBulkMoveRequest) => Promise<any>;
    putShareCipher: (id: string, request: CipherShareRequest) => Promise<any>;
    putShareCiphers: (request: CipherBulkShareRequest) => Promise<any>;
    putCipherCollections: (id: string, request: CipherCollectionsRequest) => Promise<any>;
    putCipherCollectionsAdmin: (id: string, request: CipherCollectionsRequest) => Promise<any>;
    postPurgeCiphers: (request: PasswordVerificationRequest) => Promise<any>;
    postImportCiphers: (request: ImportCiphersRequest) => Promise<any>;
    postImportOrganizationCiphers: (organizationId: string, request: ImportOrganizationCiphersRequest) => Promise<any>;

    postCipherAttachment: (id: string, data: FormData) => Promise<CipherResponse>;
    postCipherAttachmentAdmin: (id: string, data: FormData) => Promise<CipherResponse>;
    deleteCipherAttachment: (id: string, attachmentId: string) => Promise<any>;
    deleteCipherAttachmentAdmin: (id: string, attachmentId: string) => Promise<any>;
    postShareCipherAttachment: (id: string, attachmentId: string, data: FormData,
        organizationId: string) => Promise<any>;

    getCollectionDetails: (organizationId: string, id: string) => Promise<CollectionGroupDetailsResponse>;
    getCollections: (organizationId: string) => Promise<ListResponse<CollectionResponse>>;
    getCollectionUsers: (organizationId: string, id: string) => Promise<ListResponse<CollectionUserResponse>>;
    postCollection: (organizationId: string, request: CollectionRequest) => Promise<CollectionResponse>;
    putCollection: (organizationId: string, id: string, request: CollectionRequest) => Promise<CollectionResponse>;
    deleteCollection: (organizationId: string, id: string) => Promise<any>;
    deleteCollectionUser: (organizationId: string, id: string, organizationUserId: string) => Promise<any>;

    getGroupDetails: (organizationId: string, id: string) => Promise<GroupDetailsResponse>;
    getGroups: (organizationId: string) => Promise<ListResponse<GroupResponse>>;
    getGroupUsers: (organizationId: string, id: string) => Promise<ListResponse<GroupUserResponse>>;
    postGroup: (organizationId: string, request: GroupRequest) => Promise<GroupResponse>;
    putGroup: (organizationId: string, id: string, request: GroupRequest) => Promise<GroupResponse>;
    deleteGroup: (organizationId: string, id: string) => Promise<any>;
    deleteGroupUser: (organizationId: string, id: string, organizationUserId: string) => Promise<any>;

    getOrganizationUser: (organizationId: string, id: string) => Promise<OrganizationUserDetailsResponse>;
    getOrganizationUserGroups: (organizationId: string, id: string) => Promise<string[]>;
    getOrganizationUsers: (organizationId: string) => Promise<ListResponse<OrganizationUserUserDetailsResponse>>;
    postOrganizationUserInvite: (organizationId: string, request: OrganizationUserInviteRequest) => Promise<any>;
    postOrganizationUserReinvite: (organizationId: string, id: string) => Promise<any>;
    postOrganizationUserAccept: (organizationId: string, id: string,
        request: OrganizationUserAcceptRequest) => Promise<any>;
    postOrganizationUserConfirm: (organizationId: string, id: string,
        request: OrganizationUserConfirmRequest) => Promise<any>;
    putOrganizationUser: (organizationId: string, id: string, request: OrganizationUserUpdateRequest) => Promise<any>;
    putOrganizationUserGroups: (organizationId: string, id: string,
        request: OrganizationUserUpdateGroupsRequest) => Promise<any>;
    deleteOrganizationUser: (organizationId: string, id: string) => Promise<any>;

    getSync: () => Promise<SyncResponse>;
    postImportDirectory: (organizationId: string, request: ImportDirectoryRequest) => Promise<any>;

    getSettingsDomains: () => Promise<DomainsResponse>;
    putSettingsDomains: (request: UpdateDomainsRequest) => Promise<DomainsResponse>;

    getTwoFactorProviders: () => Promise<ListResponse<TwoFactorProviderResponse>>;
    getTwoFactorAuthenticator: (request: PasswordVerificationRequest) => Promise<TwoFactorAuthenticatorResponse>;
    getTwoFactorEmail: (request: PasswordVerificationRequest) => Promise<TwoFactorEmailResponse>;
    getTwoFactorDuo: (request: PasswordVerificationRequest) => Promise<TwoFactorDuoResponse>;
    getTwoFactorYubiKey: (request: PasswordVerificationRequest) => Promise<TwoFactorYubiKeyResponse>;
    getTwoFactorU2f: (request: PasswordVerificationRequest) => Promise<TwoFactorU2fResponse>;
    getTwoFactorRecover: (request: PasswordVerificationRequest) => Promise<TwoFactorRecoverResponse>;
    putTwoFactorAuthenticator: (
        request: UpdateTwoFactorAuthenticatorRequest) => Promise<TwoFactorAuthenticatorResponse>;
    putTwoFactorEmail: (request: UpdateTwoFactorEmailRequest) => Promise<TwoFactorEmailResponse>;
    putTwoFactorDuo: (request: UpdateTwoFactorDuoRequest) => Promise<TwoFactorDuoResponse>;
    putTwoFactorYubiKey: (request: UpdateTwoFactorYubioOtpRequest) => Promise<TwoFactorYubiKeyResponse>;
    putTwoFactorU2f: (request: UpdateTwoFactorU2fRequest) => Promise<TwoFactorU2fResponse>;
    putTwoFactorDisable: (request: TwoFactorProviderRequest) => Promise<TwoFactorProviderResponse>;
    postTwoFactorRecover: (request: TwoFactorRecoveryRequest) => Promise<any>;
    postTwoFactorEmailSetup: (request: TwoFactorEmailRequest) => Promise<any>;
    postTwoFactorEmail: (request: TwoFactorEmailRequest) => Promise<any>;

    getOrganization: (id: string) => Promise<OrganizationResponse>;
    getOrganizationBilling: (id: string) => Promise<OrganizationBillingResponse>;
    getOrganizationLicense: (id: string, installationId: string) => Promise<any>;
    postOrganization: (request: OrganizationCreateRequest) => Promise<OrganizationResponse>;
    putOrganization: (id: string, request: OrganizationUpdateRequest) => Promise<OrganizationResponse>;
    postLeaveOrganization: (id: string) => Promise<any>;
    postOrganizationLicense: (data: FormData) => Promise<OrganizationResponse>;
    postOrganizationLicenseUpdate: (id: string, data: FormData) => Promise<any>;
    postOrganizationSeat: (id: string, request: SeatRequest) => Promise<any>;
    postOrganizationStorage: (id: string, request: StorageRequest) => Promise<any>;
    postOrganizationPayment: (id: string, request: PaymentRequest) => Promise<any>;
    postOrganizationVerifyBank: (id: string, request: VerifyBankRequest) => Promise<any>;
    postOrganizationCancel: (id: string) => Promise<any>;
    postOrganizationReinstate: (id: string) => Promise<any>;
    deleteOrganization: (id: string, request: PasswordVerificationRequest) => Promise<any>;

    getEvents: (start: string, end: string, token: string) => Promise<ListResponse<EventResponse>>;
    getEventsCipher: (id: string, start: string, end: string, token: string) => Promise<ListResponse<EventResponse>>;
    getEventsOrganization: (id: string, start: string, end: string,
        token: string) => Promise<ListResponse<EventResponse>>;
    getEventsOrganizationUser: (organizationId: string, id: string,
        start: string, end: string, token: string) => Promise<ListResponse<EventResponse>>;

    getUserPublicKey: (id: string) => Promise<UserKeyResponse>;

    fetch: (request: Request) => Promise<Response>;
}
