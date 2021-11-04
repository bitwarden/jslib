import { OrganizationData } from '../data/organizationData';

import { KdfType } from '../../enums/kdfType';
import { UriMatchType } from '../../enums/uriMatchType';

import { CipherView } from '../view/cipherView';
import { CollectionView } from '../view/collectionView';
import { FolderView } from '../view/folderView';
import { SendView } from '../view/sendView';

import { EncString } from './encString';
import { GeneratedPasswordHistory } from './generatedPasswordHistory';
import { Policy } from './policy';
import { SymmetricCryptoKey } from './symmetricCryptoKey';

import { CipherData } from '../data/cipherData';
import { CollectionData } from '../data/collectionData';
import { EventData } from '../data/eventData';
import { FolderData } from '../data/folderData';
import { PolicyData } from '../data/policyData';
import { ProviderData } from '../data/providerData';
import { SendData } from '../data/sendData';

export enum AuthenticationStatus {
    Locked = 'locked',
    Unlocked = 'unlocked',
    LoggedOut = 'loggedOut',
    Active = 'active',
}

export class Account {
    userId: string;
    email: string;
    accessToken: string;
    decodedToken: any;
    apiKeyClientId: string;
    apiKeyClientSecret: string;
    alwaysShowDock: boolean;
    autoFillOnPageLoadDefault: boolean;
    encryptedCiphers: { [id: string]: CipherData };
    decryptedCiphers: CipherView[];
    cryptoMasterKey: SymmetricCryptoKey;
    cryptoMasterKeyB64: string;
    encryptedCryptoSymmetricKey: string;
    decryptedCryptoSymmetricKey: SymmetricCryptoKey;
    defaultUriMatch: UriMatchType;
    disableAddLoginNotification: boolean;
    disableAutoTotpCopy: boolean;
    disableBadgeCounter: boolean;
    disableChangedPasswordNotification: boolean;
    disableContextMenuItem: boolean;
    disableGa: boolean;
    dontShowCardsCurrentTab: boolean;
    dontShowIdentitiesCurrentTab: boolean;
    emailVerified: boolean;
    enableAlwaysOnTop: boolean;
    enableAutoFillOnPageLoad: boolean;
    enableBrowserIntegration: boolean;
    enableBrowserIntegrationFingerprint: boolean;
    enableCloseToTray: boolean;
    enableMinimizeToTray: boolean;
    enableStartToTray: boolean;
    enableTray: boolean;
    decryptedOrganizationKeys: Map<string, SymmetricCryptoKey>;
    encryptedOrganizationKeys: any;
    decryptedProviderKeys: Map<string, SymmetricCryptoKey>;
    encryptedProviderKeys: any;
    entityId: string;
    entityType: string;
    environmentUrls: any;
    equivalentDomains: any;
    eventCollection: EventData[];
    encryptedFolders: { [id: string]: FolderData };
    decryptedFolders: FolderView[];
    forcePasswordReset: boolean;
    installedVersion: string;
    kdfIterations: number;
    kdfType: KdfType;
    keyHash: string;
    lastActive: number;
    lastSync: string;
    legacyEtmKey: SymmetricCryptoKey;
    localData: any;
    loginRedirect: any;
    mainWindowSize: number;
    minimizeOnCopyToClipboard: boolean;
    neverDomains: string[];
    openAtLogin: boolean;
    encryptedPasswordGenerationHistory: GeneratedPasswordHistory[];
    decryptedPasswordGenerationHistory: GeneratedPasswordHistory[];
    passwordGenerationOptions: any;
    encryptedPinProtected: string;
    decryptedPinProtected: EncString;
    protectedPin: string;
    encryptedPolicies: { [id: string]: PolicyData };
    decryptedPolicies: Policy[];
    providers: { [id: string]: ProviderData };
    publicKey: ArrayBuffer;
    refreshToken: string;
    rememberEmail: boolean;
    rememberedEmail: string;
    securityStamp: string;
    encryptedSends: { [id: string]: SendData };
    decryptedSends: SendView[];
    settings: any;
    ssoCodeVerifier: string;
    ssoState: string;
    ssoOrganizationIdentifier: string;
    theme: string;
    vaultTimeout: number;
    vaultTimeoutAction: string;
    clearClipboard: number;
    collapsedGroupings: Set<string>;
    encryptedCollections: { [id: string]: CollectionData };
    decryptedCollections: CollectionView[];
    encryptedPrivateKey: string;
    decryptedPrivateKey: ArrayBuffer;
    locale: string;
    organizations: { [id: string]: OrganizationData };
    everBeenUnlocked: boolean;
    enableGravitars: boolean;
    addEditCipherInfo: any;
    authenticationStatus: AuthenticationStatus;
    autoConfirmFingerPrints: boolean;
    disableAutoBiometricsPrompt: boolean;
    noAutoPromptBiometrics: boolean;
    biometricLocked: boolean;
    biometricUnlock: boolean;
    biometricText: string;
    enableBiometric: boolean;
    enableBiometrics: boolean;
    noAutoPromptBiometricsText: string;
    private hasPremiumPersonally: boolean;

    constructor(userId: string, userEmail: string,
        kdfType: KdfType, kdfIterations: number,
        clientId: string, clientSecret: string,
        accessToken: string, refreshToken: string,
        hasPremium: boolean) {
        this.userId = userId;
        this.email = userEmail;
        this.kdfType = kdfType;
        this.kdfIterations = kdfIterations;
        this.apiKeyClientId = clientId;
        this.apiKeyClientSecret = clientSecret;
        this.accessToken = accessToken;
        this.refreshToken = refreshToken;
        this.hasPremiumPersonally = hasPremium;
    }

    get isAuthenticated(): boolean {
        if (!this.accessToken) {
            return false;
        }

        return this.userId != null;
    }

    get canAccessPremium(): boolean {
        if (!this.isAuthenticated) {
            return false;
        }

        return this.hasPremiumPersonally || this.hasPremiumThroughOrganization;
    }

    private get hasPremiumThroughOrganization(): boolean {
        if (this.organizations == null) {
            return false;
        }

        for (const id  of Object.keys(this.organizations)) {
            const o = this.organizations[id];
            if (o.enabled && o.usersGetPremium && !o.isProviderUser) {
                return true;
            }
        }

        return false;
    }

    private get hasMasterKey(): boolean {
        return this.cryptoMasterKey != null;
    }

    private get isActive(): boolean {
        const diffSeconds = ((new Date()).getTime() - this.lastActive) / 1000;
        return diffSeconds < (this.vaultTimeout * 60);
    }
}

