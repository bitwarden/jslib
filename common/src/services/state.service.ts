import { StateService as StateServiceAbstraction } from '../abstractions/state.service';

import { Account, AuthenticationStatus } from '../models/domain/account';

import { LogService } from '../abstractions/log.service';
import { StorageService } from '../abstractions/storage.service';

import { HtmlStorageLocation } from '../enums/htmlStorageLocation';
import { KdfType } from '../enums/kdfType';
import { StorageLocation } from '../enums/storageLocation';
import { UriMatchType } from '../enums/uriMatchType';

import { CipherView } from '../models/view/cipherView';
import { CollectionView } from '../models/view/collectionView';
import { FolderView } from '../models/view/folderView';
import { SendView } from '../models/view/sendView';

import { EncString } from '../models/domain/encString';
import { GeneratedPasswordHistory } from '../models/domain/generatedPasswordHistory';
import { Globals } from '../models/domain/globals';
import { Policy } from '../models/domain/policy';
import { State } from '../models/domain/state';
import { StorageOptions } from '../models/domain/storageOptions';
import { SymmetricCryptoKey } from '../models/domain/symmetricCryptoKey';

import { CipherData } from '../models/data/cipherData';
import { CollectionData } from '../models/data/collectionData';
import { EventData } from '../models/data/eventData';
import { FolderData } from '../models/data/folderData';
import { OrganizationData } from '../models/data/organizationData';
import { PolicyData } from '../models/data/policyData';
import { ProviderData } from '../models/data/providerData';
import { SendData } from '../models/data/sendData';

import { BehaviorSubject } from 'rxjs';

export class StateService implements StateServiceAbstraction {
    accounts = new BehaviorSubject<{ [userId: string]: Account }>({});
    private state: State = new State();

    private get defaultInMemoryOptions(): StorageOptions {
        return { storageLocation: StorageLocation.Memory, userId: this.state.activeUserId };
    }

    private get defaultOnDiskOptions(): StorageOptions {
        return { storageLocation: StorageLocation.Disk, htmlStorageLocation: HtmlStorageLocation.Session, userId: this.state.activeUserId, useSecureStorage: true };
    }

    private get defaultOnDiskLocalOptions(): StorageOptions {
        return { storageLocation: StorageLocation.Disk, htmlStorageLocation: HtmlStorageLocation.Local, userId: this.state.activeUserId, useSecureStorage: true };
    }

    private get defaultOnDiskMemoryOptions(): StorageOptions {
        return { storageLocation: StorageLocation.Disk, htmlStorageLocation: HtmlStorageLocation.Memory, userId: this.state.activeUserId, useSecureStorage: true };
    }

    private get defaultSecureStorageOptions(): StorageOptions {
        return { storageLocation: StorageLocation.Disk, useSecureStorage: true, userId: this.state.activeUserId };
    }

    constructor(private storageService: StorageService, private secureStorageService: StorageService,
        private logService: LogService) {
    }

    async addAccount(account: Account) {
        this.state.accounts[account.userId] = account;
        await this.scaffoldNewAccountStorage(account);
        await this.setActiveUser(account.userId);
    }

    async getEnableGravitars(options?: StorageOptions): Promise<boolean> {
        return (await this.getAccount(this.reconcileOptions(options, this.defaultOnDiskLocalOptions)))?.enableGravitars ?? true;
    }

    async getAddEditCipherInfo(options?: StorageOptions): Promise<any> {
        return (await this.getAccount(this.reconcileOptions(options, this.defaultInMemoryOptions))).addEditCipherInfo;
    }

    async getUserId(options?: StorageOptions): Promise<string> {
        return (await this.getAccount(this.reconcileOptions(options, this.defaultInMemoryOptions))).userId;
    }

    async getEmail(options?: StorageOptions): Promise<string> {
        return (await this.getAccount(this.reconcileOptions(options, this.defaultInMemoryOptions)))?.email;
    }

    async getIsAuthenticated(options?: StorageOptions): Promise<boolean> {
        return (await this.getAccount(this.reconcileOptions(options, this.defaultInMemoryOptions)))?.isAuthenticated ?? false;
    }

    async getCanAccessPremium(options?: StorageOptions): Promise<boolean> {
        return (await this.getAccount(this.reconcileOptions(options, this.defaultInMemoryOptions)))?.canAccessPremium ?? false;
    }

    async getAccessToken(options?: StorageOptions): Promise<string> {
        return (await this.getAccount(this.reconcileOptions(options, this.defaultInMemoryOptions)))?.accessToken;
    }

    async getDecodedToken(options?: StorageOptions): Promise<any> {
        return (await this.getAccount(this.reconcileOptions(options, this.defaultInMemoryOptions)))?.decodedToken;
    }

    async getAlwaysShowDock(options?: StorageOptions): Promise<boolean> {
        return (await this.getAccount(this.reconcileOptions(options, this.defaultOnDiskOptions)))?.alwaysShowDock ?? false;
    }

    async getApiKeyClientId(options?: StorageOptions): Promise<string> {
        return (await this.getAccount(this.reconcileOptions(options, this.defaultInMemoryOptions)))?.apiKeyClientId;
    }

    async getApiKeyClientSecret(options?: StorageOptions): Promise<string> {
        return (await this.getAccount(this.reconcileOptions(options, this.defaultInMemoryOptions)))?.apiKeyClientSecret;
    }

    async getAutoConfirmFingerPrints(options?: StorageOptions): Promise<boolean> {
        return (await this.getAccount(this.reconcileOptions(options, this.defaultOnDiskOptions))).autoConfirmFingerPrints ?? true;
    }

    async getAutoFillOnPageLoadDefault(options?: StorageOptions): Promise<boolean> {
        return (await this.getAccount(this.reconcileOptions(options, this.defaultInMemoryOptions)))?.autoFillOnPageLoadDefault ?? false;
    }

    async getBiometricAwaitingAcceptance(options?: StorageOptions): Promise<boolean> {
        return (await this.getGlobals(this.reconcileOptions(options, this.defaultInMemoryOptions)))?.biometricAwaitingAcceptance ?? false;
    }

    async getBiometricFingerprintValidated(options?: StorageOptions): Promise<boolean> {
        return (await this.getGlobals(this.reconcileOptions(options, this.defaultInMemoryOptions)))?.biometricFingerprintValidated ?? false;
    }

    async getBiometricText(options?: StorageOptions): Promise<string> {
        return (await this.getAccount(this.reconcileOptions(options, this.defaultOnDiskOptions)))?.biometricText;
    }

    async getBiometricUnlock(options?: StorageOptions): Promise<boolean> {
        return (await this.getAccount(this.reconcileOptions(options, this.defaultInMemoryOptions)))?.biometricUnlock ?? false;
    }

    async getEncryptedCiphers(options?: StorageOptions): Promise<{ [id: string]: CipherData }> {
        return (await this.getAccount(this.reconcileOptions(options, this.defaultOnDiskMemoryOptions)))?.encryptedCiphers;
    }

    async getDecryptedCiphers(options?: StorageOptions): Promise<CipherView[]> {
        return (await this.getAccount(this.reconcileOptions(options, this.defaultInMemoryOptions)))?.decryptedCiphers;
    }

    async getClearClipboard(options?: StorageOptions): Promise<number> {
        return (await this.getAccount(this.reconcileOptions(options, this.defaultInMemoryOptions)))?.clearClipboard;
    }

    async getCollapsedGroupings(options?: StorageOptions): Promise<Set<string>> {
        return (await this.getAccount(this.reconcileOptions(options, this.defaultInMemoryOptions)))?.collapsedGroupings;
    }

    async getEncryptedCollections(options?: StorageOptions): Promise<{ [id: string]: CollectionData }> {
        return (await this.getAccount(this.reconcileOptions(options, this.defaultOnDiskMemoryOptions)))?.encryptedCollections;
    }

    async getDecryptedCollections(options?: StorageOptions): Promise<CollectionView[]> {
        return (await this.getAccount(this.reconcileOptions(options, this.defaultInMemoryOptions)))?.decryptedCollections;
    }

    async getCryptoMasterKey(options?: StorageOptions): Promise<SymmetricCryptoKey> {
        return (await this.getAccount(this.reconcileOptions(options, this.defaultInMemoryOptions)))?.cryptoMasterKey;
    }

    async getCryptoMasterKeyB64(options: StorageOptions): Promise<string> {
        try {
            if (options?.keySuffix == null) {
                throw new RequiredSuffixError();
            }
            const value = (await this.getAccount(this.reconcileOptions(options, this.defaultSecureStorageOptions)))?.cryptoMasterKeyB64;
            return value;
        } catch (e) {
            this.logService.error(e);
        }
    }

    async getEncryptedCryptoSymmetricKey(options?: StorageOptions): Promise<string> {
        return (await this.getAccount(this.reconcileOptions(options, this.defaultOnDiskOptions)))?.encryptedCryptoSymmetricKey;
    }

    async getDecryptedCryptoSymmetricKey(options?: StorageOptions): Promise<SymmetricCryptoKey> {
        return (await this.getAccount(this.reconcileOptions(options, this.defaultInMemoryOptions)))?.decryptedCryptoSymmetricKey;
    }

    async getDefaultUriMatch(options?: StorageOptions): Promise<UriMatchType> {
        return (await this.getAccount(this.reconcileOptions(options, this.defaultInMemoryOptions)))?.defaultUriMatch;
    }

    async getDisableAddLoginNotification(options?: StorageOptions): Promise<boolean> {
        return (await this.getAccount(this.reconcileOptions(options, this.defaultInMemoryOptions)))?.disableAddLoginNotification ?? false;
    }

    async getDisableAutoBiometricsPrompt(options?: StorageOptions): Promise<boolean> {
        return (await this.getAccount(this.reconcileOptions(options, this.defaultInMemoryOptions)))?.disableAutoBiometricsPrompt ?? false;
    }

    async getDisableAutoTotpCopy(options?: StorageOptions): Promise<boolean> {
        return (await this.getAccount(this.reconcileOptions(options, this.defaultInMemoryOptions)))?.disableAutoTotpCopy ?? false;
    }

    async getDisableBadgeCounter(options?: StorageOptions): Promise<boolean> {
        return (await this.getAccount(this.reconcileOptions(options, this.defaultInMemoryOptions)))?.disableBadgeCounter ?? false;
    }

    async getDisableChangedPasswordNotification(options?: StorageOptions): Promise<boolean> {
        return (await this.getAccount(this.reconcileOptions(options, this.defaultInMemoryOptions)))?.disableChangedPasswordNotification ?? false;
    }

    async getDisableContextMenuItem(options?: StorageOptions): Promise<boolean> {
        return (await this.getAccount(this.reconcileOptions(options, this.defaultInMemoryOptions)))?.disableContextMenuItem ?? false;
    }

    async getDisableFavicon(options?: StorageOptions): Promise<boolean> {
        return (await this.getGlobals(this.reconcileOptions(options, this.defaultOnDiskLocalOptions)))?.disableFavicon ?? false;
    }

    async getDisableGa(options?: StorageOptions): Promise<boolean> {
        return (await this.getAccount(this.reconcileOptions(options, this.defaultInMemoryOptions)))?.disableGa ?? false;
    }

    async getDontShowCardsCurrentTab(options?: StorageOptions): Promise<boolean> {
        return (await this.getAccount(this.reconcileOptions(options, this.defaultInMemoryOptions)))?.dontShowCardsCurrentTab ?? false;
    }

    async getDontShowIdentitiesCurrentTab(options?: StorageOptions): Promise<boolean> {
        return (await this.getAccount(this.reconcileOptions(options, this.defaultInMemoryOptions)))?.dontShowIdentitiesCurrentTab ?? false;
    }

    async getEmailVerified(options?: StorageOptions): Promise<boolean> {
        return (await this.getAccount(this.reconcileOptions(options, this.defaultInMemoryOptions)))?.emailVerified ?? false;
    }

    async getEnableAlwaysOnTop(options?: StorageOptions): Promise<boolean> {
        const accountPreference = (await this.getAccount(this.reconcileOptions(options, this.defaultOnDiskOptions)))?.enableAlwaysOnTop;
        const globalPreference = (await this.getGlobals(this.reconcileOptions(options, this.defaultOnDiskOptions)))?.enableAlwaysOnTop;
        return accountPreference ?? globalPreference ?? false;
    }

    async getEnableAutoFillOnPageLoad(options?: StorageOptions): Promise<boolean> {
        return (await this.getAccount(this.reconcileOptions(options, this.defaultInMemoryOptions)))?.enableAutoFillOnPageLoad ?? false;
    }

    async getEnableBiometric(options?: StorageOptions): Promise<boolean> {
        return (await this.getAccount(this.reconcileOptions(options, this.defaultOnDiskOptions)))?.enableBiometrics ?? false;
    }

    async getEnableBrowserIntegration(options?: StorageOptions): Promise<boolean> {
        return (await this.getAccount(this.reconcileOptions(options, this.defaultOnDiskOptions)))?.enableBrowserIntegration ?? false;
    }

    async getEnableBrowserIntegrationFingerprint(options?: StorageOptions): Promise<boolean> {
        return (await this.getAccount(this.reconcileOptions(options, this.defaultOnDiskOptions)))?.enableBrowserIntegrationFingerprint ?? false;
    }

    async getEnableCloseToTray(options?: StorageOptions): Promise<boolean> {
        return (await this.getAccount(this.reconcileOptions(options, this.defaultInMemoryOptions)))?.enableCloseToTray ?? false;
    }

    async getEnableMinimizeToTray(options?: StorageOptions): Promise<boolean> {
        return (await this.getAccount(this.reconcileOptions(options, this.defaultOnDiskOptions)))?.enableMinimizeToTray ?? false;
    }

    async getEnableStartToTray(options?: StorageOptions): Promise<boolean> {
        return (await this.getAccount(this.reconcileOptions(options, this.defaultInMemoryOptions)))?.enableStartToTray ?? false;
    }

    async getEnableTray(options?: StorageOptions): Promise<boolean> {
        return (await this.getAccount(this.reconcileOptions(options, this.defaultInMemoryOptions)))?.enableTray ?? false;
    }

    async getEncryptedOrganizationKeys(options?: StorageOptions): Promise<any> {
        return (await this.getAccount(this.reconcileOptions(options, this.defaultOnDiskOptions)))?.encryptedOrganizationKeys;
    }

    async getDecryptedOrganizationKeys(options?: StorageOptions): Promise<Map<string, SymmetricCryptoKey>> {
        return (await this.getAccount(this.reconcileOptions(options, this.defaultInMemoryOptions)))?.decryptedOrganizationKeys;
    }

    async getEncryptedPrivateKey(options?: StorageOptions): Promise<string> {
        return (await this.getAccount(this.reconcileOptions(options, this.defaultOnDiskOptions)))?.encryptedPrivateKey;
    }

    async getDecryptedPrivateKey(options?: StorageOptions): Promise<ArrayBuffer> {
        return (await this.getAccount(this.reconcileOptions(options, this.defaultInMemoryOptions)))?.decryptedPrivateKey;
    }

    async getEncryptedProviderKeys(options?: StorageOptions): Promise<any> {
        return (await this.getAccount(this.reconcileOptions(options, this.defaultOnDiskOptions)))?.encryptedProviderKeys;
    }

    async getDecryptedProviderKeys(options?: StorageOptions): Promise<Map<string, SymmetricCryptoKey>> {
        return (await this.getAccount(this.reconcileOptions(options, this.defaultInMemoryOptions)))?.decryptedProviderKeys;
    }

    async getEntityId(options?: StorageOptions): Promise<string> {
        return (await this.getAccount(this.reconcileOptions(options, this.defaultInMemoryOptions)))?.entityId;
    }

    async getEntityType(options?: StorageOptions): Promise<string> {
        return (await this.getAccount(this.reconcileOptions(options, this.defaultInMemoryOptions)))?.entityType;
    }

    async getEnvironmentUrls(options?: StorageOptions): Promise<any> {
        const account = await this.getAccount(this.reconcileOptions(options, this.defaultOnDiskOptions));
        return account?.environmentUrls ?? null;
    }

    async getEquivalentDomains(options?: StorageOptions): Promise<any> {
        return (await this.getAccount(this.reconcileOptions(options, this.defaultInMemoryOptions)))?.equivalentDomains;
    }

    async getEventCollection(options?: StorageOptions): Promise<EventData[]> {
        return (await this.getAccount(this.reconcileOptions(options, this.defaultInMemoryOptions)))?.eventCollection;
    }

    async getEncryptedFolders(options?: StorageOptions): Promise<{ [id: string]: FolderData }> {
        return (await this.getAccount(this.reconcileOptions(options, this.defaultOnDiskMemoryOptions)))?.encryptedFolders;
    }

    async getDecryptedFolders(options?: StorageOptions): Promise<FolderView[]> {
        return (await this.getAccount(this.reconcileOptions(options, this.defaultInMemoryOptions)))?.decryptedFolders;
    }

    async getForcePasswordReset(options?: StorageOptions): Promise<boolean> {
        return (await this.getAccount(this.reconcileOptions(options, this.defaultInMemoryOptions)))?.forcePasswordReset ?? false;
    }

    async getInstalledVersion(options?: StorageOptions): Promise<string> {
        return (await this.getGlobals(this.reconcileOptions(options, this.defaultOnDiskOptions)))?.installedVersion;
    }

    async getKdfIterations(options?: StorageOptions): Promise<number> {
        return (await this.getAccount(this.reconcileOptions(options, this.defaultInMemoryOptions)))?.kdfIterations;
    }

    async getKdfType(options?: StorageOptions): Promise<KdfType> {
        return (await this.getAccount(this.reconcileOptions(options, this.defaultInMemoryOptions)))?.kdfType;
    }

    async getKeyHash(options?: StorageOptions): Promise<string> {
        return (await this.getAccount(options ?? { storageLocation: StorageLocation.Both }))?.keyHash;
    }

    async getLastSync(options?: StorageOptions): Promise<string> {
        return (await this.getAccount(this.reconcileOptions(options, this.defaultOnDiskMemoryOptions)))?.lastSync;
    }

    async getLastActive(options?: StorageOptions): Promise<number> {
        const lastActive = (await this.getAccount(this.reconcileOptions(options, this.defaultOnDiskOptions)))?.lastActive;
        return lastActive ?? (await this.getGlobals(this.reconcileOptions(options, this.defaultOnDiskOptions))).lastActive;
    }

    async getLegacyEtmKey(options?: StorageOptions): Promise<SymmetricCryptoKey> {
        return (await this.getAccount(this.reconcileOptions(options, this.defaultInMemoryOptions)))?.legacyEtmKey;
    }

    async getLocalData(options?: StorageOptions): Promise<any> {
        return (await this.getAccount(this.reconcileOptions(options, this.defaultInMemoryOptions)))?.localData;
    }

    async getLocale(options?: StorageOptions): Promise<string> {
        return (await this.getAccount(this.reconcileOptions(options, this.defaultInMemoryOptions)))?.locale;
    }

    async getLoginRedirect(options?: StorageOptions): Promise<string> {
        return (await this.getAccount(this.reconcileOptions(options, this.defaultInMemoryOptions)))?.loginRedirect;
    }

    async getMainWindowSize(options?: StorageOptions): Promise<number> {
        return (await this.getAccount(this.reconcileOptions(options, this.defaultInMemoryOptions)))?.mainWindowSize;
    }

    async getMinimizeOnCopyToClipboard(options?: StorageOptions): Promise<boolean> {
        return (await this.getAccount(this.reconcileOptions(options, this.defaultOnDiskOptions)))?.minimizeOnCopyToClipboard ?? false;
    }

    async getNeverDomains(options?: StorageOptions): Promise<string[]> {
        return (await this.getAccount(this.reconcileOptions(options, this.defaultInMemoryOptions)))?.neverDomains;
    }

    async getNoAutoPromptBiometrics(options?: StorageOptions): Promise<boolean> {
        return (await this.getAccount(this.reconcileOptions(options, this.defaultOnDiskOptions)))?.noAutoPromptBiometrics ?? false;
    }

    async getNoAutoPromptBiometricsText(options?: StorageOptions): Promise<string> {
        return (await this.getAccount(this.reconcileOptions(options, this.defaultOnDiskOptions)))?.noAutoPromptBiometricsText;
    }

    async getOpenAtLogin(options?: StorageOptions): Promise<boolean> {
        return (await this.getGlobals(this.reconcileOptions(options, this.defaultOnDiskOptions)))?.openAtLogin ?? false;
    }

    async getEncryptedPasswordGenerationHistory(options?: StorageOptions): Promise<GeneratedPasswordHistory[]> {
        return (await this.getAccount(this.reconcileOptions(options, this.defaultOnDiskOptions)))?.encryptedPasswordGenerationHistory;
    }

    async getDecryptedPasswordGenerationHistory(options?: StorageOptions): Promise<GeneratedPasswordHistory[]> {
        return (await this.getAccount(this.reconcileOptions(options, this.defaultInMemoryOptions)))?.decryptedPasswordGenerationHistory;
    }

    async getPasswordGenerationOptions(options?: StorageOptions): Promise<any> {
        return (await this.getAccount(this.reconcileOptions(options, this.defaultInMemoryOptions)))?.passwordGenerationOptions;
    }

    async getEncryptedPinProtected(options?: StorageOptions): Promise<string> {
        return (await this.getAccount(this.reconcileOptions(options, this.defaultOnDiskOptions)))?.encryptedPinProtected;
    }

    async getDecryptedPinProtected(options?: StorageOptions): Promise<EncString> {
        return (await this.getAccount(this.reconcileOptions(options, this.defaultInMemoryOptions)))?.decryptedPinProtected;
    }

    async getEncryptedPolicies(options?: StorageOptions): Promise<{ [id: string]: PolicyData }> {
        return (await this.getAccount(this.reconcileOptions(options, this.defaultOnDiskOptions)))?.encryptedPolicies;
    }

    async getDecryptedPolicies(options?: StorageOptions): Promise<Policy[]> {
        return (await this.getAccount(this.reconcileOptions(options, this.defaultInMemoryOptions)))?.decryptedPolicies;
    }

    async getProtectedPin(options?: StorageOptions): Promise<string> {
        return (await this.getAccount(this.reconcileOptions(options, this.defaultInMemoryOptions)))?.protectedPin;
    }

    async getProviders(options?: StorageOptions): Promise<{ [id: string]: ProviderData }> {
        return (await this.getAccount(this.reconcileOptions(options, this.defaultInMemoryOptions)))?.providers;
    }

    async getPublicKey(options?: StorageOptions): Promise<ArrayBuffer> {
        return (await this.getAccount(this.reconcileOptions(options, this.defaultInMemoryOptions)))?.publicKey;
    }

    async getRefreshToken(options?: StorageOptions): Promise<string> {
        return (await this.getAccount(this.reconcileOptions(options, this.defaultInMemoryOptions)))?.refreshToken;
    }

    async getRememberEmail(options?: StorageOptions): Promise<boolean> {
        return (await this.getGlobals(this.reconcileOptions(options, this.defaultOnDiskLocalOptions)))?.rememberEmail ?? false;
    }

    async getRememberedEmail(options?: StorageOptions): Promise<string> {
        return (await this.getGlobals(this.reconcileOptions(options, this.defaultOnDiskLocalOptions)))?.rememberedEmail;
    }

    async getSecurityStamp(options?: StorageOptions): Promise<string> {
        return (await this.getAccount(this.reconcileOptions(options, this.defaultInMemoryOptions)))?.securityStamp;
    }

    async getEncryptedSends(options?: StorageOptions): Promise<{ [id: string]: SendData }> {
        return (await this.getAccount(this.reconcileOptions(options, this.defaultOnDiskMemoryOptions)))?.encryptedSends;
    }

    async getDecryptedSends(options?: StorageOptions): Promise<SendView[]> {
        return (await this.getAccount(this.reconcileOptions(options, this.defaultInMemoryOptions)))?.decryptedSends;
    }

    async getSettings(options?: StorageOptions): Promise<any> {
        return (await this.getAccount(this.reconcileOptions(options, this.defaultOnDiskMemoryOptions)))?.settings;
    }

    async getSsoCodeVerifier(options?: StorageOptions): Promise<string> {
        return (await this.getAccount(this.reconcileOptions(options, this.defaultInMemoryOptions)))?.ssoCodeVerifier;
    }

    async getSsoOrgIdentifier(options?: StorageOptions): Promise<string> {
        return (await this.getAccount(this.reconcileOptions(options, this.defaultOnDiskLocalOptions)))?.ssoOrganizationIdentifier;
    }

    async getSsoState(options?: StorageOptions): Promise<string> {
        return (await this.getAccount(this.reconcileOptions(options, this.defaultInMemoryOptions)))?.ssoState;
    }

    async getTheme(options?: StorageOptions): Promise<string> {
        const accountTheme = (await this.getAccount(this.reconcileOptions(options, this.defaultOnDiskLocalOptions)))?.theme;
        const globalTheme = (await this.getGlobals(this.reconcileOptions(options, this.defaultOnDiskLocalOptions)))?.theme;
        return accountTheme ?? globalTheme;
    }

    async getTwoFactorToken(options?: StorageOptions): Promise<string> {
        return (await this.getGlobals(this.reconcileOptions(options, this.defaultOnDiskLocalOptions)))?.twoFactorToken;
    }

    async getVaultTimeout(options?: StorageOptions): Promise<number> {
        const accountVaultTimeout = (await this.getAccount(this.reconcileOptions(options, this.defaultOnDiskOptions)))?.vaultTimeout;
        const globalVaultTimeout = (await this.getGlobals(this.reconcileOptions(options, this.defaultOnDiskOptions)))?.vaultTimeout;
        return accountVaultTimeout ?? globalVaultTimeout;
    }

    async getVaultTimeoutAction(options?: StorageOptions): Promise<string> {
        const accountVaultTimeoutAction = (await this.getAccount(this.reconcileOptions(options, this.defaultOnDiskOptions)))?.vaultTimeoutAction;
        const globalVaultTimeoutAction = (await this.getGlobals(this.reconcileOptions(options, this.defaultOnDiskOptions)))?.vaultTimeoutAction;
        return accountVaultTimeoutAction ?? globalVaultTimeoutAction;
    }

    async getOrganizations(options?: StorageOptions): Promise<{ [id: string]: OrganizationData }> {
        return (await this.getAccount(this.reconcileOptions(options, this.defaultInMemoryOptions))).organizations;
    }

    async getEverBeenUnlocked(options?: StorageOptions): Promise<boolean> {
        return (await this.getAccount(this.reconcileOptions(options, this.defaultOnDiskOptions))).everBeenUnlocked ?? false;
    }

    async getBiometricLocked(options?: StorageOptions): Promise<boolean> {
        return (await this.getAccount(this.reconcileOptions(options, this.defaultInMemoryOptions))).biometricLocked ?? false;
    }

    async getWindow(): Promise<Map<string, any>> {
        const globals = await this.getGlobals({ storageLocation: StorageLocation.Disk });
        return Object.keys(globals.window).length > 0 ?
            globals.window :
            new Map<string, any>();
    }

    async getOrganizationInvitation(options?: StorageOptions): Promise<any> {
        return (await this.getGlobals(this.reconcileOptions(options, this.defaultInMemoryOptions))).organizationInvitation;
    }

    async getConvertAccountToKeyConnector(options?: StorageOptions): Promise<boolean> {
        return (await this.getAccount(this.reconcileOptions(options, this.defaultOnDiskOptions)))?.convertAccountToKeyConnector;
    }

    async getUsesKeyConnector(options?: StorageOptions): Promise<boolean> {
        return (await this.getAccount(this.reconcileOptions(options, this.defaultInMemoryOptions)))?.usesKeyConnector;
    }

    async setAccessToken(value: string, options?: StorageOptions): Promise<void> {
        const account = await this.getAccount(this.reconcileOptions(options, this.defaultInMemoryOptions));
        account.accessToken = value;
        await this.saveAccount(account, this.reconcileOptions(options, this.defaultInMemoryOptions));
    }

    async setDecodedToken(value: any, options?: StorageOptions): Promise<void> {
        const account = await this.getAccount(this.reconcileOptions(options, this.defaultInMemoryOptions));
        account.decodedToken = value;
        await this.saveAccount(account, this.reconcileOptions(options, this.defaultInMemoryOptions));
    }

    async setAlwaysShowDock(value: boolean, options?: StorageOptions): Promise<void> {
        const account = await this.getAccount(this.reconcileOptions(options, this.defaultOnDiskOptions));
        account.alwaysShowDock = value;
        await this.saveAccount(account, this.reconcileOptions(options, this.defaultOnDiskOptions));
    }

    async setApiKeyClientId(value: string, options?: StorageOptions): Promise<void> {
        const account = await this.getAccount(this.reconcileOptions(options, this.defaultInMemoryOptions));
        account.apiKeyClientId = value;
        await this.saveAccount(account, this.reconcileOptions(options, this.defaultInMemoryOptions));
    }

    async setApiKeyClientSecret(value: string, options?: StorageOptions): Promise<void> {
        const account = await this.getAccount(this.reconcileOptions(options, this.defaultInMemoryOptions));
        account.apiKeyClientSecret = value;
        await this.saveAccount(account, this.reconcileOptions(options, this.defaultInMemoryOptions));
    }

    async setAutoConfirmFingerprints(value: boolean, options?: StorageOptions): Promise<void> {
        const account = await this.getAccount(this.reconcileOptions(options, this.defaultOnDiskOptions));
        account.autoConfirmFingerPrints = value;
        await this.saveAccount(account, this.reconcileOptions(options, this.defaultOnDiskOptions));
    }

    async setAutoFillOnPageLoadDefault(value: boolean, options?: StorageOptions): Promise<void> {
        const account = await this.getAccount(this.reconcileOptions(options, this.defaultInMemoryOptions));
        account.autoFillOnPageLoadDefault = value;
        await this.saveAccount(account, this.reconcileOptions(options, this.defaultInMemoryOptions));
    }

    async setBiometricAwaitingAcceptance(value: boolean, options?: StorageOptions): Promise<void> {
        const globals = await this.getGlobals(this.reconcileOptions(options, this.defaultInMemoryOptions));
        globals.biometricAwaitingAcceptance = value;
        await this.saveGlobals(globals, this.reconcileOptions(options, this.defaultInMemoryOptions));
    }

    async setBiometricFingerprintValidated(value: boolean, options?: StorageOptions): Promise<void> {
        const globals = await this.getGlobals(this.reconcileOptions(options, this.defaultInMemoryOptions));
        globals.biometricFingerprintValidated = value;
        await this.saveGlobals(globals, this.reconcileOptions(options, this.defaultInMemoryOptions));
    }

    async setBiometricText(value: string, options?: StorageOptions): Promise<void> {
        const account = await this.getAccount(this.reconcileOptions(options, this.defaultOnDiskOptions));
        account.biometricText = value;
        await this.saveAccount(account, this.reconcileOptions(options, this.defaultOnDiskOptions));
    }

    async setBiometricUnlock(value: boolean, options?: StorageOptions): Promise<void> {
        const account = await this.getAccount(this.reconcileOptions(options, this.defaultInMemoryOptions));
        account.biometricUnlock = value;
        await this.saveAccount(account, this.reconcileOptions(options, this.defaultInMemoryOptions));
    }

    async setEncryptedCiphers(value: { [id: string]: CipherData }, options?: StorageOptions): Promise<void> {
        const account = await this.getAccount(this.reconcileOptions(options, this.defaultOnDiskMemoryOptions));
        account.encryptedCiphers = value;
        await this.saveAccount(account, this.reconcileOptions(options, this.defaultOnDiskMemoryOptions));
    }

    async setDecryptedCiphers(value: CipherView[], options?: StorageOptions): Promise<void> {
        const account = await this.getAccount(this.reconcileOptions(options, this.defaultInMemoryOptions));
        account.decryptedCiphers = value;
        await this.saveAccount(account, this.reconcileOptions(options, this.defaultInMemoryOptions));
    }

    async setClearClipboard(value: number, options?: StorageOptions): Promise<void> {
        const account = await this.getAccount(this.reconcileOptions(options, this.defaultInMemoryOptions));
        account.clearClipboard = value;
        await this.saveAccount(account, this.reconcileOptions(options, this.defaultInMemoryOptions));
    }

    async setCollapsedGroupings(value: Set<string>, options?: StorageOptions): Promise<void> {
        const account = await this.getAccount(this.reconcileOptions(options, this.defaultInMemoryOptions));
        account.collapsedGroupings = value;
        await this.saveAccount(account, this.reconcileOptions(options, this.defaultInMemoryOptions));
    }

    async setEncryptedCollections(value: { [id: string]: CollectionData }, options?: StorageOptions): Promise<void> {
        const account = await this.getAccount(this.reconcileOptions(options, this.defaultOnDiskMemoryOptions));
        account.encryptedCollections = value;
        await this.saveAccount(account, this.reconcileOptions(options, this.defaultOnDiskMemoryOptions));
    }

    async setDecryptedCollections(value: CollectionView[], options?: StorageOptions): Promise<void> {
        const account = await this.getAccount(this.reconcileOptions(options, this.defaultInMemoryOptions));
        account.decryptedCollections = value;
        await this.saveAccount(account, this.reconcileOptions(options, this.defaultInMemoryOptions));
    }

    async setCryptoMasterKey(value: SymmetricCryptoKey, options?: StorageOptions): Promise<void> {
        const account = await this.getAccount(this.reconcileOptions(options, this.defaultInMemoryOptions));
        account.cryptoMasterKey = value;
        await this.saveAccount(account, this.reconcileOptions(options, this.defaultInMemoryOptions));
    }

    async setCryptoMasterKeyB64(value: string, options: StorageOptions): Promise<void> {
        try {
            if (value != null && options?.keySuffix == null) {
                throw new RequiredSuffixError();
            }
            const account = await this.getAccount(this.reconcileOptions(options, this.defaultSecureStorageOptions));
            if (account != null) {
                account.cryptoMasterKeyB64 = value;
                await this.saveAccount(account, this.reconcileOptions(options, this.defaultSecureStorageOptions));
            }
        } catch (e) {
            this.logService.error(e);
        }
    }

    async setEncryptedCryptoSymmetricKey(value: string, options?: StorageOptions): Promise<void> {
        const account = await this.getAccount(this.reconcileOptions(options, this.defaultOnDiskOptions));
        account.encryptedCryptoSymmetricKey = value;
        await this.saveAccount(account, this.reconcileOptions(options, this.defaultOnDiskOptions));
    }

    async setDecryptedCryptoSymmetricKey(value: SymmetricCryptoKey, options?: StorageOptions): Promise<void> {
        const account = await this.getAccount(this.reconcileOptions(options, this.defaultInMemoryOptions));
        account.decryptedCryptoSymmetricKey = value;
        await this.saveAccount(account, this.reconcileOptions(options, this.defaultInMemoryOptions));
    }

    async setDefaultUriMatch(value: UriMatchType, options?: StorageOptions): Promise<void> {
        const account = await this.getAccount(this.reconcileOptions(options, this.defaultInMemoryOptions));
        account.defaultUriMatch = value;
        await this.saveAccount(account, this.reconcileOptions(options, this.defaultInMemoryOptions));
    }

    async setDisableAddLoginNotification(value: boolean, options?: StorageOptions): Promise<void> {
        const account = await this.getAccount(this.reconcileOptions(options, this.defaultInMemoryOptions));
        account.disableAddLoginNotification = value;
        await this.saveAccount(account, this.reconcileOptions(options, this.defaultInMemoryOptions));
    }

    async setDisableAutoBiometricsPrompt(value: boolean, options?: StorageOptions): Promise<void> {
        const account = await this.getAccount(this.reconcileOptions(options, this.defaultInMemoryOptions));
        account.disableAutoBiometricsPrompt = value;
        await this.saveAccount(account, this.reconcileOptions(options, this.defaultInMemoryOptions));
    }

    async setDisableAutoTotpCopy(value: boolean, options?: StorageOptions): Promise<void> {
        const account = await this.getAccount(this.reconcileOptions(options, this.defaultInMemoryOptions));
        account.disableAutoTotpCopy = value;
        await this.saveAccount(account, this.reconcileOptions(options, this.defaultInMemoryOptions));
    }

    async setDisableBadgeCounter(value: boolean, options?: StorageOptions): Promise<void> {
        const account = await this.getAccount(this.reconcileOptions(options, this.defaultInMemoryOptions));
        account.disableBadgeCounter = value;
        await this.saveAccount(account, this.reconcileOptions(options, this.defaultInMemoryOptions));
    }

    async setDisableChangedPasswordNotification(value: boolean, options?: StorageOptions): Promise<void> {
        const account = await this.getAccount(this.reconcileOptions(options, this.defaultInMemoryOptions));
        account.disableChangedPasswordNotification = value;
        await this.saveAccount(account, this.reconcileOptions(options, this.defaultInMemoryOptions));
    }

    async setDisableContextMenuItem(value: boolean, options?: StorageOptions): Promise<void> {
        const account = await this.getAccount(this.reconcileOptions(options, this.defaultInMemoryOptions));
        account.disableContextMenuItem = value;
        await this.saveAccount(account, this.reconcileOptions(options, this.defaultInMemoryOptions));
    }

    async setDisableFavicon(value: boolean, options?: StorageOptions): Promise<void> {
        const globals = await this.getGlobals(this.reconcileOptions(options, this.defaultOnDiskOptions));
        globals.disableFavicon = value;
        await this.saveGlobals(globals, this.reconcileOptions(options, this.defaultOnDiskOptions));
    }

    async setDisableGa(value: boolean, options?: StorageOptions): Promise<void> {
        const account = await this.getAccount(this.reconcileOptions(options, this.defaultInMemoryOptions));
        account.disableGa = value;
        await this.saveAccount(account, this.reconcileOptions(options, this.defaultInMemoryOptions));
    }

    async setDontShowCardsCurrentTab(value: boolean, options?: StorageOptions): Promise<void> {
        const account = await this.getAccount(this.reconcileOptions(options, this.defaultInMemoryOptions));
        account.dontShowCardsCurrentTab = value;
        await this.saveAccount(account, this.reconcileOptions(options, this.defaultInMemoryOptions));
    }

    async setDontShowIdentitiesCurrentTab(value: boolean, options?: StorageOptions): Promise<void> {
        const account = await this.getAccount(this.reconcileOptions(options, this.defaultInMemoryOptions));
        account.dontShowIdentitiesCurrentTab = value;
        await this.saveAccount(account, this.reconcileOptions(options, this.defaultInMemoryOptions));
    }

    async setEmail(value: string, options?: StorageOptions): Promise<void> {
        const account = await this.getAccount(this.reconcileOptions(options, this.defaultInMemoryOptions));
        account.email = value;
        await this.saveAccount(account, this.reconcileOptions(options, this.defaultInMemoryOptions));
    }

    async setEmailVerified(value: boolean, options?: StorageOptions): Promise<void> {
        const account = await this.getAccount(this.reconcileOptions(options, this.defaultInMemoryOptions));
        account.emailVerified = value;
        await this.saveAccount(account, this.reconcileOptions(options, this.defaultInMemoryOptions));
    }

    async setEnableAlwaysOnTop(value: boolean, options?: StorageOptions): Promise<void> {
        const account = await this.getAccount(this.reconcileOptions(options, this.defaultOnDiskOptions));
        account.enableAlwaysOnTop = value;
        await this.saveAccount(account, this.reconcileOptions(options, this.defaultOnDiskOptions));

        const globals = await this.getGlobals(this.reconcileOptions(options, this.defaultOnDiskOptions));
        globals.enableAlwaysOnTop = value;
        await this.saveGlobals(globals, this.reconcileOptions(options, this.defaultOnDiskOptions));
    }

    async setEnableAutoFillOnPageLoad(value: boolean, options?: StorageOptions): Promise<void> {
        const account = await this.getAccount(this.reconcileOptions(options, this.defaultInMemoryOptions));
        account.enableAutoFillOnPageLoad = value;
        await this.saveAccount(account, this.reconcileOptions(options, this.defaultInMemoryOptions));
    }

    async setEnableBiometric(value: boolean, options?: StorageOptions): Promise<void> {
        const account = await this.getAccount(this.reconcileOptions(options, this.defaultOnDiskOptions));
        account.enableBiometrics = value;
        await this.saveAccount(account, this.reconcileOptions(options, this.defaultOnDiskOptions));
    }

    async setEnableBrowserIntegration(value: boolean, options?: StorageOptions): Promise<void> {
        const account = await this.getAccount(this.reconcileOptions(options, this.defaultOnDiskOptions));
        account.enableBrowserIntegration = value;
        await this.saveAccount(account, this.reconcileOptions(options, this.defaultOnDiskOptions));
    }

    async setEnableBrowserIntegrationFingerprint(value: boolean, options?: StorageOptions): Promise<void> {
        const account = await this.getAccount(this.reconcileOptions(options, this.defaultOnDiskOptions));
        account.enableBrowserIntegrationFingerprint = value;
        await this.saveAccount(account, this.reconcileOptions(options, this.defaultOnDiskOptions));
    }

    async setEnableCloseToTray(value: boolean, options?: StorageOptions): Promise<void> {
        const account = await this.getAccount(this.reconcileOptions(options, this.defaultInMemoryOptions));
        account.enableCloseToTray = value;
        await this.saveAccount(account, this.reconcileOptions(options, this.defaultInMemoryOptions));
    }

    async setEnableMinimizeToTray(value: boolean, options?: StorageOptions): Promise<void> {
        const account = await this.getAccount(this.reconcileOptions(options, this.defaultOnDiskOptions));
        account.enableMinimizeToTray = value;
        await this.saveAccount(account, this.reconcileOptions(options, this.defaultOnDiskOptions));
    }

    async setEnableStartToTray(value: boolean, options?: StorageOptions): Promise<void> {
        const account = await this.getAccount(this.reconcileOptions(options, this.defaultInMemoryOptions));
        account.enableStartToTray = value;
        await this.saveAccount(account, this.reconcileOptions(options, this.defaultInMemoryOptions));
    }

    async setEnableTray(value: boolean, options?: StorageOptions): Promise<void> {
        const account = await this.getAccount(this.reconcileOptions(options, this.defaultInMemoryOptions));
        account.enableTray = value;
        await this.saveAccount(account, this.reconcileOptions(options, this.defaultInMemoryOptions));
    }

    async setEncryptedOrganizationKeys(value: any, options?: StorageOptions): Promise<void> {
        const account = await this.getAccount(this.reconcileOptions(options, this.defaultOnDiskOptions));
        account.encryptedOrganizationKeys = value;
        await this.saveAccount(account, this.reconcileOptions(options, this.defaultOnDiskOptions));
    }

    async setDecryptedOrganizationKeys(value: Map<string, SymmetricCryptoKey>, options?: StorageOptions): Promise<void> {
        const account = await this.getAccount(this.reconcileOptions(options, this.defaultInMemoryOptions));
        account.decryptedOrganizationKeys = value;
        await this.saveAccount(account, this.reconcileOptions(options, this.defaultInMemoryOptions));
    }

    async setEncryptedPrivateKey(value: string, options?: StorageOptions): Promise<void> {
        const account = await this.getAccount(this.reconcileOptions(options, this.defaultOnDiskOptions));
        account.encryptedPrivateKey = value;
        await this.saveAccount(account, this.reconcileOptions(options, this.defaultOnDiskOptions));
    }

    async setDecryptedPrivateKey(value: ArrayBuffer, options?: StorageOptions): Promise<void> {
        const account = await this.getAccount(this.reconcileOptions(options, this.defaultInMemoryOptions));
        account.decryptedPrivateKey = value;
        await this.saveAccount(account, this.reconcileOptions(options, this.defaultInMemoryOptions));
    }

    async setEntityId(value: string, options?: StorageOptions): Promise<void> {
        const account = await this.getAccount(this.reconcileOptions(options, this.defaultInMemoryOptions));
        account.entityId = value;
        await this.saveAccount(account, this.reconcileOptions(options, this.defaultInMemoryOptions));
    }

    async setEntityType(value: string, options?: StorageOptions): Promise<void> {
        const account = await this.getAccount(this.reconcileOptions(options, this.defaultInMemoryOptions));
        account.entityType = value;
        await this.saveAccount(account, this.reconcileOptions(options, this.defaultInMemoryOptions));
    }

    async setEnvironmentUrls(value: any, options?: StorageOptions): Promise<void> {
        const account = await this.getAccount(this.reconcileOptions(options, this.defaultInMemoryOptions));
        account.environmentUrls = value;
        await this.saveAccount(account, this.reconcileOptions(options, this.defaultInMemoryOptions));
    }

    async setEquivalentDomains(value: any, options?: StorageOptions): Promise<void> {
        const account = await this.getAccount(this.reconcileOptions(options, this.defaultInMemoryOptions));
        account.equivalentDomains = value;
        await this.saveAccount(account, this.reconcileOptions(options, this.defaultInMemoryOptions));
    }

    async setEventCollection(value: EventData[], options?: StorageOptions): Promise<void> {
        const account = await this.getAccount(this.reconcileOptions(options, this.defaultInMemoryOptions));
        account.eventCollection = value;
        await this.saveAccount(account, this.reconcileOptions(options, this.defaultInMemoryOptions));
    }

    async setEncryptedFolders(value: { [id: string]: FolderData }, options?: StorageOptions): Promise<void> {
        const account = await this.getAccount(this.reconcileOptions(options, this.defaultOnDiskMemoryOptions));
        account.encryptedFolders = value;
        await this.saveAccount(account, this.reconcileOptions(options, this.defaultOnDiskMemoryOptions));
    }

    async setDecryptedFolders(value: FolderView[], options?: StorageOptions): Promise<void> {
        const account = await this.getAccount(this.reconcileOptions(options, this.defaultInMemoryOptions));
        account.decryptedFolders = value;
        await this.saveAccount(account, this.reconcileOptions(options, this.defaultInMemoryOptions));
    }

    async setForcePasswordReset(value: boolean, options?: StorageOptions): Promise<void> {
        const account = await this.getAccount(this.reconcileOptions(options, this.defaultInMemoryOptions));
        account.forcePasswordReset = value;
        await this.saveAccount(account, this.reconcileOptions(options, this.defaultInMemoryOptions));
    }

    async setInstalledVersion(value: string, options?: StorageOptions): Promise<void> {
        const globals = await this.getGlobals(this.reconcileOptions(options, this.defaultOnDiskOptions));
        globals.installedVersion = value;
        await this.saveGlobals(globals, this.reconcileOptions(options, this.defaultOnDiskOptions));
    }

    async setKdfIterations(value: number, options?: StorageOptions): Promise<void> {
        const account = await this.getAccount(this.reconcileOptions(options, this.defaultInMemoryOptions));
        account.kdfIterations = value;
        await this.saveAccount(account, this.reconcileOptions(options, this.defaultInMemoryOptions));
    }

    async setKdfType(value: KdfType, options?: StorageOptions): Promise<void> {
        const account = await this.getAccount(this.reconcileOptions(options, this.defaultInMemoryOptions));
        account.kdfType = value;
        await this.saveAccount(account, this.reconcileOptions(options, this.defaultInMemoryOptions));
    }

    async setKeyHash(value: string, options?: StorageOptions): Promise<void> {
        const account = await this.getAccount(this.reconcileOptions(options, this.defaultInMemoryOptions));
        account.keyHash = value;
        await this.saveAccount(account, this.reconcileOptions(options, this.defaultInMemoryOptions));
    }

    async setLastSync(value: string, options?: StorageOptions): Promise<void> {
        const account = await this.getAccount(this.reconcileOptions(options, this.defaultOnDiskMemoryOptions));
        account.lastSync = value;
        await this.saveAccount(account, this.reconcileOptions(options, this.defaultOnDiskMemoryOptions));
    }

    async setLastActive(value: number, options?: StorageOptions): Promise<void> {
        const account = await this.getAccount(this.reconcileOptions(options, this.defaultOnDiskOptions));
        if (account != null) {
            account.lastActive = value;
            await this.saveAccount(account, this.reconcileOptions(options, this.defaultOnDiskOptions));
        }

        const globals = await this.getGlobals(this.reconcileOptions(options, this.defaultOnDiskOptions));
        globals.lastActive = value;
        await this.saveGlobals(globals, this.reconcileOptions(options, this.defaultOnDiskOptions));
    }

    async setLegacyEtmKey(value: SymmetricCryptoKey, options?: StorageOptions): Promise<void> {
        const account = await this.getAccount(this.reconcileOptions(options, this.defaultInMemoryOptions));
        account.legacyEtmKey = value;
        await this.saveAccount(account, this.reconcileOptions(options, this.defaultInMemoryOptions));
    }

    async setLocalData(value: any, options?: StorageOptions): Promise<void> {
        const account = await this.getAccount(this.reconcileOptions(options, this.defaultInMemoryOptions));
        account.localData = value;
        await this.saveAccount(account, this.reconcileOptions(options, this.defaultInMemoryOptions));
    }

    async setLocale(value: string, options?: StorageOptions): Promise<void> {
        const account = await this.getAccount(this.reconcileOptions(options, this.defaultInMemoryOptions));
        account.locale = value;
        await this.saveAccount(account, this.reconcileOptions(options, this.defaultInMemoryOptions));
    }

    async setLoginRedirect(value: any, options?: StorageOptions): Promise<void> {
        const account = await this.getAccount(this.reconcileOptions(options, this.defaultInMemoryOptions));
        account.loginRedirect = value;
        await this.saveAccount(account, this.reconcileOptions(options, this.defaultInMemoryOptions));
    }

    async setMainWindowSize(value: number, options?: StorageOptions): Promise<void> {
        const account = await this.getAccount(this.reconcileOptions(options, this.defaultInMemoryOptions));
        account.mainWindowSize = value;
        await this.saveAccount(account, this.reconcileOptions(options, this.defaultInMemoryOptions));
    }

    async setMinimizeOnCopyToClipboard(value: boolean, options?: StorageOptions): Promise<void> {
        const account = await this.getAccount(this.reconcileOptions(options, this.defaultOnDiskOptions));
        account.minimizeOnCopyToClipboard = value;
        await this.saveAccount(account, this.reconcileOptions(options, this.defaultOnDiskOptions));
    }

    async setNeverDomains(value: string[], options?: StorageOptions): Promise<void> {
        const account = await this.getAccount(this.reconcileOptions(options, this.defaultInMemoryOptions));
        account.neverDomains = value;
        await this.saveAccount(account, this.reconcileOptions(options, this.defaultInMemoryOptions));
    }

    async setNoAutoPromptBiometrics(value: boolean, options?: StorageOptions): Promise<void> {
        const account = await this.getAccount(this.reconcileOptions(options, this.defaultOnDiskOptions));
        account.noAutoPromptBiometrics = value;
        await this.saveAccount(account, this.reconcileOptions(options, this.defaultOnDiskOptions));
    }

    async setNoAutoPromptBiometricsText(value: string, options?: StorageOptions): Promise<void> {
        const account = await this.getAccount(this.reconcileOptions(options, this.defaultOnDiskOptions));
        account.noAutoPromptBiometricsText = value;
        await this.saveAccount(account, this.reconcileOptions(options, this.defaultOnDiskOptions));
    }

    async setOpenAtLogin(value: boolean, options?: StorageOptions): Promise<void> {
        const globals = await this.getGlobals(this.reconcileOptions(options, this.defaultOnDiskOptions));
        globals.openAtLogin = value;
        await this.saveGlobals(globals, this.reconcileOptions(options, this.defaultOnDiskOptions));
    }

    async setOrganizations(value: { [id: string]: OrganizationData }, options?: StorageOptions): Promise<void> {
        const account = await this.getAccount(this.reconcileOptions(options, this.defaultInMemoryOptions));
        account.organizations = value;
        await this.saveAccount(account, this.reconcileOptions(options, this.defaultInMemoryOptions));
    }

    async setEncryptedPasswordGenerationHistory(value: GeneratedPasswordHistory[], options?: StorageOptions): Promise<void> {
        const account = await this.getAccount(this.reconcileOptions(options, this.defaultOnDiskOptions));
        account.encryptedPasswordGenerationHistory = value;
        await this.saveAccount(account, this.reconcileOptions(options, this.defaultOnDiskOptions));
    }

    async setDecryptedPasswordGenerationHistory(value: GeneratedPasswordHistory[], options?: StorageOptions): Promise<void> {
        const account = await this.getAccount(this.reconcileOptions(options, this.defaultInMemoryOptions));
        account.decryptedPasswordGenerationHistory = value;
        await this.saveAccount(account, this.reconcileOptions(options, this.defaultInMemoryOptions));
    }

    async setPasswordGenerationOptions(value: any, options?: StorageOptions): Promise<void> {
        const account = await this.getAccount(this.reconcileOptions(options, this.defaultInMemoryOptions));
        account.passwordGenerationOptions = value;
        await this.saveAccount(account, this.reconcileOptions(options, this.defaultInMemoryOptions));
    }

    async setEncryptedPinProtected(value: string, options?: StorageOptions): Promise<void> {
        const account = await this.getAccount(this.reconcileOptions(options, this.defaultOnDiskOptions));
        account.encryptedPinProtected = value;
        await this.saveAccount(account, this.reconcileOptions(options, this.defaultOnDiskOptions));
    }

    async setDecryptedPinProtected(value: EncString, options?: StorageOptions): Promise<void> {
        const account = await this.getAccount(this.reconcileOptions(options, this.defaultInMemoryOptions));
        account.decryptedPinProtected = value;
        await this.saveAccount(account, this.reconcileOptions(options, this.defaultInMemoryOptions));
    }

    async setEncryptedPolicies(value: { [id: string]: PolicyData }, options?: StorageOptions): Promise<void> {
        const account = await this.getAccount(this.reconcileOptions(options, this.defaultOnDiskOptions));
        account.encryptedPolicies = value;
        await this.saveAccount(account, this.reconcileOptions(options, this.defaultOnDiskOptions));
    }

    async setDecryptedPolicies(value: Policy[], options?: StorageOptions): Promise<void> {
        const account = await this.getAccount(this.reconcileOptions(options, this.defaultInMemoryOptions));
        account.decryptedPolicies = value;
        await this.saveAccount(account, this.reconcileOptions(options, this.defaultInMemoryOptions));
    }

    async setProtectedPin(value: string, options?: StorageOptions): Promise<void> {
        const account = await this.getAccount(this.reconcileOptions(options, this.defaultOnDiskOptions));
        account.protectedPin = value;
        await this.saveAccount(account, this.reconcileOptions(options, this.defaultOnDiskOptions));
    }

    async setProviders(value: { [id: string]: ProviderData }, options?: StorageOptions): Promise<void> {
        const account = await this.getAccount(this.reconcileOptions(options, this.defaultInMemoryOptions));
        account.providers = value;
        await this.saveAccount(account, this.reconcileOptions(options, this.defaultInMemoryOptions));
    }

    async setEncryptedProviderKeys(value: { [id: string]: ProviderData }, options?: StorageOptions): Promise<void> {
        const account = await this.getAccount(this.reconcileOptions(options, this.defaultOnDiskOptions));
        account.encryptedProviderKeys = value;
        await this.saveAccount(account, this.reconcileOptions(options, this.defaultOnDiskOptions));
    }

    async setDecryptedProviderKeys(value: Map<string, SymmetricCryptoKey>, options?: StorageOptions): Promise<void> {
        const account = (await this.getAccount(this.reconcileOptions(options, this.defaultInMemoryOptions)));
        account.decryptedProviderKeys = value;
        await this.saveAccount(account, this.reconcileOptions(options, this.defaultInMemoryOptions));
    }

    async setPublicKey(value: ArrayBuffer, options?: StorageOptions): Promise<void> {
        const account = await this.getAccount(this.reconcileOptions(options, this.defaultInMemoryOptions));
        account.publicKey = value;
        await this.saveAccount(account, this.reconcileOptions(options, this.defaultInMemoryOptions));
    }

    async setRefreshToken(value: string, options?: StorageOptions): Promise<void> {
        const account = await this.getAccount(this.reconcileOptions(options, this.defaultInMemoryOptions));
        account.refreshToken = value;
        await this.saveAccount(account, this.reconcileOptions(options, this.defaultInMemoryOptions));
    }

    async setSecurityStamp(value: string, options?: StorageOptions): Promise<void> {
        const account = await this.getAccount(this.reconcileOptions(options, this.defaultInMemoryOptions));
        account.securityStamp = value;
        await this.saveAccount(account, this.reconcileOptions(options, this.defaultInMemoryOptions));
    }

    async setEncryptedSends(value: { [id: string]: SendData }, options?: StorageOptions): Promise<void> {
        const account = await this.getAccount(this.reconcileOptions(options, this.defaultOnDiskMemoryOptions));
        account.encryptedSends = value;
        await this.saveAccount(account, this.reconcileOptions(options, this.defaultOnDiskMemoryOptions));
    }

    async setDecryptedSends(value: SendView[], options?: StorageOptions): Promise<void> {
        const account = await this.getAccount(this.reconcileOptions(options, this.defaultInMemoryOptions));
        account.decryptedSends = value;
        await this.saveAccount(account, this.reconcileOptions(options, this.defaultInMemoryOptions));
    }

    async setSettings(value: any, options?: StorageOptions): Promise<void> {
        const account = await this.getAccount(this.reconcileOptions(options, this.defaultOnDiskMemoryOptions));
        account.settings = value;
        await this.saveAccount(account, this.reconcileOptions(options, this.defaultOnDiskMemoryOptions));
    }

    async setSsoCodeVerifier(value: string, options?: StorageOptions): Promise<void> {
        const account = await this.getAccount(this.reconcileOptions(options, this.defaultInMemoryOptions));
        account.ssoCodeVerifier = value;
        await this.saveAccount(account, this.reconcileOptions(options, this.defaultInMemoryOptions));
    }

    async setSsoOrganizationIdentifier(value: string, options?: StorageOptions): Promise<void> {
        const account = await this.getAccount(this.reconcileOptions(options, this.defaultOnDiskLocalOptions));
        account.ssoOrganizationIdentifier = value;
        await this.saveAccount(account, this.reconcileOptions(options, this.defaultOnDiskLocalOptions));
    }

    async setSsoState(value: string, options?: StorageOptions): Promise<void> {
        const account = await this.getAccount(this.reconcileOptions(options, this.defaultInMemoryOptions));
        account.ssoState = value;
        await this.saveAccount(account, this.reconcileOptions(options, this.defaultInMemoryOptions));
    }

    async setTheme(value: string, options?: StorageOptions): Promise<void> {
        const account = await this.getAccount(this.reconcileOptions(options, this.defaultOnDiskLocalOptions));
        if (account != null) {
            account.theme = value;
            await this.saveAccount(account, this.reconcileOptions(options, this.defaultOnDiskLocalOptions));
        }

        const globals = await this.getGlobals(this.reconcileOptions(options, this.defaultOnDiskLocalOptions));
        globals.theme = value;
        await this.saveGlobals(globals, this.reconcileOptions(options, this.defaultOnDiskLocalOptions));
    }

    async setTwoFactorToken(value: string, options?: StorageOptions): Promise<void> {
        const globals = await this.getGlobals(this.reconcileOptions(options, this.defaultOnDiskLocalOptions));
        globals.twoFactorToken = value;
        await this.saveGlobals(globals, this.reconcileOptions(options, this.defaultOnDiskLocalOptions));
    }

    async setVaultTimeout(value: number, options?: StorageOptions): Promise<void> {
        const account = await this.getAccount(this.reconcileOptions(options, this.defaultOnDiskOptions));
        account.vaultTimeout = value;
        await this.saveAccount(account, this.reconcileOptions(options, this.defaultOnDiskOptions));
    }

    async setVaultTimeoutAction(value: string, options?: StorageOptions): Promise<void> {
        const account = await this.getAccount(this.reconcileOptions(options, this.defaultOnDiskOptions));
        account.vaultTimeoutAction = value;
        await this.saveAccount(account, this.reconcileOptions(options, this.defaultOnDiskOptions));
    }

    async setEverBeenUnlocked(value: boolean, options?: StorageOptions): Promise<void> {
        const account = await this.getAccount(this.reconcileOptions(options, this.defaultOnDiskOptions));
        account.everBeenUnlocked = value;
        await this.saveAccount(account, this.reconcileOptions(options, this.defaultOnDiskOptions));
    }

    async setBiometricLocked(value: boolean, options?: StorageOptions): Promise<void> {
        const account = await this.getAccount(this.reconcileOptions(options, this.defaultInMemoryOptions));
        account.biometricLocked = value;
        await this.saveAccount(account, this.reconcileOptions(options, this.defaultInMemoryOptions));
    }

    async setEnableGravitars(value: boolean, options?: StorageOptions): Promise<void> {
        const account = await this.getAccount(this.reconcileOptions(options, this.defaultOnDiskLocalOptions));
        account.enableGravitars = value;
        await this.saveAccount(account, this.reconcileOptions(options, this.defaultOnDiskLocalOptions));
    }

    async setAddEditCipherInfo(value: any, options?: StorageOptions): Promise<void> {
        const account = await this.getAccount(this.reconcileOptions(options, this.defaultInMemoryOptions));
        account.addEditCipherInfo = value;
        await this.saveAccount(account, this.reconcileOptions(options, this.defaultInMemoryOptions));
    }

    async setRememberedEmail(value: string, options?: StorageOptions): Promise<void> {
        const globals = await this.getGlobals(this.reconcileOptions(options, this.defaultOnDiskLocalOptions));
        globals.rememberedEmail = value;
        await this.saveGlobals(globals, this.reconcileOptions(options, this.defaultOnDiskLocalOptions));
    }

    async setOrganizationInvitation(value: any, options?: StorageOptions): Promise<void> {
        const globals = await this.getGlobals(this.reconcileOptions(options, this.defaultInMemoryOptions));
        globals.organizationInvitation = value;
        await this.saveGlobals(globals, this.reconcileOptions(options, this.defaultInMemoryOptions));
    }

    async setConvertAccountToKeyConnector(value: boolean, options?: StorageOptions): Promise<void> {
        const account = await this.getAccount(this.reconcileOptions(options, this.defaultOnDiskOptions));
        account.convertAccountToKeyConnector = value;
        await this.saveAccount(account, this.reconcileOptions(options, this.defaultOnDiskOptions));
    }

    async setUsesKeyConnector(value: boolean, options?: StorageOptions): Promise<void> {
        const account = await this.getAccount(this.reconcileOptions(options, this.defaultInMemoryOptions));
        account.usesKeyConnector = value;
        await this.saveAccount(account, this.reconcileOptions(options, this.defaultInMemoryOptions));
    }

    async setActiveUser(userId: string): Promise<void> {
        if (!this.state.accounts[userId]) {
            return;
        }
        this.state.activeUserId = userId;
        await this.pushAccounts();
    }

    async setWindow(value: Map<string, any>, options?: StorageOptions): Promise<void> {
        const globals = await this.getGlobals(this.reconcileOptions(options, this.defaultOnDiskOptions));
        globals.window = value;
        return await this.saveGlobals(globals, this.reconcileOptions(options, this.defaultOnDiskOptions));
    }

    async purge(options?: StorageOptions): Promise<void> {
        await this.secureStorageService.remove(options?.userId ?? this.state.activeUserId);
        await this.storageService.remove(options?.userId ?? this.state.activeUserId);
        delete this.state.accounts[options?.userId ?? this.state.activeUserId];
        await this.pushAccounts();
    }

    private async getGlobals(options: StorageOptions): Promise<Globals> {
        let globals: Globals;
        if (this.useMemory(options.storageLocation)) {
            globals = this.getGlobalsFromMemory();
        }

        if (this.useDisk && globals == null) {
            globals = await this.getGlobalsFromDisk();
        }

        return globals ?? new Globals();
    }

    private async saveGlobals(globals: Globals, options: StorageOptions = {
        storageLocation: StorageLocation.Memory,
        useSecureStorage: false,
    }) {
        return this.useMemory(options.storageLocation) ?
            this.saveGlobalsToMemory(globals) :
            this.saveGlobalsToDisk(globals, options);
    }

    private getGlobalsFromMemory(): Globals {
        return this.state.globals;
    }

    private async getGlobalsFromDisk(): Promise<Globals> {
        return await this.storageService.get<Globals>('globals');
    }

    private saveGlobalsToMemory(globals: Globals): void {
        this.state.globals = globals;
    }

    private async saveGlobalsToDisk(globals: Globals, options: StorageOptions): Promise<void> {
        if (options.useSecureStorage) {
            await this.secureStorageService.save('globals', globals, options);
        } else {
            await this.storageService.save('globals', globals, options);
        }
    }

    private async getAccount(options: StorageOptions = {
        storageLocation: StorageLocation.Both,
        useSecureStorage: false,
    }): Promise<Account> {
        try {
            let account: Account;
            if (this.useMemory(options.storageLocation)) {
                account = this.getAccountFromMemory(options);
            }

            if (this.useDisk(options.storageLocation) && account == null) {
                account = await this.getAccountFromDisk(options);
            }

            return account ?? null;
        }
        catch (e) {
            this.logService.error(e);
        }
    }

    private getAccountFromMemory(options: StorageOptions): Account {
        if (this.state.accounts == null) {
            return null;
        }
        return this.state.accounts[this.getUserIdFromMemory(options)];
    }

    private getUserIdFromMemory(options: StorageOptions): string {
        return options?.userId != null ?
            this.state.accounts[options.userId].userId :
            this.state.activeUserId;
    }

    private async getAccountFromDisk(options: StorageOptions): Promise<Account> {
        if (options?.userId == null && this.state.activeUserId == null) {
            return null;
        }

        const account = options?.useSecureStorage ?
            await this.secureStorageService.get<Account>(options.userId ?? this.state.activeUserId, options) :
            await this.storageService.get<Account>(options.userId ?? this.state.activeUserId, options);
        return account;
    }

    private useMemory(storageLocation: StorageLocation) {
        return storageLocation === StorageLocation.Memory ||
            storageLocation === StorageLocation.Both;
    }

    private useDisk(storageLocation: StorageLocation) {
        return storageLocation === StorageLocation.Disk ||
            storageLocation === StorageLocation.Both;
    }

    private async saveAccount(account: Account, options: StorageOptions = {
        storageLocation: StorageLocation.Both,
        useSecureStorage: false,
    }) {
        return this.useMemory(options.storageLocation) ?
            await this.saveAccountToMemory(account) :
            await this.saveAccountToDisk(account, options);
    }

    private async saveAccountToDisk(account: Account, options: StorageOptions): Promise<void> {
        if (options.useSecureStorage) {
            await this.secureStorageService.save(account.userId, account, options);
        } else {
            await this.storageService.save(account.userId, account, options);
        }
        await this.pushAccounts();
    }

    private async saveAccountToMemory(account: Account): Promise<void> {
        if (this.getAccountFromMemory({ userId: account.userId }) !== null) {
            this.state.accounts[account.userId] = account;
        }
        await this.pushAccounts();
    }

    private async scaffoldNewAccountStorage(account: Account): Promise<void> {
        const storageAccount = await this.storageService.get<Account>(account.userId);
        if (storageAccount != null) {
            storageAccount.accessToken = account.accessToken;
            storageAccount.refreshToken = account.refreshToken;
            account = storageAccount;
        }
        await this.storageService.save(account.userId, account);

        if (await this.secureStorageService.get<Account>(account.userId) == null) {
            await this.secureStorageService.save(account.userId, account);
        }
    }

    private async pushAccounts(): Promise<void> {
        if (this.state?.accounts == null || Object.keys(this.state.accounts).length < 1) {
            return;
        }

        for (const i in this.state.accounts) {
            if (this.state.accounts[i].userId === this.state.activeUserId) {
                this.state.accounts[i].authenticationStatus = AuthenticationStatus.Active;
            } else {
                const vaultTimeout = await this.getVaultTimeout({
                    storageLocation: StorageLocation.Disk,
                    userId: this.state.accounts[i].userId,
                });
                const lastActive = await this.getLastActive({
                    storageLocation: StorageLocation.Disk,
                    userId: this.state.accounts[i].userId,
                });
                const diffSeconds = ((new Date()).getTime() - lastActive) / 1000;
                this.state.accounts[i].authenticationStatus = diffSeconds < (vaultTimeout * 60) ?
                    AuthenticationStatus.Unlocked :
                    AuthenticationStatus.Locked;
            }
        }
        this.accounts.next(this.state.accounts);
    }

    private reconcileOptions(requestedOptions: StorageOptions, defaultOptions: StorageOptions): StorageOptions {
        if (requestedOptions == null) {
            return defaultOptions;
        }
        requestedOptions.userId = requestedOptions?.userId ?? defaultOptions.userId;
        requestedOptions.storageLocation = requestedOptions?.storageLocation ?? defaultOptions.storageLocation;
        requestedOptions.keySuffix = requestedOptions?.keySuffix ?? defaultOptions.keySuffix;
        requestedOptions.useSecureStorage = requestedOptions?.useSecureStorage ?? defaultOptions.useSecureStorage;
        requestedOptions.htmlStorageLocation = requestedOptions?.htmlStorageLocation ?? defaultOptions.htmlStorageLocation;
        return requestedOptions;
    }
}

class RequiredSuffixError extends Error {
    constructor(public message: string = 'The suffix option is required to get/set this key.') {
        super(message);
    }
}
