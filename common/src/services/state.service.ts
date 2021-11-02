import { StateService as StateServiceAbstraction } from '../abstractions/state.service';

import { Account, AuthenticationStatus } from '../models/domain/account';

import { LogService } from '../abstractions/log.service';
import { StorageService } from '../abstractions/storage.service';

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

    constructor(private storageService: StorageService, private secureStorageService: StorageService,
        private logService: LogService) {
    }

    async addAccount(account: Account) {
        this.state.accounts[account.userId] = account;
        await this.scaffoldNewAccountStorage(account);
        await this.setActiveUser(account.userId);
    }

    async getEnableGravitars(options?: StorageOptions): Promise<boolean> {
        return (await this.getAccount(options ?? { storageLocation: StorageLocation.Disk})).enableGravitars ?? true;
    }

    async getAddEditCipherInfo(options?: StorageOptions): Promise<any> {
        return (await this.getAccount(options ?? { storageLocation: StorageLocation.Memory})).addEditCipherInfo;
    }

    async getUserId(options?: StorageOptions): Promise<string> {
        return (await this.getAccount(options ?? { storageLocation: StorageLocation.Memory})).userId;
    }

    async getEmail(options?: StorageOptions): Promise<string> {
        return (await this.getAccount(options ?? { storageLocation: StorageLocation.Memory }))?.email;
    }

    async getIsAuthenticated(options?: StorageOptions): Promise<boolean> {
        return (await this.getAccount(options ?? { storageLocation: StorageLocation.Memory }))?.isAuthenticated ?? false;
    }

    async getCanAccessPremium(options?: StorageOptions): Promise<boolean> {
        return (await this.getAccount(options ?? { storageLocation: StorageLocation.Memory }))?.canAccessPremium ?? false;
    }

    async getAccessToken(options?: StorageOptions): Promise<string> {
        return (await this.getAccount(options ?? { storageLocation: StorageLocation.Memory }))?.accessToken;
    }

    async getDecodedToken(options?: StorageOptions): Promise<any> {
        return (await this.getAccount(options ?? { storageLocation: StorageLocation.Memory }))?.decodedToken;
    }

    async getAlwaysShowDock(options?: StorageOptions): Promise<boolean> {
        return (await this.getAccount(options ?? { storageLocation: StorageLocation.Disk }))?.alwaysShowDock ?? false;
    }

    async getApiKeyClientId(options?: StorageOptions): Promise<string> {
        return (await this.getAccount(options ?? { storageLocation: StorageLocation.Memory }))?.apiKeyClientId;
    }

    async getApiKeyClientSecret(options?: StorageOptions): Promise<string> {
        return (await this.getAccount(options ?? { storageLocation: StorageLocation.Memory }))?.apiKeyClientSecret;
    }

    async getAutoConfirmFingerPrints(options?: StorageOptions): Promise<boolean> {
        return (await this.getAccount(options ?? { storageLocation: StorageLocation.Disk})).autoConfirmFingerPrints ?? true;
    }

    async getAutoFillOnPageLoadDefault(options?: StorageOptions): Promise<boolean> {
        return (await this.getAccount(options ?? { storageLocation: StorageLocation.Memory }))?.autoFillOnPageLoadDefault ?? false;
    }

    async getBiometricAwaitingAcceptance(options?: StorageOptions): Promise<boolean> {
        return (await this.getAccount(options ?? { storageLocation: StorageLocation.Memory }))?.biometricAwaitingAcceptance ?? false;
    }

    async getBiometricFingerprintValidated(options?: StorageOptions): Promise<boolean> {
        return (await this.getAccount(options ?? { storageLocation: StorageLocation.Memory }))?.biometricFingerprintValidated ?? false;
    }

    async getBiometricText(options?: StorageOptions): Promise<string> {
        return (await this.getGlobals(options ?? { storageLocation: StorageLocation.Disk }))?.biometricText;
    }

    async getBiometricUnlock(options?: StorageOptions): Promise<boolean> {
        return (await this.getAccount(options ?? { storageLocation: StorageLocation.Memory }))?.biometricUnlock ?? false;
    }

    async getEncryptedCiphers(options?: StorageOptions): Promise<{ [id: string]: CipherData }> {
        return (await this.getAccount(options ?? { storageLocation: StorageLocation.Disk }))?.encryptedCiphers;
    }

    async getDecryptedCiphers(options?: StorageOptions): Promise<CipherView[]> {
        return (await this.getAccount(options ?? { storageLocation: StorageLocation.Memory }))?.decryptedCiphers;
    }

    async getClearClipboard(options?: StorageOptions): Promise<number> {
        return (await this.getAccount(options ?? { storageLocation: StorageLocation.Memory }))?.clearClipboard;
    }

    async getCollapsedGroupings(options?: StorageOptions): Promise<Set<string>> {
        return (await this.getAccount(options ?? { storageLocation: StorageLocation.Memory }))?.collapsedGroupings;
    }

    async getEncryptedCollections(options?: StorageOptions): Promise<{ [id: string]: CollectionData }> {
        return (await this.getAccount(options ?? { storageLocation: StorageLocation.Disk }))?.encryptedCollections;
    }

    async getDecryptedCollections(options?: StorageOptions): Promise<CollectionView[]> {
        return (await this.getAccount(options ?? { storageLocation: StorageLocation.Memory }))?.decryptedCollections;
    }

    async getCryptoMasterKey(options?: StorageOptions): Promise<SymmetricCryptoKey> {
        return (await this.getAccount(options ?? { storageLocation: StorageLocation.Memory }))?.cryptoMasterKey;
    }

    async getCryptoMasterKeyB64(options: StorageOptions): Promise<string> {
        try {
            if (options?.keySuffix == null) {
                throw new RequiredSuffixError();
            }
            options.storageLocation = options.storageLocation ?? StorageLocation.Disk;
            options.useSecureStorage = options.useSecureStorage ?? true;
            return (await this.getAccount(options))?.cryptoMasterKeyB64;
        } catch (e) {
            this.logService.error(e);
        }
    }

    async getEncryptedCryptoSymmetricKey(options?: StorageOptions): Promise<string> {
        return (await this.getAccount(options ?? { storageLocation: StorageLocation.Disk }))?.encryptedCryptoSymmetricKey;
    }

    async getDecryptedCryptoSymmetricKey(options?: StorageOptions): Promise<SymmetricCryptoKey> {
        return (await this.getAccount(options ?? { storageLocation: StorageLocation.Memory }))?.decryptedCryptoSymmetricKey;
    }

    async getDefaultUriMatch(options?: StorageOptions): Promise<UriMatchType> {
        return (await this.getAccount(options ?? { storageLocation: StorageLocation.Memory }))?.defaultUriMatch;
    }

    async getDisableAddLoginNotification(options?: StorageOptions): Promise<boolean> {
        return (await this.getAccount(options ?? { storageLocation: StorageLocation.Memory }))?.disableAddLoginNotification ?? false;
    }

    async getDisableAutoBiometricsPrompt(options?: StorageOptions): Promise<boolean> {
        return (await this.getAccount(options ?? { storageLocation: StorageLocation.Memory }))?.disableAutoBiometricsPrompt ?? false;
    }

    async getDisableAutoTotpCopy(options?: StorageOptions): Promise<boolean> {
        return (await this.getAccount(options ?? { storageLocation: StorageLocation.Memory }))?.disableAutoTotpCopy ?? false;
    }

    async getDisableBadgeCounter(options?: StorageOptions): Promise<boolean> {
        return (await this.getAccount(options ?? { storageLocation: StorageLocation.Memory }))?.disableBadgeCounter ?? false;
    }

    async getDisableChangedPasswordNotification(options?: StorageOptions): Promise<boolean> {
        return (await this.getAccount(options ?? { storageLocation: StorageLocation.Memory }))?.disableChangedPasswordNotification ?? false;
    }

    async getDisableContextMenuItem(options?: StorageOptions): Promise<boolean> {
        return (await this.getAccount(options ?? { storageLocation: StorageLocation.Memory }))?.disableContextMenuItem ?? false;
    }

    async getDisableFavicon(options?: StorageOptions): Promise<boolean> {
        return (await this.getAccount(options ?? { storageLocation: StorageLocation.Disk }))?.disableFavicon ?? false;
    }

    async getDisableGa(options?: StorageOptions): Promise<boolean> {
        return (await this.getAccount(options ?? { storageLocation: StorageLocation.Memory }))?.disableGa ?? false;
    }

    async getDontShowCardsCurrentTab(options?: StorageOptions): Promise<boolean> {
        return (await this.getAccount(options ?? { storageLocation: StorageLocation.Memory }))?.dontShowCardsCurrentTab ?? false;
    }

    async getDontShowIdentitiesCurrentTab(options?: StorageOptions): Promise<boolean> {
        return (await this.getAccount(options ?? { storageLocation: StorageLocation.Memory }))?.dontShowIdentitiesCurrentTab ?? false;
    }

    async getEmailVerified(options?: StorageOptions): Promise<boolean> {
        return (await this.getAccount(options ?? { storageLocation: StorageLocation.Memory }))?.emailVerified ?? false;
    }

    async getEnableAlwaysOnTop(options?: StorageOptions): Promise<boolean> {
        const accountPreference = (await this.getAccount(options ?? { storageLocation: StorageLocation.Disk }))?.enableAlwaysOnTop;
        const globalPreference = (await this.getGlobals(options ?? { storageLocation: StorageLocation.Disk }))?.enableAlwaysOnTop;
        return accountPreference ?? globalPreference ?? false;
    }

    async getEnableAutoFillOnPageLoad(options?: StorageOptions): Promise<boolean> {
        return (await this.getAccount(options ?? { storageLocation: StorageLocation.Memory }))?.enableAutoFillOnPageLoad ?? false;
    }

    async getEnableBiometric(options?: StorageOptions): Promise<boolean> {
        return (await this.getGlobals(options ?? { storageLocation: StorageLocation.Disk }))?.enableBiometrics ?? false;
    }

    async getEnableBrowserIntegration(options?: StorageOptions): Promise<boolean> {
        return (await this.getAccount(options ?? { storageLocation: StorageLocation.Disk }))?.enableBrowserIntegration ?? false;
    }

    async getEnableBrowserIntegrationFingerprint(options?: StorageOptions): Promise<boolean> {
        return (await this.getAccount(options ?? { storageLocation: StorageLocation.Disk }))?.enableBrowserIntegrationFingerprint ?? false;
    }

    async getEnableCloseToTray(options?: StorageOptions): Promise<boolean> {
        return (await this.getAccount(options ?? { storageLocation: StorageLocation.Memory }))?.enableCloseToTray ?? false;
    }

    async getEnableMinimizeToTray(options?: StorageOptions): Promise<boolean> {
        return (await this.getAccount(options ?? { storageLocation: StorageLocation.Disk }))?.enableMinimizeToTray ?? false;
    }

    async getEnableStartToTray(options?: StorageOptions): Promise<boolean> {
        return (await this.getAccount(options ?? { storageLocation: StorageLocation.Memory }))?.enableStartToTray ?? false;
    }

    async getEnableTray(options?: StorageOptions): Promise<boolean> {
        return (await this.getAccount(options ?? { storageLocation: StorageLocation.Memory }))?.enableTray ?? false;
    }

    async getEncryptedOrganizationKeys(options?: StorageOptions): Promise<any> {
        return (await this.getAccount(options ?? { storageLocation: StorageLocation.Disk }))?.encryptedOrganizationKeys;
    }

    async getDecryptedOrganizationKeys(options?: StorageOptions): Promise<Map<string, SymmetricCryptoKey>> {
        return (await this.getAccount(options ?? { storageLocation: StorageLocation.Memory }))?.decryptedOrganizationKeys;
    }

    async getEncryptedPrivateKey(options?: StorageOptions): Promise<string> {
        return (await this.getAccount(options ?? { storageLocation: StorageLocation.Disk }))?.encryptedPrivateKey;
    }

    async getDecryptedPrivateKey(options?: StorageOptions): Promise<ArrayBuffer> {
        return (await this.getAccount(options ?? { storageLocation: StorageLocation.Memory }))?.decryptedPrivateKey;
    }

    async getEncryptedProviderKeys(options?: StorageOptions): Promise<any> {
        return (await this.getAccount(options ?? { storageLocation: StorageLocation.Disk }))?.encryptedProviderKeys;
    }

    async getDecryptedProviderKeys(options?: StorageOptions): Promise<Map<string, SymmetricCryptoKey>> {
        return (await this.getAccount(options ?? { storageLocation: StorageLocation.Memory }))?.decryptedProviderKeys;
    }

    async getEntityId(options?: StorageOptions): Promise<string> {
        return (await this.getAccount(options ?? { storageLocation: StorageLocation.Memory }))?.entityId;
    }

    async getEntityType(options?: StorageOptions): Promise<string> {
        return (await this.getAccount(options ?? { storageLocation: StorageLocation.Memory }))?.entityType;
    }

    async getEnvironmentUrls(options?: StorageOptions): Promise<any> {
        const account = await this.getAccount(options ?? { storageLocation: StorageLocation.Disk });
        return account?.environmentUrls ?? null;
    }

    async getEquivalentDomains(options?: StorageOptions): Promise<any> {
        return (await this.getAccount(options ?? { storageLocation: StorageLocation.Memory }))?.equivalentDomains;
    }

    async getEventCollection(options?: StorageOptions): Promise<EventData[]> {
        return (await this.getAccount(options ?? { storageLocation: StorageLocation.Memory }))?.eventCollection;
    }

    async getEncryptedFolders(options?: StorageOptions): Promise<{ [id: string]: FolderData }> {
        return (await this.getAccount(options ?? { storageLocation: StorageLocation.Disk }))?.encryptedFolders;
    }

    async getDecryptedFolders(options?: StorageOptions): Promise<FolderView[]> {
        return (await this.getAccount(options ?? { storageLocation: StorageLocation.Memory }))?.decryptedFolders;
    }

    async getForcePasswordReset(options?: StorageOptions): Promise<boolean> {
        return (await this.getAccount(options ?? { storageLocation: StorageLocation.Memory }))?.forcePasswordReset ?? false;
    }

    async getInstalledVersion(options?: StorageOptions): Promise<string> {
        return (await this.getGlobals(options ?? { storageLocation: StorageLocation.Disk }))?.installedVersion;
    }

    async getKdfIterations(options?: StorageOptions): Promise<number> {
        return (await this.getAccount(options ?? { storageLocation: StorageLocation.Memory }))?.kdfIterations;
    }

    async getKdfType(options?: StorageOptions): Promise<KdfType> {
        return (await this.getAccount(options ?? { storageLocation: StorageLocation.Memory }))?.kdfType;
    }

    async getKeyHash(options?: StorageOptions): Promise<string> {
        return (await this.getAccount(options ?? { storageLocation: StorageLocation.Both }))?.keyHash;
    }

    async getLastSync(options?: StorageOptions): Promise<string> {
        return (await this.getAccount(options ?? { storageLocation: StorageLocation.Memory }))?.lastSync;
    }

    async getLastActive(options?: StorageOptions): Promise<number> {
        const lastActive = (await this.getAccount(options ?? { storageLocation: StorageLocation.Disk }))?.lastActive;
        return lastActive ?? (await this.getGlobals(options ?? { storageLocation: StorageLocation.Disk })).lastActive;
    }

    async getLegacyEtmKey(options?: StorageOptions): Promise<SymmetricCryptoKey> {
        return (await this.getAccount(options ?? { storageLocation: StorageLocation.Memory }))?.legacyEtmKey;
    }

    async getLocalData(options?: StorageOptions): Promise<any> {
        return (await this.getAccount(options ?? { storageLocation: StorageLocation.Memory }))?.localData;
    }

    async getLocale(options?: StorageOptions): Promise<string> {
        return (await this.getAccount(options ?? { storageLocation: StorageLocation.Memory }))?.locale;
    }

    async getLoginRedirect(options?: StorageOptions): Promise<string> {
        return (await this.getAccount(options ?? { storageLocation: StorageLocation.Memory }))?.loginRedirect;
    }

    async getMainWindowSize(options?: StorageOptions): Promise<number> {
        return (await this.getAccount(options ?? { storageLocation: StorageLocation.Memory }))?.mainWindowSize;
    }

    async getMinimizeOnCopyToClipboard(options?: StorageOptions): Promise<boolean> {
        return (await this.getAccount(options ?? { storageLocation: StorageLocation.Disk }))?.minimizeOnCopyToClipboard ?? false;
    }

    async getNeverDomains(options?: StorageOptions): Promise<string[]> {
        return (await this.getAccount(options ?? { storageLocation: StorageLocation.Memory }))?.neverDomains;
    }

    async getNoAutoPromptBiometrics(options?: StorageOptions): Promise<boolean> {
        return (await this.getAccount(options ?? { storageLocation: StorageLocation.Disk }))?.noAutoPromptBiometrics ?? false;
    }

    async getNoAutoPromptBiometricsText(options?: StorageOptions): Promise<string> {
        return (await this.getGlobals(options ?? { storageLocation: StorageLocation.Disk }))?.noAutoPromptBiometricsText;
    }

    async getOpenAtLogin(options?: StorageOptions): Promise<boolean> {
        return (await this.getGlobals(options ?? { storageLocation: StorageLocation.Disk }))?.openAtLogin ?? false;
    }

    async getEncryptedPasswordGenerationHistory(options?: StorageOptions): Promise<GeneratedPasswordHistory[]> {
        return (await this.getAccount(options ?? { storageLocation: StorageLocation.Disk }))?.encryptedPasswordGenerationHistory;
    }

    async getDecryptedPasswordGenerationHistory(options?: StorageOptions): Promise<GeneratedPasswordHistory[]> {
        return (await this.getAccount(options ?? { storageLocation: StorageLocation.Memory }))?.decryptedPasswordGenerationHistory;
    }

    async getPasswordGenerationOptions(options?: StorageOptions): Promise<any> {
        return (await this.getAccount(options ?? { storageLocation: StorageLocation.Memory }))?.passwordGenerationOptions;
    }

    async getEncryptedPinProtected(options?: StorageOptions): Promise<string> {
        return (await this.getAccount(options ?? { storageLocation: StorageLocation.Disk }))?.encryptedPinProtected;
    }

    async getDecryptedPinProtected(options?: StorageOptions): Promise<EncString> {
        return (await this.getAccount(options ?? { storageLocation: StorageLocation.Memory }))?.decryptedPinProtected;
    }

    async getEncryptedPolicies(options?: StorageOptions): Promise<{ [id: string]: PolicyData }> {
        return (await this.getAccount(options ?? { storageLocation: StorageLocation.Disk }))?.encryptedPolicies;
    }

    async getDecryptedPolicies(options?: StorageOptions): Promise<Policy[]> {
        return (await this.getAccount(options ?? { storageLocation: StorageLocation.Memory }))?.decryptedPolicies;
    }

    async getProtectedPin(options?: StorageOptions): Promise<string> {
        return (await this.getAccount(options ?? { storageLocation: StorageLocation.Memory }))?.protectedPin;
    }

    async getProviders(options?: StorageOptions): Promise<{ [id: string]: ProviderData }> {
        return (await this.getAccount(options ?? { storageLocation: StorageLocation.Memory }))?.providers;
    }

    async getPublicKey(options?: StorageOptions): Promise<ArrayBuffer> {
        return (await this.getAccount(options ?? { storageLocation: StorageLocation.Memory }))?.publicKey;
    }

    async getRefreshToken(options?: StorageOptions): Promise<string> {
        return (await this.getAccount(options ?? { storageLocation: StorageLocation.Memory }))?.refreshToken;
    }

    async getRememberEmail(options?: StorageOptions): Promise<boolean> {
        return (await this.getGlobals(options ?? { storageLocation: StorageLocation.Disk }))?.rememberEmail ?? false;
    }

    async getRememberedEmail(options?: StorageOptions): Promise<string> {
        return (await this.getGlobals(options ?? { storageLocation: StorageLocation.Disk }))?.rememberedEmail;
    }

    async getSecurityStamp(options?: StorageOptions): Promise<string> {
        return (await this.getAccount(options ?? { storageLocation: StorageLocation.Memory }))?.securityStamp;
    }

    async getEncryptedSends(options?: StorageOptions): Promise<{ [id: string]: SendData }> {
        return (await this.getAccount(options ?? { storageLocation: StorageLocation.Disk }))?.encryptedSends;
    }

    async getDecryptedSends(options?: StorageOptions): Promise<SendView[]> {
        return (await this.getAccount(options ?? { storageLocation: StorageLocation.Memory }))?.decryptedSends;
    }

    async getSettings(options?: StorageOptions): Promise<any> {
        return (await this.getAccount(options ?? { storageLocation: StorageLocation.Disk }))?.settings;
    }

    async getSsoCodeVerifier(options?: StorageOptions): Promise<string> {
        return (await this.getAccount(options ?? { storageLocation: StorageLocation.Memory }))?.ssoCodeVerifier;
    }

    async getSsoOrgIdentifier(options?: StorageOptions): Promise<string> {
        return (await this.getAccount(options ?? { storageLocation: StorageLocation.Memory }))?.ssoOrganizationIdentifier;
    }

    async getSsoState(options?: StorageOptions): Promise<string> {
        return (await this.getAccount(options ?? { storageLocation: StorageLocation.Memory }))?.ssoState;
    }

    async getTheme(options?: StorageOptions): Promise<string> {
        let theme = (await this.getAccount(options ?? { storageLocation: StorageLocation.Disk }))?.theme;
        theme = theme ?? (await this.getGlobals(options ?? { storageLocation: StorageLocation.Disk }))?.theme;
        return theme;
    }

    async getTwoFactorToken(options?: StorageOptions): Promise<string> {
        return (await this.getGlobals(options ?? { storageLocation: StorageLocation.Memory }))?.twoFactorToken;
    }

    async getVaultTimeout(options?: StorageOptions): Promise<number> {
        return (await this.getAccount(options ?? { storageLocation: StorageLocation.Disk }))?.vaultTimeout;
    }

    async getVaultTimeoutAction(options?: StorageOptions): Promise<string> {
        return (await this.getAccount(options ?? { storageLocation: StorageLocation.Disk }))?.vaultTimeoutAction;
    }

    async getOrganizations(options?: StorageOptions): Promise<{ [id: string]: OrganizationData }> {
        return (await this.getAccount(options ?? { storageLocation: StorageLocation.Memory })).organizations;
    }

    async getEverBeenUnlocked(options?: StorageOptions): Promise<boolean> {
        return (await this.getAccount(options ?? { storageLocation: StorageLocation.Memory })).everBeenUnlocked ?? false;
    }

    async getBiometricLocked(options?: StorageOptions): Promise<boolean> {
        return (await this.getAccount(options ?? { storageLocation: StorageLocation.Memory })).biometricLocked ?? false;
    }

    async getWindow(): Promise<Map<string, any>> {
        const globals = await this.getGlobals({ storageLocation: StorageLocation.Disk });
        return Object.keys(globals.window).length > 0 ?
            globals.window :
            new Map<string, any>();
    }

    async getOrganizationInvitation(options?: StorageOptions): Promise<any> {
        return (await this.getGlobals(options ?? { storageLocation: StorageLocation.Memory})).organizationInvitation;
    }

    async setAccessToken(value: string, options?: StorageOptions): Promise<void> {
        const account = await this.getAccount(options ?? { storageLocation: StorageLocation.Memory });
        account.accessToken = value;
        await this.saveAccount(account, options ?? { storageLocation: StorageLocation.Memory });
    }

    async setDecodedToken(value: any, options?: StorageOptions): Promise<void> {
        const account = await this.getAccount(options ?? { storageLocation: StorageLocation.Memory });
        account.decodedToken = value;
        await this.saveAccount(account, options ?? { storageLocation: StorageLocation.Memory });
    }

    async setAlwaysShowDock(value: boolean, options?: StorageOptions): Promise<void> {
        const account = await this.getAccount(options ?? { storageLocation: StorageLocation.Disk });
        account.alwaysShowDock = value;
        await this.saveAccount(account, options ?? { storageLocation: StorageLocation.Disk });
    }

    async setApiKeyClientId(value: string, options?: StorageOptions): Promise<void> {
        const account = await this.getAccount(options ?? { storageLocation: StorageLocation.Memory });
        account.apiKeyClientId = value;
        await this.saveAccount(account, options ?? { storageLocation: StorageLocation.Memory });
    }

    async setApiKeyClientSecret(value: string, options?: StorageOptions): Promise<void> {
        const account = await this.getAccount(options ?? { storageLocation: StorageLocation.Memory });
        account.apiKeyClientSecret = value;
        await this.saveAccount(account, options ?? { storageLocation: StorageLocation.Memory });
    }

    async setAutoConfirmFingerprints(value: boolean, options?: StorageOptions): Promise<void> {
        const account = await this.getAccount(options ?? { storageLocation: StorageLocation.Disk });
        account.autoConfirmFingerPrints = value;
        await this.saveAccount(account, options ?? { storageLocation: StorageLocation.Disk });
    }

    async setAutoFillOnPageLoadDefault(value: boolean, options?: StorageOptions): Promise<void> {
        const account = await this.getAccount(options ?? { storageLocation: StorageLocation.Memory });
        account.autoFillOnPageLoadDefault = value;
        await this.saveAccount(account, options ?? { storageLocation: StorageLocation.Memory });
    }

    async setBiometricAwaitingAcceptance(value: boolean, options?: StorageOptions): Promise<void> {
        const account = await this.getAccount(options ?? { storageLocation: StorageLocation.Memory });
        account.biometricAwaitingAcceptance = value;
        await this.saveAccount(account, options ?? { storageLocation: StorageLocation.Memory });
    }

    async setBiometricFingerprintValidated(value: boolean, options?: StorageOptions): Promise<void> {
        const account = await this.getAccount(options ?? { storageLocation: StorageLocation.Memory });
        account.biometricFingerprintValidated = value;
        await this.saveAccount(account, options ?? { storageLocation: StorageLocation.Memory });
    }

    async setBiometricText(value: string, options?: StorageOptions): Promise<void> {
        const globals = await this.getGlobals(options ?? { storageLocation: StorageLocation.Disk });
        globals.biometricText = value;
        await this.saveGlobals(globals, options ?? { storageLocation: StorageLocation.Disk });
    }

    async setBiometricUnlock(value: boolean, options?: StorageOptions): Promise<void> {
        const account = await this.getAccount(options ?? { storageLocation: StorageLocation.Memory });
        account.biometricUnlock = value;
        await this.saveAccount(account, options ?? { storageLocation: StorageLocation.Memory });
    }

    async setEncryptedCiphers(value: { [id: string]: CipherData }, options?: StorageOptions): Promise<void> {
        const account = await this.getAccount(options ?? { storageLocation: StorageLocation.Disk });
        account.encryptedCiphers = value;
        await this.saveAccount(account, options ?? { storageLocation: StorageLocation.Disk });
    }

    async setDecryptedCiphers(value: CipherView[], options?: StorageOptions): Promise<void> {
        const account = await this.getAccount(options ?? { storageLocation: StorageLocation.Memory });
        account.decryptedCiphers = value;
        await this.saveAccount(account, options ?? { storageLocation: StorageLocation.Memory });
    }

    async setClearClipboard(value: number, options?: StorageOptions): Promise<void> {
        const account = await this.getAccount(options ?? { storageLocation: StorageLocation.Memory });
        account.clearClipboard = value;
        await this.saveAccount(account, options ?? { storageLocation: StorageLocation.Memory });
    }

    async setCollapsedGroupings(value: Set<string>, options?: StorageOptions): Promise<void> {
        const account = await this.getAccount(options ?? { storageLocation: StorageLocation.Memory });
        account.collapsedGroupings = value;
        await this.saveAccount(account, options ?? { storageLocation: StorageLocation.Memory });
    }

    async setEncryptedCollections(value: { [id: string]: CollectionData }, options?: StorageOptions): Promise<void> {
        const account = await this.getAccount(options ?? { storageLocation: StorageLocation.Disk });
        account.encryptedCollections = value;
        await this.saveAccount(account, options ?? { storageLocation: StorageLocation.Disk });
    }

    async setDecryptedCollections(value: CollectionView[], options?: StorageOptions): Promise<void> {
        const account = await this.getAccount(options ?? { storageLocation: StorageLocation.Memory });
        account.decryptedCollections = value;
        await this.saveAccount(account, options ?? { storageLocation: StorageLocation.Memory });
    }

    async setCryptoMasterKey(value: SymmetricCryptoKey, options?: StorageOptions): Promise<void> {
        options = options ?? { storageLocation: StorageLocation.Memory };
        const account = await this.getAccount(options ?? { storageLocation: StorageLocation.Memory });
        account.cryptoMasterKey = value;
        await this.saveAccount(account, options ?? { storageLocation: StorageLocation.Memory });
    }

    async setCryptoMasterKeyB64(value: string, options: StorageOptions): Promise<void> {
        try {
            if (value != null && options?.keySuffix == null) {
                throw new RequiredSuffixError();
            }
            options.storageLocation = options.storageLocation ?? StorageLocation.Disk;
            options.useSecureStorage = options.useSecureStorage ?? true;
            const account = await this.getAccount(options);

            if (account != null) {
                account.cryptoMasterKeyB64 = value;
                await this.saveAccount(account, options);
            }
        } catch (e) {
            this.logService.error(e);
        }
    }

    async setEncryptedCryptoSymmetricKey(value: string, options?: StorageOptions): Promise<void> {
        const account = await this.getAccount(options ?? { storageLocation: StorageLocation.Disk });
        account.encryptedCryptoSymmetricKey = value;
        await this.saveAccount(account, options ?? { storageLocation: StorageLocation.Disk });
    }

    async setDecryptedCryptoSymmetricKey(value: SymmetricCryptoKey, options?: StorageOptions): Promise<void> {
        const account = await this.getAccount(options ?? { storageLocation: StorageLocation.Memory });
        account.decryptedCryptoSymmetricKey = value;
        await this.saveAccount(account, options ?? { storageLocation: StorageLocation.Memory });
    }

    async setDefaultUriMatch(value: UriMatchType, options?: StorageOptions): Promise<void> {
        const account = await this.getAccount(options ?? { storageLocation: StorageLocation.Memory });
        account.defaultUriMatch = value;
        await this.saveAccount(account, options ?? { storageLocation: StorageLocation.Memory });
    }

    async setDisableAddLoginNotification(value: boolean, options?: StorageOptions): Promise<void> {
        const account = await this.getAccount(options ?? { storageLocation: StorageLocation.Memory });
        account.disableAddLoginNotification = value;
        await this.saveAccount(account, options ?? { storageLocation: StorageLocation.Memory });
    }

    async setDisableAutoBiometricsPrompt(value: boolean, options?: StorageOptions): Promise<void> {
        const account = await this.getAccount(options ?? { storageLocation: StorageLocation.Memory });
        account.disableAutoBiometricsPrompt = value;
        await this.saveAccount(account, options ?? { storageLocation: StorageLocation.Memory });
    }

    async setDisableAutoTotpCopy(value: boolean, options?: StorageOptions): Promise<void> {
        const account = await this.getAccount(options ?? { storageLocation: StorageLocation.Memory });
        account.disableAutoTotpCopy = value;
        await this.saveAccount(account, options ?? { storageLocation: StorageLocation.Memory });
    }

    async setDisableBadgeCounter(value: boolean, options?: StorageOptions): Promise<void> {
        const account = await this.getAccount(options ?? { storageLocation: StorageLocation.Memory });
        account.disableBadgeCounter = value;
        await this.saveAccount(account, options ?? { storageLocation: StorageLocation.Memory });
    }

    async setDisableChangedPasswordNotification(value: boolean, options?: StorageOptions): Promise<void> {
        const account = await this.getAccount(options ?? { storageLocation: StorageLocation.Memory });
        account.disableChangedPasswordNotification = value;
        await this.saveAccount(account, options ?? { storageLocation: StorageLocation.Memory });
    }

    async setDisableContextMenuItem(value: boolean, options?: StorageOptions): Promise<void> {
        const account = await this.getAccount(options ?? { storageLocation: StorageLocation.Memory });
        account.disableContextMenuItem = value;
        await this.saveAccount(account, options ?? { storageLocation: StorageLocation.Memory });
    }

    async setDisableFavicon(value: boolean, options?: StorageOptions): Promise<void> {
        const account = await this.getAccount(options ?? { storageLocation: StorageLocation.Disk });
        account.disableFavicon = value;
        await this.saveAccount(account, options ?? { storageLocation: StorageLocation.Disk });
    }

    async setDisableGa(value: boolean, options?: StorageOptions): Promise<void> {
        const account = await this.getAccount(options ?? { storageLocation: StorageLocation.Memory });
        account.disableGa = value;
        await this.saveAccount(account, options ?? { storageLocation: StorageLocation.Memory });
    }

    async setDontShowCardsCurrentTab(value: boolean, options?: StorageOptions): Promise<void> {
        const account = await this.getAccount(options ?? { storageLocation: StorageLocation.Memory });
        account.dontShowCardsCurrentTab = value;
        await this.saveAccount(account, options ?? { storageLocation: StorageLocation.Memory });
    }

    async setDontShowIdentitiesCurrentTab(value: boolean, options?: StorageOptions): Promise<void> {
        const account = await this.getAccount(options ?? { storageLocation: StorageLocation.Memory });
        account.dontShowIdentitiesCurrentTab = value;
        await this.saveAccount(account, options ?? { storageLocation: StorageLocation.Memory });
    }

    async setEmail(value: string, options?: StorageOptions): Promise<void> {
        const account = await this.getAccount(options ?? { storageLocation: StorageLocation.Memory });
        account.email = value;
        await this.saveAccount(account, options ?? { storageLocation: StorageLocation.Memory });
    }

    async setEmailVerified(value: boolean, options?: StorageOptions): Promise<void> {
        const account = await this.getAccount(options ?? { storageLocation: StorageLocation.Memory });
        account.emailVerified = value;
        await this.saveAccount(account, options ?? { storageLocation: StorageLocation.Memory });
    }

    async setEnableAlwaysOnTop(value: boolean, options?: StorageOptions): Promise<void> {
        const account = await this.getAccount(options ?? { storageLocation: StorageLocation.Disk });
        account.enableAlwaysOnTop = value;
        await this.saveAccount(account, options ?? { storageLocation: StorageLocation.Disk });

        const globals = await this.getGlobals(options ?? { storageLocation: StorageLocation.Disk });
        globals.enableAlwaysOnTop = value;
        await this.saveGlobals(globals, options ?? { storageLocation: StorageLocation.Disk });
    }

    async setEnableAutoFillOnPageLoad(value: boolean, options?: StorageOptions): Promise<void> {
        const account = await this.getAccount(options ?? { storageLocation: StorageLocation.Memory });
        account.enableAutoFillOnPageLoad = value;
        await this.saveAccount(account, options ?? { storageLocation: StorageLocation.Memory });
    }

    async setEnableBiometric(value: boolean, options?: StorageOptions): Promise<void> {
        const globals = await this.getGlobals(options ?? { storageLocation: StorageLocation.Disk });
        globals.enableBiometrics = value;
        await this.saveGlobals(globals, options ?? { storageLocation: StorageLocation.Disk });
    }

    async setEnableBrowserIntegration(value: boolean, options?: StorageOptions): Promise<void> {
        const account = await this.getAccount(options ?? { storageLocation: StorageLocation.Disk });
        account.enableBrowserIntegration = value;
        await this.saveAccount(account, options ?? { storageLocation: StorageLocation.Disk });
    }

    async setEnableBrowserIntegrationFingerprint(value: boolean, options?: StorageOptions): Promise<void> {
        const account = await this.getAccount(options ?? { storageLocation: StorageLocation.Disk });
        account.enableBrowserIntegrationFingerprint = value;
        await this.saveAccount(account, options ?? { storageLocation: StorageLocation.Disk });
    }

    async setEnableCloseToTray(value: boolean, options?: StorageOptions): Promise<void> {
        const account = await this.getAccount(options ?? { storageLocation: StorageLocation.Memory });
        account.enableCloseToTray = value;
        await this.saveAccount(account, options ?? { storageLocation: StorageLocation.Memory });
    }

    async setEnableMinimizeToTray(value: boolean, options?: StorageOptions): Promise<void> {
        const account = await this.getAccount(options ?? { storageLocation: StorageLocation.Disk });
        account.enableMinimizeToTray = value;
        await this.saveAccount(account, options ?? { storageLocation: StorageLocation.Disk });
    }

    async setEnableStartToTray(value: boolean, options?: StorageOptions): Promise<void> {
        const account = await this.getAccount(options ?? { storageLocation: StorageLocation.Memory });
        account.enableStartToTray = value;
        await this.saveAccount(account, options ?? { storageLocation: StorageLocation.Memory });
    }

    async setEnableTray(value: boolean, options?: StorageOptions): Promise<void> {
        const account = await this.getAccount(options ?? { storageLocation: StorageLocation.Memory });
        account.enableTray = value;
        await this.saveAccount(account, options ?? { storageLocation: StorageLocation.Memory });
    }

    async setEncryptedOrganizationKeys(value: any, options?: StorageOptions): Promise<void> {
        const account = await this.getAccount(options ?? { storageLocation: StorageLocation.Disk });
        account.encryptedOrganizationKeys = value;
        await this.saveAccount(account, options ?? { storageLocation: StorageLocation.Disk });
    }

    async setDecryptedOrganizationKeys(value: Map<string, SymmetricCryptoKey>, options?: StorageOptions): Promise<void> {
        const account = await this.getAccount(options ?? { storageLocation: StorageLocation.Memory });
        account.decryptedOrganizationKeys = value;
        await this.saveAccount(account, options ?? { storageLocation: StorageLocation.Memory });
    }

    async setEncryptedPrivateKey(value: string, options?: StorageOptions): Promise<void> {
        const account = await this.getAccount(options ?? { storageLocation: StorageLocation.Disk });
        account.encryptedPrivateKey = value;
        await this.saveAccount(account, options ?? { storageLocation: StorageLocation.Disk });
    }

    async setDecryptedPrivateKey(value: ArrayBuffer, options?: StorageOptions): Promise<void> {
        const account = await this.getAccount(options ?? { storageLocation: StorageLocation.Memory });
        account.decryptedPrivateKey = value;
        await this.saveAccount(account, options ?? { storageLocation: StorageLocation.Memory });
    }

    async setEntityId(value: string, options?: StorageOptions): Promise<void> {
        const account = await this.getAccount(options ?? { storageLocation: StorageLocation.Memory });
        account.entityId = value;
        await this.saveAccount(account, options ?? { storageLocation: StorageLocation.Memory });
    }

    async setEntityType(value: string, options?: StorageOptions): Promise<void> {
        const account = await this.getAccount(options ?? { storageLocation: StorageLocation.Memory });
        account.entityType = value;
        await this.saveAccount(account, options ?? { storageLocation: StorageLocation.Memory });
    }

    async setEnvironmentUrls(value: any, options?: StorageOptions): Promise<void> {
        const account = await this.getAccount(options ?? { storageLocation: StorageLocation.Memory });
        account.environmentUrls = value;
        await this.saveAccount(account, options ?? { storageLocation: StorageLocation.Memory });
    }

    async setEquivalentDomains(value: any, options?: StorageOptions): Promise<void> {
        const account = await this.getAccount(options ?? { storageLocation: StorageLocation.Memory });
        account.equivalentDomains = value;
        await this.saveAccount(account, options ?? { storageLocation: StorageLocation.Memory });
    }

    async setEventCollection(value: EventData[], options?: StorageOptions): Promise<void> {
        const account = await this.getAccount(options ?? { storageLocation: StorageLocation.Memory });
        account.eventCollection = value;
        await this.saveAccount(account, options ?? { storageLocation: StorageLocation.Memory });
    }

    async setEncryptedFolders(value: { [id: string]: FolderData }, options?: StorageOptions): Promise<void> {
        const account = await this.getAccount(options ?? { storageLocation: StorageLocation.Disk });
        account.encryptedFolders = value;
        await this.saveAccount(account, options ?? { storageLocation: StorageLocation.Disk });
    }

    async setDecryptedFolders(value: FolderView[], options?: StorageOptions): Promise<void> {
        const account = await this.getAccount(options ?? { storageLocation: StorageLocation.Memory });
        account.decryptedFolders = value;
        await this.saveAccount(account, options ?? { storageLocation: StorageLocation.Memory });
    }

    async setForcePasswordReset(value: boolean, options?: StorageOptions): Promise<void> {
        const account = await this.getAccount(options ?? { storageLocation: StorageLocation.Memory });
        account.forcePasswordReset = value;
        await this.saveAccount(account, options ?? { storageLocation: StorageLocation.Memory });
    }

    async setInstalledVersion(value: string, options?: StorageOptions): Promise<void> {
        const globals = await this.getGlobals(options ?? { storageLocation: StorageLocation.Disk });
        globals.installedVersion = value;
        await this.saveGlobals(globals, options ?? { storageLocation: StorageLocation.Disk });
    }

    async setKdfIterations(value: number, options?: StorageOptions): Promise<void> {
        const account = await this.getAccount(options ?? { storageLocation: StorageLocation.Memory });
        account.kdfIterations = value;
        await this.saveAccount(account, options ?? { storageLocation: StorageLocation.Memory });
    }

    async setKdfType(value: KdfType, options?: StorageOptions): Promise<void> {
        const account = await this.getAccount(options ?? { storageLocation: StorageLocation.Memory });
        account.kdfType = value;
        await this.saveAccount(account, options ?? { storageLocation: StorageLocation.Memory });
    }

    async setKeyHash(value: string, options?: StorageOptions): Promise<void> {
        const account = await this.getAccount(options ?? { storageLocation: StorageLocation.Memory });
        account.keyHash = value;
        await this.saveAccount(account, options ?? { storageLocation: StorageLocation.Memory });
    }

    async setLastSync(value: string, options?: StorageOptions): Promise<void> {
        const account = await this.getAccount(options ?? { storageLocation: StorageLocation.Memory });
        account.lastSync = value;
        await this.saveAccount(account, options ?? { storageLocation: StorageLocation.Memory });
    }

    async setLastActive(value: number, options?: StorageOptions): Promise<void> {
        const account = await this.getAccount(options ?? { storageLocation: StorageLocation.Disk });
        if (account != null) {
            account.lastActive = value;
            await this.saveAccount(account, options ?? { storageLocation: StorageLocation.Disk });
        }

        const globals = await this.getGlobals(options ?? { storageLocation: StorageLocation.Disk });
        globals.lastActive = value;
        await this.saveGlobals(globals, options ?? { storageLocation: StorageLocation.Disk });
    }

    async setLegacyEtmKey(value: SymmetricCryptoKey, options?: StorageOptions): Promise<void> {
        const account = await this.getAccount(options ?? { storageLocation: StorageLocation.Memory });
        account.legacyEtmKey = value;
        await this.saveAccount(account, options ?? { storageLocation: StorageLocation.Memory });
    }

    async setLocalData(value: any, options?: StorageOptions): Promise<void> {
        const account = await this.getAccount(options ?? { storageLocation: StorageLocation.Memory });
        account.localData = value;
        await this.saveAccount(account, options ?? { storageLocation: StorageLocation.Memory });
    }

    async setLocale(value: string, options?: StorageOptions): Promise<void> {
        const account = await this.getAccount(options ?? { storageLocation: StorageLocation.Memory });
        account.locale = value;
        await this.saveAccount(account, options ?? { storageLocation: StorageLocation.Memory });
    }

    async setLoginRedirect(value: any, options?: StorageOptions): Promise<void> {
        const account = await this.getAccount(options ?? { storageLocation: StorageLocation.Memory });
        account.loginRedirect = value;
        await this.saveAccount(account, options ?? { storageLocation: StorageLocation.Memory });
    }

    async setMainWindowSize(value: number, options?: StorageOptions): Promise<void> {
        const account = await this.getAccount(options ?? { storageLocation: StorageLocation.Memory });
        account.mainWindowSize = value;
        await this.saveAccount(account, options ?? { storageLocation: StorageLocation.Memory });
    }

    async setMinimizeOnCopyToClipboard(value: boolean, options?: StorageOptions): Promise<void> {
        const account = await this.getAccount(options ?? { storageLocation: StorageLocation.Disk });
        account.minimizeOnCopyToClipboard = value;
        await this.saveAccount(account, options ?? { storageLocation: StorageLocation.Disk });
    }

    async setNeverDomains(value: string[], options?: StorageOptions): Promise<void> {
        const account = await this.getAccount(options ?? { storageLocation: StorageLocation.Memory });
        account.neverDomains = value;
        await this.saveAccount(account, options ?? { storageLocation: StorageLocation.Memory });
    }

    async setNoAutoPromptBiometrics(value: boolean, options?: StorageOptions): Promise<void> {
        const account = await this.getAccount(options ?? { storageLocation: StorageLocation.Disk });
        account.noAutoPromptBiometrics = value;
        await this.saveAccount(account, options ?? { storageLocation: StorageLocation.Disk });
    }

    async setNoAutoPromptBiometricsText(value: string, options?: StorageOptions): Promise<void> {
        const globals = await this.getGlobals(options ?? { storageLocation: StorageLocation.Disk });
        globals.noAutoPromptBiometricsText = value;
        await this.saveGlobals(globals, options ?? { storageLocation: StorageLocation.Disk });
    }

    async setOpenAtLogin(value: boolean, options?: StorageOptions): Promise<void> {
        const globals = await this.getGlobals(options ?? { storageLocation: StorageLocation.Disk });
        globals.openAtLogin = value;
        await this.saveGlobals(globals, options ?? { storageLocation: StorageLocation.Disk });
    }

    async setOrganizations(value: { [id: string]: OrganizationData }, options?: StorageOptions): Promise<void> {
        const account = await this.getAccount(options ?? { storageLocation: StorageLocation.Memory });
        account.organizations = value;
        await this.saveAccount(account, options ?? { storageLocation: StorageLocation.Memory });
    }

    async setEncryptedPasswordGenerationHistory(value: GeneratedPasswordHistory[], options?: StorageOptions): Promise<void> {
        const account = await this.getAccount(options ?? { storageLocation: StorageLocation.Disk });
        account.encryptedPasswordGenerationHistory = value;
        await this.saveAccount(account, options ?? { storageLocation: StorageLocation.Disk });
    }

    async setDecryptedPasswordGenerationHistory(value: GeneratedPasswordHistory[], options?: StorageOptions): Promise<void> {
        const account = await this.getAccount(options ?? { storageLocation: StorageLocation.Memory });
        account.decryptedPasswordGenerationHistory = value;
        await this.saveAccount(account, options ?? { storageLocation: StorageLocation.Memory });
    }

    async setPasswordGenerationOptions(value: any, options?: StorageOptions): Promise<void> {
        const account = await this.getAccount(options ?? { storageLocation: StorageLocation.Memory });
        account.passwordGenerationOptions = value;
        await this.saveAccount(account, options ?? { storageLocation: StorageLocation.Memory });
    }

    async setEncryptedPinProtected(value: string, options?: StorageOptions): Promise<void> {
        const account = await this.getAccount(options ?? { storageLocation: StorageLocation.Disk });
        account.encryptedPinProtected = value;
        await this.saveAccount(account, options ?? { storageLocation: StorageLocation.Disk });
    }

    async setDecryptedPinProtected(value: EncString, options?: StorageOptions): Promise<void> {
        const account = await this.getAccount(options ?? { storageLocation: StorageLocation.Memory });
        account.decryptedPinProtected = value;
        await this.saveAccount(account, options ?? { storageLocation: StorageLocation.Memory });
    }

    async setEncryptedPolicies(value: { [id: string]: PolicyData }, options?: StorageOptions): Promise<void> {
        const account = await this.getAccount(options ?? { storageLocation: StorageLocation.Disk });
        account.encryptedPolicies = value;
        await this.saveAccount(account, options ?? { storageLocation: StorageLocation.Disk });
    }

    async setDecryptedPolicies(value: Policy[], options?: StorageOptions): Promise<void> {
        const account = await this.getAccount(options ?? { storageLocation: StorageLocation.Memory });
        account.decryptedPolicies = value;
        await this.saveAccount(account, options ?? { storageLocation: StorageLocation.Memory });
    }

    async setProtectedPin(value: string, options?: StorageOptions): Promise<void> {
        const account = await this.getAccount(options ?? { storageLocation: StorageLocation.Disk });
        account.protectedPin = value;
        await this.saveAccount(account, options ?? { storageLocation: StorageLocation.Disk });
    }

    async setProviders(value: { [id: string]: ProviderData }, options?: StorageOptions): Promise<void> {
        const account = await this.getAccount(options ?? { storageLocation: StorageLocation.Memory });
        account.providers = value;
        await this.saveAccount(account, options ?? { storageLocation: StorageLocation.Memory });
    }

    async setEncryptedProviderKeys(value: { [id: string]: ProviderData }, options?: StorageOptions): Promise<void> {
        const account = await this.getAccount(options ?? { storageLocation: StorageLocation.Disk });
        account.encryptedProviderKeys = value;
        await this.saveAccount(account, options ?? { storageLocation: StorageLocation.Disk });
    }

    async setDecryptedProviderKeys(value: Map<string, SymmetricCryptoKey>, options?: StorageOptions): Promise<void> {
        const account = (await this.getAccount(options ?? { storageLocation: StorageLocation.Memory }));
        account.decryptedProviderKeys = value;
        await this.saveAccount(account, options ?? { storageLocation: StorageLocation.Memory });
    }

    async setPublicKey(value: ArrayBuffer, options?: StorageOptions): Promise<void> {
        const account = await this.getAccount(options ?? { storageLocation: StorageLocation.Memory });
        account.publicKey = value;
        await this.saveAccount(account, options ?? { storageLocation: StorageLocation.Memory });
    }

    async setRefreshToken(value: string, options?: StorageOptions): Promise<void> {
        const account = await this.getAccount(options ?? { storageLocation: StorageLocation.Memory });
        account.refreshToken = value;
        await this.saveAccount(account, options ?? { storageLocation: StorageLocation.Memory });
    }

    async setSecurityStamp(value: string, options?: StorageOptions): Promise<void> {
        const account = await this.getAccount(options ?? { storageLocation: StorageLocation.Memory });
        account.securityStamp = value;
        await this.saveAccount(account, options ?? { storageLocation: StorageLocation.Memory });
    }

    async setEncryptedSends(value: { [id: string]: SendData }, options?: StorageOptions): Promise<void> {
        const account = await this.getAccount(options ?? { storageLocation: StorageLocation.Disk });
        account.encryptedSends = value;
        await this.saveAccount(account, options ?? { storageLocation: StorageLocation.Disk });
    }

    async setDecryptedSends(value: SendView[], options?: StorageOptions): Promise<void> {
        const account = await this.getAccount(options ?? { storageLocation: StorageLocation.Memory });
        account.decryptedSends = value;
        await this.saveAccount(account, options ?? { storageLocation: StorageLocation.Memory });
    }

    async setSettings(value: any, options?: StorageOptions): Promise<void> {
        const account = await this.getAccount(options ?? { storageLocation: StorageLocation.Disk });
        account.settings = value;
        await this.saveAccount(account, options ?? { storageLocation: StorageLocation.Disk });
    }

    async setSsoCodeVerifier(value: string, options?: StorageOptions): Promise<void> {
        const account = await this.getAccount(options ?? { storageLocation: StorageLocation.Memory });
        account.ssoCodeVerifier = value;
        await this.saveAccount(account, options ?? { storageLocation: StorageLocation.Memory });
    }

    async setSsoOrganizationIdentifier(value: string, options?: StorageOptions): Promise<void> {
        const account = await this.getAccount(options ?? { storageLocation: StorageLocation.Memory });
        account.ssoOrganizationIdentifier = value;
        await this.saveAccount(account, options ?? { storageLocation: StorageLocation.Memory });
    }

    async setSsoState(value: string, options?: StorageOptions): Promise<void> {
        const account = await this.getAccount(options ?? { storageLocation: StorageLocation.Memory });
        account.ssoState = value;
        await this.saveAccount(account, options ?? { storageLocation: StorageLocation.Memory });
    }

    async setTheme(value: string, options?: StorageOptions): Promise<void> {
        const account = await this.getAccount(options ?? { storageLocation: StorageLocation.Disk });
        if (account != null) {
            account.theme = value;
            await this.saveAccount(account, options ?? { storageLocation: StorageLocation.Disk });
        }

        const globals = await this.getGlobals(options ?? { storageLocation: StorageLocation.Disk });
        globals.theme = value;
        await this.saveGlobals(globals, options ?? { storageLocation: StorageLocation.Disk });
    }

    async setTwoFactorToken(value: string, options?: StorageOptions): Promise<void> {
        const globals = await this.getGlobals(options ?? { storageLocation: StorageLocation.Memory });
        globals.twoFactorToken = value;
        await this.saveGlobals(globals, options ?? { storageLocation: StorageLocation.Memory });
    }

    async setVaultTimeout(value: number, options?: StorageOptions): Promise<void> {
        const account = await this.getAccount(options ?? { storageLocation: StorageLocation.Disk });
        account.vaultTimeout = value;
        await this.saveAccount(account, options ?? { storageLocation: StorageLocation.Disk });
    }

    async setVaultTimeoutAction(value: string, options?: StorageOptions): Promise<void> {
        const account = await this.getAccount(options ?? { storageLocation: StorageLocation.Disk });
        account.vaultTimeoutAction = value;
        await this.saveAccount(account, options ?? { storageLocation: StorageLocation.Disk });
    }

    async setEverBeenUnlocked(value: boolean, options?: StorageOptions): Promise<void> {
        const account = await this.getAccount(options ?? { storageLocation: StorageLocation.Disk});
        account.everBeenUnlocked = value;
        await this.saveAccount(account, options ?? { storageLocation: StorageLocation.Disk });
    }

    async setBiometricLocked(value: boolean, options?: StorageOptions): Promise<void> {
        const account = await this.getAccount(options ?? { storageLocation: StorageLocation.Memory});
        account.biometricLocked = value;
        await this.saveAccount(account, options ?? { storageLocation: StorageLocation.Memory });
    }

    async setEnableGravitars(value: boolean, options?: StorageOptions): Promise<void> {
        const account = await this.getAccount(options ?? { storageLocation: StorageLocation.Memory});
        account.enableGravitars = value;
        await this.saveAccount(account, options ?? { storageLocation: StorageLocation.Memory });
    }

    async setAddEditCipherInfo(value: any, options?: StorageOptions): Promise<void> {
        const account = await this.getAccount(options ?? { storageLocation: StorageLocation.Memory});
        account.addEditCipherInfo = value;
        await this.saveAccount(account, options ?? { storageLocation: StorageLocation.Memory });
    }

    async setRememberedEmail(value: string, options?: StorageOptions): Promise<void> {
        const globals = await this.getGlobals(options ?? { storageLocation: StorageLocation.Disk});
        globals.rememberedEmail = value;
        await this.saveGlobals(globals, options ?? { storageLocation: StorageLocation.Disk });
    }

    async setOrganizationInvitation(value: any, options?: StorageOptions): Promise<void> {
        const globals = await this.getGlobals(options ?? { storageLocation: StorageLocation.Memory});
        globals.organizationInvitation = value;
        await this.saveGlobals(globals, options ?? { storageLocation: StorageLocation.Memory });
    }

    async setActiveUser(userId: string): Promise<void> {
        if (!this.state.accounts[userId]) {
            return;
        }
        this.state.activeUserId = userId;
        await this.pushAccounts();
    }

    async setWindow(value: Map<string, any>): Promise<void> {
        const globals = await this.getGlobals({ storageLocation: StorageLocation.Disk });
        globals.window = value;
        return await this.saveGlobals(globals, { storageLocation: StorageLocation.Disk });
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
            await this.secureStorageService.save('globals', globals);
        } else {
            await this.storageService.save('globals', globals);
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
        return this.state.accounts[options.userId ?? this.state.activeUserId]?.userId;
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
            await this.secureStorageService.save(account.userId, account);
        } else {
            await this.storageService.save(account.userId, account);
        }
    }

    private async saveAccountToMemory(account: Account): Promise<void> {
        if (this.getAccountFromMemory({userId: account.userId}) !== null) {
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
            if (this.state.accounts[i].userId === this.state.activeUserId ) {
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
}

class RequiredSuffixError extends Error {
    constructor(public message: string = 'The suffix option is required to get/set this key.') {
        super(message);
    }
}
