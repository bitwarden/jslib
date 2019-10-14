import { EnvironmentUrls } from '../models/domain/environmentUrls';

import { BitPayInvoiceRequest } from '../models/request/bitPayInvoiceRequest';
import { CipherBulkDeleteRequest } from '../models/request/cipherBulkDeleteRequest';
import { CipherBulkMoveRequest } from '../models/request/cipherBulkMoveRequest';
import { CipherBulkShareRequest } from '../models/request/cipherBulkShareRequest';
import { CipherCollectionsRequest } from '../models/request/cipherCollectionsRequest';
import { CipherCreateRequest } from '../models/request/cipherCreateRequest';
import { CipherRequest } from '../models/request/cipherRequest';
import { CipherShareRequest } from '../models/request/cipherShareRequest';
import { CollectionRequest } from '../models/request/collectionRequest';
import { DeleteRecoverRequest } from '../models/request/deleteRecoverRequest';
import { EmailRequest } from '../models/request/emailRequest';
import { EmailTokenRequest } from '../models/request/emailTokenRequest';
import { EventRequest } from '../models/request/eventRequest';
import { FolderRequest } from '../models/request/folderRequest';
import { GroupRequest } from '../models/request/groupRequest';
import { IapCheckRequest } from '../models/request/iapCheckRequest';
import { ImportCiphersRequest } from '../models/request/importCiphersRequest';
import { ImportDirectoryRequest } from '../models/request/importDirectoryRequest';
import { ImportOrganizationCiphersRequest } from '../models/request/importOrganizationCiphersRequest';
import { KdfRequest } from '../models/request/kdfRequest';
import { KeysRequest } from '../models/request/keysRequest';
import { OrganizationCreateRequest } from '../models/request/organizationCreateRequest';
import { OrganizationUpdateRequest } from '../models/request/organizationUpdateRequest';
import { OrganizationUpgradeRequest } from '../models/request/organizationUpgradeRequest';
import { OrganizationUserAcceptRequest } from '../models/request/organizationUserAcceptRequest';
import { OrganizationUserConfirmRequest } from '../models/request/organizationUserConfirmRequest';
import { OrganizationUserInviteRequest } from '../models/request/organizationUserInviteRequest';
import { OrganizationUserUpdateGroupsRequest } from '../models/request/organizationUserUpdateGroupsRequest';
import { OrganizationUserUpdateRequest } from '../models/request/organizationUserUpdateRequest';
import { PasswordHintRequest } from '../models/request/passwordHintRequest';
import { PasswordRequest } from '../models/request/passwordRequest';
import { PasswordVerificationRequest } from '../models/request/passwordVerificationRequest';
import { PaymentRequest } from '../models/request/paymentRequest';
import { PreloginRequest } from '../models/request/preloginRequest';
import { RegisterRequest } from '../models/request/registerRequest';
import { SeatRequest } from '../models/request/seatRequest';
import { SelectionReadOnlyRequest } from '../models/request/selectionReadOnlyRequest';
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
import { UpdateTwoFactorU2fDeleteRequest } from '../models/request/updateTwoFactorU2fDeleteRequest';
import { UpdateTwoFactorU2fRequest } from '../models/request/updateTwoFactorU2fRequest';
import { UpdateTwoFactorYubioOtpRequest } from '../models/request/updateTwoFactorYubioOtpRequest';
import { VerifyBankRequest } from '../models/request/verifyBankRequest';
import { VerifyDeleteRecoverRequest } from '../models/request/verifyDeleteRecoverRequest';
import { VerifyEmailRequest } from '../models/request/verifyEmailRequest';

import { ApiKeyResponse } from '../models/response/apiKeyResponse';
import { BillingResponse } from '../models/response/billingResponse';
import { BreachAccountResponse } from '../models/response/breachAccountResponse';
import { CipherResponse } from '../models/response/cipherResponse';
import {
    CollectionGroupDetailsResponse,
    CollectionResponse,
} from '../models/response/collectionResponse';
import { DomainsResponse } from '../models/response/domainsResponse';
import { EventResponse } from '../models/response/eventResponse';
import { FolderResponse } from '../models/response/folderResponse';
import {
    GroupDetailsResponse,
    GroupResponse,
} from '../models/response/groupResponse';
import { IdentityTokenResponse } from '../models/response/identityTokenResponse';
import { IdentityTwoFactorResponse } from '../models/response/identityTwoFactorResponse';
import { ListResponse } from '../models/response/listResponse';
import { OrganizationResponse } from '../models/response/organizationResponse';
import { OrganizationSubscriptionResponse } from '../models/response/organizationSubscriptionResponse';
import {
    OrganizationUserDetailsResponse,
    OrganizationUserUserDetailsResponse,
} from '../models/response/organizationUserResponse';
import { PaymentResponse } from '../models/response/paymentResponse';
import { PreloginResponse } from '../models/response/preloginResponse';
import { ProfileResponse } from '../models/response/profileResponse';
import { SelectionReadOnlyResponse } from '../models/response/selectionReadOnlyResponse';
import { SubscriptionResponse } from '../models/response/subscriptionResponse';
import { SyncResponse } from '../models/response/syncResponse';
import { TwoFactorAuthenticatorResponse } from '../models/response/twoFactorAuthenticatorResponse';
import { TwoFactorDuoResponse } from '../models/response/twoFactorDuoResponse';
import { TwoFactorEmailResponse } from '../models/response/twoFactorEmailResponse';
import { TwoFactorProviderResponse } from '../models/response/twoFactorProviderResponse';
import { TwoFactorRecoverResponse } from '../models/response/twoFactorRescoverResponse';
import {
    ChallengeResponse,
    TwoFactorU2fResponse,
} from '../models/response/twoFactorU2fResponse';
import { TwoFactorYubiKeyResponse } from '../models/response/twoFactorYubiKeyResponse';
import { UserKeyResponse } from '../models/response/userKeyResponse';

export abstract class ApiService {
    urlsSet: boolean;
    apiBaseUrl: string;
    identityBaseUrl: string;
    eventsBaseUrl: string;

    setUrls: (urls: EnvironmentUrls) => void;
    postIdentityToken: (request: TokenRequest) => Promise<IdentityTokenResponse | IdentityTwoFactorResponse>;
    refreshIdentityToken: () => Promise<any>;

    getProfile: () => Promise<ProfileResponse>;
    getUserBilling: () => Promise<BillingResponse>;
    getUserSubscription: () => Promise<SubscriptionResponse>;
    putProfile: (request: UpdateProfileRequest) => Promise<ProfileResponse>;
    postPrelogin: (request: PreloginRequest) => Promise<PreloginResponse>;
    postEmailToken: (request: EmailTokenRequest) => Promise<any>;
    postEmail: (request: EmailRequest) => Promise<any>;
    postPassword: (request: PasswordRequest) => Promise<any>;
    postSecurityStamp: (request: PasswordVerificationRequest) => Promise<any>;
    deleteAccount: (request: PasswordVerificationRequest) => Promise<any>;
    getAccountRevisionDate: () => Promise<number>;
    postPasswordHint: (request: PasswordHintRequest) => Promise<any>;
    postRegister: (request: RegisterRequest) => Promise<any>;
    postPremium: (data: FormData) => Promise<PaymentResponse>;
    postIapCheck: (request: IapCheckRequest) => Promise<any>;
    postReinstatePremium: () => Promise<any>;
    postCancelPremium: () => Promise<any>;
    postAccountStorage: (request: StorageRequest) => Promise<PaymentResponse>;
    postAccountPayment: (request: PaymentRequest) => Promise<any>;
    postAccountLicense: (data: FormData) => Promise<any>;
    postAccountKey: (request: UpdateKeyRequest) => Promise<any>;
    postAccountKeys: (request: KeysRequest) => Promise<any>;
    postAccountVerifyEmail: () => Promise<any>;
    postAccountVerifyEmailToken: (request: VerifyEmailRequest) => Promise<any>;
    postAccountRecoverDelete: (request: DeleteRecoverRequest) => Promise<any>;
    postAccountRecoverDeleteToken: (request: VerifyDeleteRecoverRequest) => Promise<any>;
    postAccountKdf: (request: KdfRequest) => Promise<any>;

    getFolder: (id: string) => Promise<FolderResponse>;
    postFolder: (request: FolderRequest) => Promise<FolderResponse>;
    putFolder: (id: string, request: FolderRequest) => Promise<FolderResponse>;
    deleteFolder: (id: string) => Promise<any>;

    getCipher: (id: string) => Promise<CipherResponse>;
    getCipherAdmin: (id: string) => Promise<CipherResponse>;
    getCiphersOrganization: (organizationId: string) => Promise<ListResponse<CipherResponse>>;
    postCipher: (request: CipherRequest) => Promise<CipherResponse>;
    postCipherCreate: (request: CipherCreateRequest) => Promise<CipherResponse>;
    postCipherAdmin: (request: CipherCreateRequest) => Promise<CipherResponse>;
    putCipher: (id: string, request: CipherRequest) => Promise<CipherResponse>;
    putCipherAdmin: (id: string, request: CipherRequest) => Promise<CipherResponse>;
    deleteCipher: (id: string) => Promise<any>;
    deleteCipherAdmin: (id: string) => Promise<any>;
    deleteManyCiphers: (request: CipherBulkDeleteRequest) => Promise<any>;
    putMoveCiphers: (request: CipherBulkMoveRequest) => Promise<any>;
    putShareCipher: (id: string, request: CipherShareRequest) => Promise<CipherResponse>;
    putShareCiphers: (request: CipherBulkShareRequest) => Promise<any>;
    putCipherCollections: (id: string, request: CipherCollectionsRequest) => Promise<any>;
    putCipherCollectionsAdmin: (id: string, request: CipherCollectionsRequest) => Promise<any>;
    postPurgeCiphers: (request: PasswordVerificationRequest, organizationId?: string) => Promise<any>;
    postImportCiphers: (request: ImportCiphersRequest) => Promise<any>;
    postImportOrganizationCiphers: (organizationId: string, request: ImportOrganizationCiphersRequest) => Promise<any>;

    postCipherAttachment: (id: string, data: FormData) => Promise<CipherResponse>;
    postCipherAttachmentAdmin: (id: string, data: FormData) => Promise<CipherResponse>;
    deleteCipherAttachment: (id: string, attachmentId: string) => Promise<any>;
    deleteCipherAttachmentAdmin: (id: string, attachmentId: string) => Promise<any>;
    postShareCipherAttachment: (id: string, attachmentId: string, data: FormData,
        organizationId: string) => Promise<any>;

    getCollectionDetails: (organizationId: string, id: string) => Promise<CollectionGroupDetailsResponse>;
    getUserCollections: () => Promise<ListResponse<CollectionResponse>>;
    getCollections: (organizationId: string) => Promise<ListResponse<CollectionResponse>>;
    getCollectionUsers: (organizationId: string, id: string) => Promise<SelectionReadOnlyResponse[]>;
    postCollection: (organizationId: string, request: CollectionRequest) => Promise<CollectionResponse>;
    putCollectionUsers: (organizationId: string, id: string, request: SelectionReadOnlyRequest[]) => Promise<any>;
    putCollection: (organizationId: string, id: string, request: CollectionRequest) => Promise<CollectionResponse>;
    deleteCollection: (organizationId: string, id: string) => Promise<any>;
    deleteCollectionUser: (organizationId: string, id: string, organizationUserId: string) => Promise<any>;

    getGroupDetails: (organizationId: string, id: string) => Promise<GroupDetailsResponse>;
    getGroups: (organizationId: string) => Promise<ListResponse<GroupResponse>>;
    getGroupUsers: (organizationId: string, id: string) => Promise<string[]>;
    postGroup: (organizationId: string, request: GroupRequest) => Promise<GroupResponse>;
    putGroup: (organizationId: string, id: string, request: GroupRequest) => Promise<GroupResponse>;
    putGroupUsers: (organizationId: string, id: string, request: string[]) => Promise<any>;
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
    getTwoFactorOrganizationProviders: (organizationId: string) => Promise<ListResponse<TwoFactorProviderResponse>>;
    getTwoFactorAuthenticator: (request: PasswordVerificationRequest) => Promise<TwoFactorAuthenticatorResponse>;
    getTwoFactorEmail: (request: PasswordVerificationRequest) => Promise<TwoFactorEmailResponse>;
    getTwoFactorDuo: (request: PasswordVerificationRequest) => Promise<TwoFactorDuoResponse>;
    getTwoFactorOrganizationDuo: (organizationId: string,
        request: PasswordVerificationRequest) => Promise<TwoFactorDuoResponse>;
    getTwoFactorYubiKey: (request: PasswordVerificationRequest) => Promise<TwoFactorYubiKeyResponse>;
    getTwoFactorU2f: (request: PasswordVerificationRequest) => Promise<TwoFactorU2fResponse>;
    getTwoFactorU2fChallenge: (request: PasswordVerificationRequest) => Promise<ChallengeResponse>;
    getTwoFactorRecover: (request: PasswordVerificationRequest) => Promise<TwoFactorRecoverResponse>;
    putTwoFactorAuthenticator: (
        request: UpdateTwoFactorAuthenticatorRequest) => Promise<TwoFactorAuthenticatorResponse>;
    putTwoFactorEmail: (request: UpdateTwoFactorEmailRequest) => Promise<TwoFactorEmailResponse>;
    putTwoFactorDuo: (request: UpdateTwoFactorDuoRequest) => Promise<TwoFactorDuoResponse>;
    putTwoFactorOrganizationDuo: (organizationId: string,
        request: UpdateTwoFactorDuoRequest) => Promise<TwoFactorDuoResponse>;
    putTwoFactorYubiKey: (request: UpdateTwoFactorYubioOtpRequest) => Promise<TwoFactorYubiKeyResponse>;
    putTwoFactorU2f: (request: UpdateTwoFactorU2fRequest) => Promise<TwoFactorU2fResponse>;
    deleteTwoFactorU2f: (request: UpdateTwoFactorU2fDeleteRequest) => Promise<TwoFactorU2fResponse>;
    putTwoFactorDisable: (request: TwoFactorProviderRequest) => Promise<TwoFactorProviderResponse>;
    putTwoFactorOrganizationDisable: (organizationId: string,
        request: TwoFactorProviderRequest) => Promise<TwoFactorProviderResponse>;
    postTwoFactorRecover: (request: TwoFactorRecoveryRequest) => Promise<any>;
    postTwoFactorEmailSetup: (request: TwoFactorEmailRequest) => Promise<any>;
    postTwoFactorEmail: (request: TwoFactorEmailRequest) => Promise<any>;

    getOrganization: (id: string) => Promise<OrganizationResponse>;
    getOrganizationBilling: (id: string) => Promise<BillingResponse>;
    getOrganizationSubscription: (id: string) => Promise<OrganizationSubscriptionResponse>;
    getOrganizationLicense: (id: string, installationId: string) => Promise<any>;
    postOrganization: (request: OrganizationCreateRequest) => Promise<OrganizationResponse>;
    putOrganization: (id: string, request: OrganizationUpdateRequest) => Promise<OrganizationResponse>;
    postLeaveOrganization: (id: string) => Promise<any>;
    postOrganizationLicense: (data: FormData) => Promise<OrganizationResponse>;
    postOrganizationLicenseUpdate: (id: string, data: FormData) => Promise<any>;
    postOrganizationApiKey: (id: string, request: PasswordVerificationRequest) => Promise<ApiKeyResponse>;
    postOrganizationRotateApiKey: (id: string, request: PasswordVerificationRequest) => Promise<ApiKeyResponse>;
    postOrganizationUpgrade: (id: string, request: OrganizationUpgradeRequest) => Promise<PaymentResponse>;
    postOrganizationSeat: (id: string, request: SeatRequest) => Promise<PaymentResponse>;
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
    postEventsCollect: (request: EventRequest[]) => Promise<any>;

    getUserPublicKey: (id: string) => Promise<UserKeyResponse>;

    getHibpBreach: (username: string) => Promise<BreachAccountResponse[]>;

    postBitPayInvoice: (request: BitPayInvoiceRequest) => Promise<string>;
    postSetupPayment: () => Promise<string>;

    getActiveBearerToken: () => Promise<string>;
    fetch: (request: Request) => Promise<Response>;
    nativeFetch: (request: Request) => Promise<Response>;
}
