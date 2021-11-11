import { StateService as StateServiceAbstraction } from '../abstractions/state.service';

import { Account } from '../models/domain/account';

import { LogService } from '../abstractions/log.service';
import { StorageService } from '../abstractions/storage.service';

import { AuthenticationStatus } from '../enums/authenticationStatus';
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
import { GlobalState } from '../models/domain/globalState';
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
        return { storageLocation: StorageLocation.Disk, htmlStorageLocation: HtmlStorageLocation.Session, userId: this.state.activeUserId, useSecureStorage: false };
    }

    private get defaultOnDiskLocalOptions(): StorageOptions {
        return { storageLocation: StorageLocation.Disk, htmlStorageLocation: HtmlStorageLocation.Local, userId: this.state.activeUserId, useSecureStorage: false };
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

    async init(): Promise<void> {
        if (this.state.activeUserId == null) {
            await this.loadStateFromDisk();
        }
    }

    async loadStateFromDisk() {
        const diskState = await this.storageService.get<State>('state', this.defaultOnDiskLocalOptions);
        this.state = diskState;
    }

    async addAccount(account: Account) {
        this.state.accounts[account.userId] = account;
        await this.scaffoldNewAccountStorage(account);
        await this.setActiveUser(account.userId);
    }

    async setActiveUser(userId: string): Promise<void> {
        this.state.activeUserId = userId;
        const storedState = await this.storageService.get<State>('state', this.defaultOnDiskLocalOptions);
        storedState.activeUserId = userId;
        await this.storageService.save('state', storedState, this.defaultOnDiskLocalOptions);
        await this.pushAccounts();
    }

    async clean(options?: StorageOptions): Promise<void> {
        await this.secureStorageService.remove(options?.userId ?? this.state.activeUserId);
        await this.storageService.remove(options?.userId ?? this.state.activeUserId);
        delete this.state.accounts[options?.userId ?? this.state.activeUserId];
        await this.pushAccounts();
    }

    async getAccessToken(options?: StorageOptions): Promise<string> {
        return (await this.getAccount(this.reconcileOptions(options, this.defaultOnDiskLocalOptions)))?.accessToken;
    }

    async setAccessToken(value: string, options?: StorageOptions): Promise<void> {
        const account = await this.getAccount(this.reconcileOptions(options, this.defaultOnDiskLocalOptions));
        account.accessToken = value;
        await this.saveAccount(account, this.reconcileOptions(options, this.defaultOnDiskLocalOptions));
    }

    async getAddEditCipherInfo(options?: StorageOptions): Promise<any> {
        return (await this.getAccount(this.reconcileOptions(options, this.defaultInMemoryOptions))).addEditCipherInfo;
    }

    async setAddEditCipherInfo(value: any, options?: StorageOptions): Promise<void> {
        const account = await this.getAccount(this.reconcileOptions(options, this.defaultInMemoryOptions));
        account.addEditCipherInfo = value;
        await this.saveAccount(account, this.reconcileOptions(options, this.defaultInMemoryOptions));
    }

    async getAlwaysShowDock(options?: StorageOptions): Promise<boolean> {
        return (await this.getAccount(this.reconcileOptions(options, this.defaultOnDiskOptions)))?.alwaysShowDock ?? false;
    }

    async setAlwaysShowDock(value: boolean, options?: StorageOptions): Promise<void> {
        const account = await this.getAccount(this.reconcileOptions(options, this.defaultOnDiskOptions));
        account.alwaysShowDock = value;
        await this.saveAccount(account, this.reconcileOptions(options, this.defaultOnDiskOptions));
    }

    async getApiKeyClientId(options?: StorageOptions): Promise<string> {
        return (await this.getAccount(this.reconcileOptions(options, this.defaultInMemoryOptions)))?.apiKeyClientId;
    }

    async setApiKeyClientId(value: string, options?: StorageOptions): Promise<void> {
        const account = await this.getAccount(this.reconcileOptions(options, this.defaultInMemoryOptions));
        account.apiKeyClientId = value;
        await this.saveAccount(account, this.reconcileOptions(options, this.defaultInMemoryOptions));
    }

    async getApiKeyClientSecret(options?: StorageOptions): Promise<string> {
        return (await this.getAccount(this.reconcileOptions(options, this.defaultInMemoryOptions)))?.apiKeyClientSecret;
    }

    async setApiKeyClientSecret(value: string, options?: StorageOptions): Promise<void> {
        const account = await this.getAccount(this.reconcileOptions(options, this.defaultInMemoryOptions));
        account.apiKeyClientId = value;
        await this.saveAccount(account, this.reconcileOptions(options, this.defaultInMemoryOptions));
    }

    async getAutoConfirmFingerPrints(options?: StorageOptions): Promise<boolean> {
        return (await this.getAccount(this.reconcileOptions(options, this.defaultOnDiskOptions))).autoConfirmFingerPrints ?? true;
    }

    async setAutoConfirmFingerprints(value: boolean, options?: StorageOptions): Promise<void> {
        const account = await this.getAccount(this.reconcileOptions(options, this.defaultOnDiskOptions));
        account.autoConfirmFingerPrints = value;
        await this.saveAccount(account, this.reconcileOptions(options, this.defaultOnDiskOptions));
    }

    async getAutoFillOnPageLoadDefault(options?: StorageOptions): Promise<boolean> {
        return (await this.getAccount(this.reconcileOptions(options, this.defaultInMemoryOptions)))?.autoFillOnPageLoadDefault ?? false;
    }

    async setAutoFillOnPageLoadDefault(value: boolean, options?: StorageOptions): Promise<void> {
        const account = await this.getAccount(this.reconcileOptions(options, this.defaultInMemoryOptions));
        account.autoFillOnPageLoadDefault = value;
        await this.saveAccount(account, this.reconcileOptions(options, this.defaultInMemoryOptions));
    }

    async getBiometricAwaitingAcceptance(options?: StorageOptions): Promise<boolean> {
        return (await this.getGlobals(this.reconcileOptions(options, this.defaultInMemoryOptions)))?.biometricAwaitingAcceptance ?? false;
    }

    async setBiometricAwaitingAcceptance(value: boolean, options?: StorageOptions): Promise<void> {
        const globals = await this.getGlobals(this.reconcileOptions(options, this.defaultInMemoryOptions));
        globals.biometricAwaitingAcceptance = value;
        await this.saveGlobals(globals, this.reconcileOptions(options, this.defaultInMemoryOptions));
    }

    async getBiometricFingerprintValidated(options?: StorageOptions): Promise<boolean> {
        return (await this.getGlobals(this.reconcileOptions(options, this.defaultInMemoryOptions)))?.biometricFingerprintValidated ?? false;
    }

    async setBiometricFingerprintValidated(value: boolean, options?: StorageOptions): Promise<void> {
        const globals = await this.getGlobals(this.reconcileOptions(options, this.defaultInMemoryOptions));
        globals.biometricFingerprintValidated = value;
        await this.saveGlobals(globals, this.reconcileOptions(options, this.defaultInMemoryOptions));
    }

    async getBiometricLocked(options?: StorageOptions): Promise<boolean> {
        return (await this.getAccount(this.reconcileOptions(options, this.defaultInMemoryOptions))).biometricLocked ?? false;
    }

    async setBiometricLocked(value: boolean, options?: StorageOptions): Promise<void> {
        const account = await this.getAccount(this.reconcileOptions(options, this.defaultInMemoryOptions));
        account.biometricLocked = value;
        await this.saveAccount(account, this.reconcileOptions(options, this.defaultInMemoryOptions));
    }

    async getBiometricText(options?: StorageOptions): Promise<string> {
        return (await this.getAccount(this.reconcileOptions(options, this.defaultOnDiskOptions)))?.biometricText;
    }

    async setBiometricText(value: string, options?: StorageOptions): Promise<void> {
        const account = await this.getAccount(this.reconcileOptions(options, this.defaultOnDiskOptions));
        account.biometricText = value;
        await this.saveAccount(account, this.reconcileOptions(options, this.defaultOnDiskOptions));
    }

    async getBiometricUnlock(options?: StorageOptions): Promise<boolean> {
        return (await this.getAccount(this.reconcileOptions(options, this.defaultInMemoryOptions)))?.biometricUnlock ?? false;
    }

    async setBiometricUnlock(value: boolean, options?: StorageOptions): Promise<void> {
        const account = await this.getAccount(this.reconcileOptions(options, this.defaultInMemoryOptions));
        account.biometricUnlock = value;
        await this.saveAccount(account, this.reconcileOptions(options, this.defaultInMemoryOptions));
    }

    async getCanAccessPremium(options?: StorageOptions): Promise<boolean> {
        if (!await this.getIsAuthenticated(options)) {
            return false;
        }

        const account = await this.getAccount(this.reconcileOptions(options, this.defaultOnDiskLocalOptions));
        if (account.hasPremiumPersonally) {
            return true;
        }

        const organizations = await this.getOrganizations(options);
        if (organizations == null) {
            return false;
        }

        for (const id  of Object.keys(organizations)) {
            const o = organizations[id];
            if (o.enabled && o.usersGetPremium && !o.isProviderUser) {
                return true;
            }
        }

        return false;
    }

    async getClearClipboard(options?: StorageOptions): Promise<number> {
        return (await this.getAccount(this.reconcileOptions(options, this.defaultInMemoryOptions)))?.clearClipboard;
    }

    async setClearClipboard(value: number, options?: StorageOptions): Promise<void> {
        const account = await this.getAccount(this.reconcileOptions(options, this.defaultInMemoryOptions));
        account.clearClipboard = value;
        await this.saveAccount(account, this.reconcileOptions(options, this.defaultInMemoryOptions));
    }

    async getCollapsedGroupings(options?: StorageOptions): Promise<Set<string>> {
        return (await this.getAccount(this.reconcileOptions(options, this.defaultInMemoryOptions)))?.collapsedGroupings;
    }

    async setCollapsedGroupings(value: Set<string>, options?: StorageOptions): Promise<void> {
        const account = await this.getAccount(this.reconcileOptions(options, this.defaultInMemoryOptions));
        account.collapsedGroupings = value;
        await this.saveAccount(account, this.reconcileOptions(options, this.defaultInMemoryOptions));
    }

    async getConvertAccountToKeyConnector(options?: StorageOptions): Promise<boolean> {
        return (await this.getAccount(this.reconcileOptions(options, this.defaultOnDiskOptions)))?.convertAccountToKeyConnector;
    }

    async setConvertAccountToKeyConnector(value: boolean, options?: StorageOptions): Promise<void> {
        const account = await this.getAccount(this.reconcileOptions(options, this.defaultOnDiskOptions));
        account.convertAccountToKeyConnector = value;
        await this.saveAccount(account, this.reconcileOptions(options, this.defaultOnDiskOptions));
    }

    async getCryptoMasterKey(options?: StorageOptions): Promise<SymmetricCryptoKey> {
        return (await this.getAccount(this.reconcileOptions(options, this.defaultInMemoryOptions)))?.cryptoMasterKey;
    }

    async setCryptoMasterKey(value: SymmetricCryptoKey, options?: StorageOptions): Promise<void> {
        const account = await this.getAccount(this.reconcileOptions(options, this.defaultInMemoryOptions));
        account.cryptoMasterKey = value;
        await this.saveAccount(account, this.reconcileOptions(options, this.defaultInMemoryOptions));
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

    async getDecodedToken(options?: StorageOptions): Promise<any> {
        return (await this.getAccount(this.reconcileOptions(options, this.defaultInMemoryOptions)))?.decodedToken;
    }

    async setDecodedToken(value: any, options?: StorageOptions): Promise<void> {
        const account = await this.getAccount(this.reconcileOptions(options, this.defaultInMemoryOptions));
        account.decodedToken = value;
        await this.saveAccount(account, this.reconcileOptions(options, this.defaultInMemoryOptions));
    }

    async getDecryptedCiphers(options?: StorageOptions): Promise<CipherView[]> {
        return (await this.getAccount(this.reconcileOptions(options, this.defaultInMemoryOptions)))?.decryptedCiphers;
    }

    async setDecryptedCiphers(value: CipherView[], options?: StorageOptions): Promise<void> {
        const account = await this.getAccount(this.reconcileOptions(options, this.defaultInMemoryOptions));
        account.decryptedCiphers = value;
        await this.saveAccount(account, this.reconcileOptions(options, this.defaultInMemoryOptions));
    }

    async getDecryptedCollections(options?: StorageOptions): Promise<CollectionView[]> {
        return (await this.getAccount(this.reconcileOptions(options, this.defaultInMemoryOptions)))?.decryptedCollections;
    }

    async setDecryptedCollections(value: CollectionView[], options?: StorageOptions): Promise<void> {
        const account = await this.getAccount(this.reconcileOptions(options, this.defaultInMemoryOptions));
        account.decryptedCollections = value;
        await this.saveAccount(account, this.reconcileOptions(options, this.defaultInMemoryOptions));
    }

    async getDecryptedCryptoSymmetricKey(options?: StorageOptions): Promise<SymmetricCryptoKey> {
        return (await this.getAccount(this.reconcileOptions(options, this.defaultInMemoryOptions)))?.decryptedCryptoSymmetricKey;
    }

    async setDecryptedCryptoSymmetricKey(value: SymmetricCryptoKey, options?: StorageOptions): Promise<void> {
        const account = await this.getAccount(this.reconcileOptions(options, this.defaultInMemoryOptions));
        account.decryptedCryptoSymmetricKey = value;
        await this.saveAccount(account, this.reconcileOptions(options, this.defaultInMemoryOptions));
    }

    async getDecryptedFolders(options?: StorageOptions): Promise<FolderView[]> {
        return (await this.getAccount(this.reconcileOptions(options, this.defaultInMemoryOptions)))?.decryptedFolders;
    }

    async setDecryptedFolders(value: FolderView[], options?: StorageOptions): Promise<void> {
        const account = await this.getAccount(this.reconcileOptions(options, this.defaultInMemoryOptions));
        account.decryptedFolders = value;
        await this.saveAccount(account, this.reconcileOptions(options, this.defaultInMemoryOptions));
    }

    async getDecryptedOrganizationKeys(options?: StorageOptions): Promise<Map<string, SymmetricCryptoKey>> {
        return (await this.getAccount(this.reconcileOptions(options, this.defaultInMemoryOptions)))?.decryptedOrganizationKeys;
    }

    async setDecryptedOrganizationKeys(value: Map<string, SymmetricCryptoKey>, options?: StorageOptions): Promise<void> {
        const account = await this.getAccount(this.reconcileOptions(options, this.defaultInMemoryOptions));
        account.decryptedOrganizationKeys = value;
        await this.saveAccount(account, this.reconcileOptions(options, this.defaultInMemoryOptions));
    }

    async getDecryptedPasswordGenerationHistory(options?: StorageOptions): Promise<GeneratedPasswordHistory[]> {
        return (await this.getAccount(this.reconcileOptions(options, this.defaultInMemoryOptions)))?.decryptedPasswordGenerationHistory;
    }

    async setDecryptedPasswordGenerationHistory(value: GeneratedPasswordHistory[], options?: StorageOptions): Promise<void> {
        const account = await this.getAccount(this.reconcileOptions(options, this.defaultInMemoryOptions));
        account.decryptedPasswordGenerationHistory = value;
        await this.saveAccount(account, this.reconcileOptions(options, this.defaultInMemoryOptions));
    }

    async getDecryptedPinProtected(options?: StorageOptions): Promise<EncString> {
        return (await this.getAccount(this.reconcileOptions(options, this.defaultInMemoryOptions)))?.decryptedPinProtected;
    }

    async setDecryptedPinProtected(value: EncString, options?: StorageOptions): Promise<void> {
        const account = await this.getAccount(this.reconcileOptions(options, this.defaultInMemoryOptions));
        account.decryptedPinProtected = value;
        await this.saveAccount(account, this.reconcileOptions(options, this.defaultInMemoryOptions));
    }

    async getDecryptedPolicies(options?: StorageOptions): Promise<Policy[]> {
        return (await this.getAccount(this.reconcileOptions(options, this.defaultInMemoryOptions)))?.decryptedPolicies;
    }

    async setDecryptedPolicies(value: Policy[], options?: StorageOptions): Promise<void> {
        const account = await this.getAccount(this.reconcileOptions(options, this.defaultInMemoryOptions));
        account.decryptedPolicies = value;
        await this.saveAccount(account, this.reconcileOptions(options, this.defaultInMemoryOptions));
    }

    async getDecryptedPrivateKey(options?: StorageOptions): Promise<ArrayBuffer> {
        return (await this.getAccount(this.reconcileOptions(options, this.defaultInMemoryOptions)))?.decryptedPrivateKey;
    }

    async setDecryptedPrivateKey(value: ArrayBuffer, options?: StorageOptions): Promise<void> {
        const account = await this.getAccount(this.reconcileOptions(options, this.defaultInMemoryOptions));
        account.decryptedPrivateKey = value;
        await this.saveAccount(account, this.reconcileOptions(options, this.defaultInMemoryOptions));
    }

    async getDecryptedProviderKeys(options?: StorageOptions): Promise<Map<string, SymmetricCryptoKey>> {
        return (await this.getAccount(this.reconcileOptions(options, this.defaultInMemoryOptions)))?.decryptedProviderKeys;
    }

    async setDecryptedProviderKeys(value: Map<string, SymmetricCryptoKey>, options?: StorageOptions): Promise<void> {
        const account = (await this.getAccount(this.reconcileOptions(options, this.defaultInMemoryOptions)));
        account.decryptedProviderKeys = value;
        await this.saveAccount(account, this.reconcileOptions(options, this.defaultInMemoryOptions));
    }

    async getDecryptedSends(options?: StorageOptions): Promise<SendView[]> {
        return (await this.getAccount(this.reconcileOptions(options, this.defaultInMemoryOptions)))?.decryptedSends;
    }

    async setDecryptedSends(value: SendView[], options?: StorageOptions): Promise<void> {
        const account = await this.getAccount(this.reconcileOptions(options, this.defaultInMemoryOptions));
        account.decryptedSends = value;
        await this.saveAccount(account, this.reconcileOptions(options, this.defaultInMemoryOptions));
    }

    async getDefaultUriMatch(options?: StorageOptions): Promise<UriMatchType> {
        return (await this.getAccount(this.reconcileOptions(options, this.defaultInMemoryOptions)))?.defaultUriMatch;
    }

    async setDefaultUriMatch(value: UriMatchType, options?: StorageOptions): Promise<void> {
        const account = await this.getAccount(this.reconcileOptions(options, this.defaultInMemoryOptions));
        account.defaultUriMatch = value;
        await this.saveAccount(account, this.reconcileOptions(options, this.defaultInMemoryOptions));
    }

    async getDisableAddLoginNotification(options?: StorageOptions): Promise<boolean> {
        return (await this.getAccount(this.reconcileOptions(options, this.defaultInMemoryOptions)))?.disableAddLoginNotification ?? false;
    }

    async setDisableAddLoginNotification(value: boolean, options?: StorageOptions): Promise<void> {
        const account = await this.getAccount(this.reconcileOptions(options, this.defaultInMemoryOptions));
        account.disableAddLoginNotification = value;
        await this.saveAccount(account, this.reconcileOptions(options, this.defaultInMemoryOptions));
    }

    async getDisableAutoBiometricsPrompt(options?: StorageOptions): Promise<boolean> {
        return (await this.getAccount(this.reconcileOptions(options, this.defaultInMemoryOptions)))?.disableAutoBiometricsPrompt ?? false;
    }

    async setDisableAutoBiometricsPrompt(value: boolean, options?: StorageOptions): Promise<void> {
        const account = await this.getAccount(this.reconcileOptions(options, this.defaultInMemoryOptions));
        account.disableAutoBiometricsPrompt = value;
        await this.saveAccount(account, this.reconcileOptions(options, this.defaultInMemoryOptions));
    }

    async getDisableAutoTotpCopy(options?: StorageOptions): Promise<boolean> {
        return (await this.getAccount(this.reconcileOptions(options, this.defaultInMemoryOptions)))?.disableAutoTotpCopy ?? false;
    }

    async setDisableAutoTotpCopy(value: boolean, options?: StorageOptions): Promise<void> {
        const account = await this.getAccount(this.reconcileOptions(options, this.defaultInMemoryOptions));
        account.disableAutoTotpCopy = value;
        await this.saveAccount(account, this.reconcileOptions(options, this.defaultInMemoryOptions));
    }

    async getDisableBadgeCounter(options?: StorageOptions): Promise<boolean> {
        return (await this.getAccount(this.reconcileOptions(options, this.defaultInMemoryOptions)))?.disableBadgeCounter ?? false;
    }

    async setDisableBadgeCounter(value: boolean, options?: StorageOptions): Promise<void> {
        const account = await this.getAccount(this.reconcileOptions(options, this.defaultInMemoryOptions));
        account.disableBadgeCounter = value;
        await this.saveAccount(account, this.reconcileOptions(options, this.defaultInMemoryOptions));
    }

    async getDisableChangedPasswordNotification(options?: StorageOptions): Promise<boolean> {
        return (await this.getAccount(this.reconcileOptions(options, this.defaultInMemoryOptions)))?.disableChangedPasswordNotification ?? false;
    }

    async setDisableChangedPasswordNotification(value: boolean, options?: StorageOptions): Promise<void> {
        const account = await this.getAccount(this.reconcileOptions(options, this.defaultInMemoryOptions));
        account.disableChangedPasswordNotification = value;
        await this.saveAccount(account, this.reconcileOptions(options, this.defaultInMemoryOptions));
    }

    async getDisableContextMenuItem(options?: StorageOptions): Promise<boolean> {
        return (await this.getAccount(this.reconcileOptions(options, this.defaultInMemoryOptions)))?.disableContextMenuItem ?? false;
    }

    async setDisableContextMenuItem(value: boolean, options?: StorageOptions): Promise<void> {
        const account = await this.getAccount(this.reconcileOptions(options, this.defaultInMemoryOptions));
        account.disableContextMenuItem = value;
        await this.saveAccount(account, this.reconcileOptions(options, this.defaultInMemoryOptions));
    }

    async getDisableFavicon(options?: StorageOptions): Promise<boolean> {
        return (await this.getGlobals(this.reconcileOptions(options, this.defaultOnDiskLocalOptions)))?.disableFavicon ?? false;
    }

    async setDisableFavicon(value: boolean, options?: StorageOptions): Promise<void> {
        const globals = await this.getGlobals(this.reconcileOptions(options, this.defaultOnDiskLocalOptions));
        globals.disableFavicon = value;
        await this.saveGlobals(globals, this.reconcileOptions(options, this.defaultOnDiskLocalOptions));
    }

    async getDisableGa(options?: StorageOptions): Promise<boolean> {
        return (await this.getAccount(this.reconcileOptions(options, this.defaultInMemoryOptions)))?.disableGa ?? false;
    }

    async setDisableGa(value: boolean, options?: StorageOptions): Promise<void> {
        const account = await this.getAccount(this.reconcileOptions(options, this.defaultInMemoryOptions));
        account.disableGa = value;
        await this.saveAccount(account, this.reconcileOptions(options, this.defaultInMemoryOptions));
    }

    async getDontShowCardsCurrentTab(options?: StorageOptions): Promise<boolean> {
        return (await this.getAccount(this.reconcileOptions(options, this.defaultInMemoryOptions)))?.dontShowCardsCurrentTab ?? false;
    }

    async setDontShowCardsCurrentTab(value: boolean, options?: StorageOptions): Promise<void> {
        const account = await this.getAccount(this.reconcileOptions(options, this.defaultInMemoryOptions));
        account.dontShowCardsCurrentTab = value;
        await this.saveAccount(account, this.reconcileOptions(options, this.defaultInMemoryOptions));
    }

    async getDontShowIdentitiesCurrentTab(options?: StorageOptions): Promise<boolean> {
        return (await this.getAccount(this.reconcileOptions(options, this.defaultInMemoryOptions)))?.dontShowIdentitiesCurrentTab ?? false;
    }

    async setDontShowIdentitiesCurrentTab(value: boolean, options?: StorageOptions): Promise<void> {
        const account = await this.getAccount(this.reconcileOptions(options, this.defaultInMemoryOptions));
        account.dontShowIdentitiesCurrentTab = value;
        await this.saveAccount(account, this.reconcileOptions(options, this.defaultInMemoryOptions));
    }

    async getEmail(options?: StorageOptions): Promise<string> {
        return (await this.getAccount(this.reconcileOptions(options, this.defaultInMemoryOptions)))?.email;
    }
    async setEmail(value: string, options?: StorageOptions): Promise<void> {
        const account = await this.getAccount(this.reconcileOptions(options, this.defaultInMemoryOptions));
        account.email = value;
        await this.saveAccount(account, this.reconcileOptions(options, this.defaultInMemoryOptions));
    }

    async getEmailVerified(options?: StorageOptions): Promise<boolean> {
        return (await this.getAccount(this.reconcileOptions(options, this.defaultInMemoryOptions)))?.emailVerified ?? false;
    }
    async setEmailVerified(value: boolean, options?: StorageOptions): Promise<void> {
        const account = await this.getAccount(this.reconcileOptions(options, this.defaultInMemoryOptions));
        account.emailVerified = value;
        await this.saveAccount(account, this.reconcileOptions(options, this.defaultInMemoryOptions));
    }

    async getEnableAlwaysOnTop(options?: StorageOptions): Promise<boolean> {
        const accountPreference = (await this.getAccount(this.reconcileOptions(options, this.defaultOnDiskOptions)))?.enableAlwaysOnTop;
        const globalPreference = (await this.getGlobals(this.reconcileOptions(options, this.defaultOnDiskOptions)))?.enableAlwaysOnTop;
        return accountPreference ?? globalPreference ?? false;
    }
    async setEnableAlwaysOnTop(value: boolean, options?: StorageOptions): Promise<void> {
        const account = await this.getAccount(this.reconcileOptions(options, this.defaultOnDiskOptions));
        account.enableAlwaysOnTop = value;
        await this.saveAccount(account, this.reconcileOptions(options, this.defaultOnDiskOptions));

        const globals = await this.getGlobals(this.reconcileOptions(options, this.defaultOnDiskOptions));
        globals.enableAlwaysOnTop = value;
        await this.saveGlobals(globals, this.reconcileOptions(options, this.defaultOnDiskOptions));
    }

    async getEnableAutoFillOnPageLoad(options?: StorageOptions): Promise<boolean> {
        return (await this.getAccount(this.reconcileOptions(options, this.defaultInMemoryOptions)))?.enableAutoFillOnPageLoad ?? false;
    }
    async setEnableAutoFillOnPageLoad(value: boolean, options?: StorageOptions): Promise<void> {
        const account = await this.getAccount(this.reconcileOptions(options, this.defaultInMemoryOptions));
        account.enableAutoFillOnPageLoad = value;
        await this.saveAccount(account, this.reconcileOptions(options, this.defaultInMemoryOptions));
    }

    async getEnableBiometric(options?: StorageOptions): Promise<boolean> {
        return (await this.getAccount(this.reconcileOptions(options, this.defaultOnDiskOptions)))?.enableBiometrics ?? false;
    }
    async setEnableBiometric(value: boolean, options?: StorageOptions): Promise<void> {
        const account = await this.getAccount(this.reconcileOptions(options, this.defaultOnDiskOptions));
        account.enableBiometrics = value;
        await this.saveAccount(account, this.reconcileOptions(options, this.defaultOnDiskOptions));
    }

    async getEnableBrowserIntegration(options?: StorageOptions): Promise<boolean> {
        return (await this.getAccount(this.reconcileOptions(options, this.defaultOnDiskOptions)))?.enableBrowserIntegration ?? false;
    }
    async setEnableBrowserIntegration(value: boolean, options?: StorageOptions): Promise<void> {
        const account = await this.getAccount(this.reconcileOptions(options, this.defaultOnDiskOptions));
        account.enableBrowserIntegration = value;
        await this.saveAccount(account, this.reconcileOptions(options, this.defaultOnDiskOptions));
    }

    async getEnableBrowserIntegrationFingerprint(options?: StorageOptions): Promise<boolean> {
        return (await this.getAccount(this.reconcileOptions(options, this.defaultOnDiskOptions)))?.enableBrowserIntegrationFingerprint ?? false;
    }
    async setEnableBrowserIntegrationFingerprint(value: boolean, options?: StorageOptions): Promise<void> {
        const account = await this.getAccount(this.reconcileOptions(options, this.defaultOnDiskOptions));
        account.enableBrowserIntegrationFingerprint = value;
        await this.saveAccount(account, this.reconcileOptions(options, this.defaultOnDiskOptions));
    }

    async getEnableCloseToTray(options?: StorageOptions): Promise<boolean> {
        return (await this.getAccount(this.reconcileOptions(options, this.defaultInMemoryOptions)))?.enableCloseToTray ?? false;
    }
    async setEnableCloseToTray(value: boolean, options?: StorageOptions): Promise<void> {
        const account = await this.getAccount(this.reconcileOptions(options, this.defaultInMemoryOptions));
        account.enableCloseToTray = value;
        await this.saveAccount(account, this.reconcileOptions(options, this.defaultInMemoryOptions));
    }

    async getEnableFullWidth(options?: StorageOptions): Promise<boolean> {
        return (await this.getAccount(this.reconcileOptions(options, this.defaultOnDiskLocalOptions)))?.enableFullWidth ?? false;
    }
    async setEnableFullWidth(value: boolean, options?: StorageOptions): Promise<void> {
        const account = await this.getAccount(this.reconcileOptions(options, this.defaultOnDiskLocalOptions));
        account.enableFullWidth = value;
        await this.saveAccount(account, this.reconcileOptions(options, this.defaultOnDiskLocalOptions));
    }

    async getEnableGravitars(options?: StorageOptions): Promise<boolean> {
        return (await this.getAccount(this.reconcileOptions(options, this.defaultOnDiskLocalOptions)))?.enableGravitars ?? true;
    }
    async setEnableGravitars(value: boolean, options?: StorageOptions): Promise<void> {
        const account = await this.getAccount(this.reconcileOptions(options, this.defaultOnDiskLocalOptions));
        account.enableGravitars = value;
        await this.saveAccount(account, this.reconcileOptions(options, this.defaultOnDiskLocalOptions));
    }

    async getEnableMinimizeToTray(options?: StorageOptions): Promise<boolean> {
        return (await this.getAccount(this.reconcileOptions(options, this.defaultOnDiskOptions)))?.enableMinimizeToTray ?? false;
    }
    async setEnableMinimizeToTray(value: boolean, options?: StorageOptions): Promise<void> {
        const account = await this.getAccount(this.reconcileOptions(options, this.defaultOnDiskOptions));
        account.enableMinimizeToTray = value;
        await this.saveAccount(account, this.reconcileOptions(options, this.defaultOnDiskOptions));
    }

    async getEnableStartToTray(options?: StorageOptions): Promise<boolean> {
        return (await this.getAccount(this.reconcileOptions(options, this.defaultInMemoryOptions)))?.enableStartToTray ?? false;
    }
    async setEnableStartToTray(value: boolean, options?: StorageOptions): Promise<void> {
        const account = await this.getAccount(this.reconcileOptions(options, this.defaultInMemoryOptions));
        account.enableStartToTray = value;
        await this.saveAccount(account, this.reconcileOptions(options, this.defaultInMemoryOptions));
    }

    async getEnableTray(options?: StorageOptions): Promise<boolean> {
        return (await this.getAccount(this.reconcileOptions(options, this.defaultInMemoryOptions)))?.enableTray ?? false;
    }
    async setEnableTray(value: boolean, options?: StorageOptions): Promise<void> {
        const account = await this.getAccount(this.reconcileOptions(options, this.defaultInMemoryOptions));
        account.enableTray = value;
        await this.saveAccount(account, this.reconcileOptions(options, this.defaultInMemoryOptions));
    }

    async getEncryptedCiphers(options?: StorageOptions): Promise<{ [id: string]: CipherData; }> {
        return (await this.getAccount(this.reconcileOptions(options, this.defaultOnDiskMemoryOptions)))?.encryptedCiphers;
    }
    async setEncryptedCiphers(value: { [id: string]: CipherData; }, options?: StorageOptions): Promise<void> {
        const account = await this.getAccount(this.reconcileOptions(options, this.defaultOnDiskMemoryOptions));
        account.encryptedCiphers = value;
        await this.saveAccount(account, this.reconcileOptions(options, this.defaultOnDiskMemoryOptions));
    }

    async getEncryptedCollections(options?: StorageOptions): Promise<{ [id: string]: CollectionData; }> {
        return (await this.getAccount(this.reconcileOptions(options, this.defaultOnDiskMemoryOptions)))?.encryptedCollections;
    }
    async setEncryptedCollections(value: { [id: string]: CollectionData; }, options?: StorageOptions): Promise<void> {
        const account = await this.getAccount(this.reconcileOptions(options, this.defaultOnDiskMemoryOptions));
        account.encryptedCollections = value;
        await this.saveAccount(account, this.reconcileOptions(options, this.defaultOnDiskMemoryOptions));
    }

    async getEncryptedCryptoSymmetricKey(options?: StorageOptions): Promise<string> {
        return (await this.getAccount(this.reconcileOptions(options, this.defaultOnDiskOptions)))?.encryptedCryptoSymmetricKey;
    }
    async setEncryptedCryptoSymmetricKey(value: string, options?: StorageOptions): Promise<void> {
        const account = await this.getAccount(this.reconcileOptions(options, this.defaultOnDiskOptions));
        account.encryptedCryptoSymmetricKey = value;
        await this.saveAccount(account, this.reconcileOptions(options, this.defaultOnDiskOptions));
    }

    async getEncryptedFolders(options?: StorageOptions): Promise<{ [id: string]: FolderData; }> {
        return (await this.getAccount(this.reconcileOptions(options, this.defaultOnDiskMemoryOptions)))?.encryptedFolders;
    }
    async setEncryptedFolders(value: { [id: string]: FolderData; }, options?: StorageOptions): Promise<void> {
        const account = await this.getAccount(this.reconcileOptions(options, this.defaultOnDiskMemoryOptions));
        account.encryptedFolders = value;
        await this.saveAccount(account, this.reconcileOptions(options, this.defaultOnDiskMemoryOptions));
    }

    async getEncryptedOrganizationKeys(options?: StorageOptions): Promise<any> {
        return (await this.getAccount(this.reconcileOptions(options, this.defaultOnDiskOptions)))?.encryptedOrganizationKeys;
    }
    async setEncryptedOrganizationKeys(value: Map<string, SymmetricCryptoKey>, options?: StorageOptions): Promise<void> {
        const account = await this.getAccount(this.reconcileOptions(options, this.defaultOnDiskOptions));
        account.encryptedOrganizationKeys = value;
        await this.saveAccount(account, this.reconcileOptions(options, this.defaultOnDiskOptions));
    }

    async getEncryptedPasswordGenerationHistory(options?: StorageOptions): Promise<GeneratedPasswordHistory[]> {
        return (await this.getAccount(this.reconcileOptions(options, this.defaultOnDiskOptions)))?.encryptedPasswordGenerationHistory;
    }
    async setEncryptedPasswordGenerationHistory(value: GeneratedPasswordHistory[], options?: StorageOptions): Promise<void> {
        const account = await this.getAccount(this.reconcileOptions(options, this.defaultOnDiskOptions));
        account.encryptedPasswordGenerationHistory = value;
        await this.saveAccount(account, this.reconcileOptions(options, this.defaultOnDiskOptions));
    }

    async getEncryptedPinProtected(options?: StorageOptions): Promise<string> {
        return (await this.getAccount(this.reconcileOptions(options, this.defaultOnDiskOptions)))?.encryptedPinProtected;
    }
    async setEncryptedPinProtected(value: string, options?: StorageOptions): Promise<void> {
        const account = await this.getAccount(this.reconcileOptions(options, this.defaultOnDiskOptions));
        account.encryptedPinProtected = value;
        await this.saveAccount(account, this.reconcileOptions(options, this.defaultOnDiskOptions));
    }

    async getEncryptedPolicies(options?: StorageOptions): Promise<{ [id: string]: PolicyData; }> {
        return (await this.getAccount(this.reconcileOptions(options, this.defaultOnDiskOptions)))?.encryptedPolicies;
    }
    async setEncryptedPolicies(value: { [id: string]: PolicyData; }, options?: StorageOptions): Promise<void> {
        const account = await this.getAccount(this.reconcileOptions(options, this.defaultOnDiskOptions));
        account.encryptedPolicies = value;
        await this.saveAccount(account, this.reconcileOptions(options, this.defaultOnDiskOptions));
    }

    async getEncryptedPrivateKey(options?: StorageOptions): Promise<string> {
        return (await this.getAccount(this.reconcileOptions(options, this.defaultOnDiskOptions)))?.encryptedPrivateKey;
    }
    async setEncryptedPrivateKey(value: string, options?: StorageOptions): Promise<void> {
        const account = await this.getAccount(this.reconcileOptions(options, this.defaultOnDiskOptions));
        account.encryptedPrivateKey = value;
        await this.saveAccount(account, this.reconcileOptions(options, this.defaultOnDiskOptions));
    }

    async getEncryptedProviderKeys(options?: StorageOptions): Promise<any> {
        return (await this.getAccount(this.reconcileOptions(options, this.defaultOnDiskOptions)))?.encryptedProviderKeys;
    }
    async setEncryptedProviderKeys(value: any, options?: StorageOptions): Promise<void> {
        const account = await this.getAccount(this.reconcileOptions(options, this.defaultOnDiskOptions));
        account.encryptedProviderKeys = value;
        await this.saveAccount(account, this.reconcileOptions(options, this.defaultOnDiskOptions));
    }

    async getEncryptedSends(options?: StorageOptions): Promise<{ [id: string]: SendData; }> {
        return (await this.getAccount(this.reconcileOptions(options, this.defaultOnDiskMemoryOptions)))?.encryptedSends;
    }
    async setEncryptedSends(value: { [id: string]: SendData; }, options?: StorageOptions): Promise<void> {
        const account = await this.getAccount(this.reconcileOptions(options, this.defaultOnDiskMemoryOptions));
        account.encryptedSends = value;
        await this.saveAccount(account, this.reconcileOptions(options, this.defaultOnDiskMemoryOptions));
    }

    async getEntityId(options?: StorageOptions): Promise<string> {
        return (await this.getAccount(this.reconcileOptions(options, this.defaultInMemoryOptions)))?.entityId;
    }
    async setEntityId(value: string, options?: StorageOptions): Promise<void> {
        const account = await this.getAccount(this.reconcileOptions(options, this.defaultInMemoryOptions));
        account.entityId = value;
        await this.saveAccount(account, this.reconcileOptions(options, this.defaultInMemoryOptions));
    }

    async getEntityType(options?: StorageOptions): Promise<any> {
        return (await this.getAccount(this.reconcileOptions(options, this.defaultInMemoryOptions)))?.entityType;
    }
    async setEntityType(value: string, options?: StorageOptions): Promise<void> {
        const account = await this.getAccount(this.reconcileOptions(options, this.defaultInMemoryOptions));
        account.entityType = value;
        await this.saveAccount(account, this.reconcileOptions(options, this.defaultInMemoryOptions));
    }

    async getEnvironmentUrls(options?: StorageOptions): Promise<any> {
        return (await this.getAccount(this.reconcileOptions(options, this.defaultOnDiskOptions)))?.environmentUrls;
    }
    async setEnvironmentUrls(value: any, options?: StorageOptions): Promise<void> {
        const account = await this.getAccount(this.reconcileOptions(options, this.defaultInMemoryOptions));
        account.environmentUrls = value;
        await this.saveAccount(account, this.reconcileOptions(options, this.defaultInMemoryOptions));
    }

    async getEquivalentDomains(options?: StorageOptions): Promise<any> {
        return (await this.getAccount(this.reconcileOptions(options, this.defaultInMemoryOptions)))?.equivalentDomains;
    }
    async setEquivalentDomains(value: string, options?: StorageOptions): Promise<void> {
        const account = await this.getAccount(this.reconcileOptions(options, this.defaultInMemoryOptions));
        account.equivalentDomains = value;
        await this.saveAccount(account, this.reconcileOptions(options, this.defaultInMemoryOptions));
    }

    async getEventCollection(options?: StorageOptions): Promise<EventData[]> {
        return (await this.getAccount(this.reconcileOptions(options, this.defaultInMemoryOptions)))?.eventCollection;
    }
    async setEventCollection(value: EventData[], options?: StorageOptions): Promise<void> {
        const account = await this.getAccount(this.reconcileOptions(options, this.defaultInMemoryOptions));
        account.eventCollection = value;
        await this.saveAccount(account, this.reconcileOptions(options, this.defaultInMemoryOptions));
    }

    async getEverBeenUnlocked(options?: StorageOptions): Promise<boolean> {
        return (await this.getAccount(this.reconcileOptions(options, this.defaultOnDiskOptions))).everBeenUnlocked ?? false;
    }
    async setEverBeenUnlocked(value: boolean, options?: StorageOptions): Promise<void> {
        const account = await this.getAccount(this.reconcileOptions(options, this.defaultOnDiskOptions));
        account.everBeenUnlocked = value;
        await this.saveAccount(account, this.reconcileOptions(options, this.defaultOnDiskOptions));
    }

    async getForcePasswordReset(options?: StorageOptions): Promise<boolean> {
        return (await this.getAccount(this.reconcileOptions(options, this.defaultInMemoryOptions)))?.forcePasswordReset ?? false;
    }
    async setForcePasswordReset(value: boolean, options?: StorageOptions): Promise<void> {
        const account = await this.getAccount(this.reconcileOptions(options, this.defaultInMemoryOptions));
        account.forcePasswordReset = value;
        await this.saveAccount(account, this.reconcileOptions(options, this.defaultInMemoryOptions));
    }

    async getInstalledVersion(options?: StorageOptions): Promise<string> {
        return (await this.getGlobals(this.reconcileOptions(options, this.defaultOnDiskOptions)))?.installedVersion;
    }
    async setInstalledVersion(value: string, options?: StorageOptions): Promise<void> {
        const globals = await this.getGlobals(this.reconcileOptions(options, this.defaultOnDiskOptions));
        globals.installedVersion = value;
        await this.saveGlobals(globals, this.reconcileOptions(options, this.defaultOnDiskOptions));
    }

    async getIsAuthenticated(options?: StorageOptions): Promise<boolean> {
        const account = (await this.getAccount(this.reconcileOptions(options, this.defaultOnDiskLocalOptions)));
        return account != null && account?.accessToken != null && account?.userId != null;
    }

    async getKdfIterations(options?: StorageOptions): Promise<number> {
        return (await this.getAccount(this.reconcileOptions(options, this.defaultInMemoryOptions)))?.kdfIterations;
    }
    async setKdfIterations(value: number, options?: StorageOptions): Promise<void> {
        const account = await this.getAccount(this.reconcileOptions(options, this.defaultInMemoryOptions));
        account.kdfIterations = value;
        await this.saveAccount(account, this.reconcileOptions(options, this.defaultInMemoryOptions));
    }

    async getKdfType(options?: StorageOptions): Promise<KdfType> {
        return (await this.getAccount(this.reconcileOptions(options, this.defaultInMemoryOptions)))?.kdfType;
    }
    async setKdfType(value: KdfType, options?: StorageOptions): Promise<void> {
        const account = await this.getAccount(this.reconcileOptions(options, this.defaultInMemoryOptions));
        account.kdfType = value;
        await this.saveAccount(account, this.reconcileOptions(options, this.defaultInMemoryOptions));
    }

    async getKeyHash(options?: StorageOptions): Promise<string> {
        return (await this.getAccount(options ?? { storageLocation: StorageLocation.Both }))?.keyHash;
    }
    async setKeyHash(value: string, options?: StorageOptions): Promise<void> {
        const account = await this.getAccount(this.reconcileOptions(options, this.defaultInMemoryOptions));
        account.keyHash = value;
        await this.saveAccount(account, this.reconcileOptions(options, this.defaultInMemoryOptions));
    }

    async getLastActive(options?: StorageOptions): Promise<number> {
        const lastActive = (await this.getAccount(this.reconcileOptions(options, this.defaultOnDiskOptions)))?.lastActive;
        return lastActive ?? (await this.getGlobals(this.reconcileOptions(options, this.defaultOnDiskOptions))).lastActive;
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

    async getLastSync(options?: StorageOptions): Promise<string> {
        return (await this.getAccount(this.reconcileOptions(options, this.defaultOnDiskMemoryOptions)))?.lastSync;
    }
    async setLastSync(value: string, options?: StorageOptions): Promise<void> {
        const account = await this.getAccount(this.reconcileOptions(options, this.defaultOnDiskMemoryOptions));
        account.lastSync = value;
        await this.saveAccount(account, this.reconcileOptions(options, this.defaultOnDiskMemoryOptions));
    }

    async getLegacyEtmKey(options?: StorageOptions): Promise<SymmetricCryptoKey> {
        return (await this.getAccount(this.reconcileOptions(options, this.defaultInMemoryOptions)))?.legacyEtmKey;
    }
    async setLegacyEtmKey(value: SymmetricCryptoKey, options?: StorageOptions): Promise<void> {
        const account = await this.getAccount(this.reconcileOptions(options, this.defaultInMemoryOptions));
        account.legacyEtmKey = value;
        await this.saveAccount(account, this.reconcileOptions(options, this.defaultInMemoryOptions));
    }

    async getLocalData(options?: StorageOptions): Promise<any> {
        return (await this.getAccount(this.reconcileOptions(options, this.defaultInMemoryOptions)))?.localData;
    }
    async setLocalData(value: string, options?: StorageOptions): Promise<void> {
        const account = await this.getAccount(this.reconcileOptions(options, this.defaultInMemoryOptions));
        account.localData = value;
        await this.saveAccount(account, this.reconcileOptions(options, this.defaultInMemoryOptions));
    }

    async getLocale(options?: StorageOptions): Promise<string> {
        return (await this.getAccount(this.reconcileOptions(options, this.defaultInMemoryOptions)))?.locale;
    }
    async setLocale(value: string, options?: StorageOptions): Promise<void> {
        const account = await this.getAccount(this.reconcileOptions(options, this.defaultInMemoryOptions));
        account.locale = value;
        await this.saveAccount(account, this.reconcileOptions(options, this.defaultInMemoryOptions));
    }

    async getLoginRedirect(options?: StorageOptions): Promise<any> {
        return (await this.getAccount(this.reconcileOptions(options, this.defaultInMemoryOptions)))?.loginRedirect;
    }
    async setLoginRedirect(value: any, options?: StorageOptions): Promise<void> {
        const account = await this.getAccount(this.reconcileOptions(options, this.defaultInMemoryOptions));
        account.loginRedirect = value;
        await this.saveAccount(account, this.reconcileOptions(options, this.defaultInMemoryOptions));
    }

    async getMainWindowSize(options?: StorageOptions): Promise<number> {
        return (await this.getAccount(this.reconcileOptions(options, this.defaultInMemoryOptions)))?.mainWindowSize;
    }
    async setMainWindowSize(value: number, options?: StorageOptions): Promise<void> {
        const account = await this.getAccount(this.reconcileOptions(options, this.defaultInMemoryOptions));
        account.mainWindowSize = value;
        await this.saveAccount(account, this.reconcileOptions(options, this.defaultInMemoryOptions));
    }

    async getMinimizeOnCopyToClipboard(options?: StorageOptions): Promise<boolean> {
        return (await this.getAccount(this.reconcileOptions(options, this.defaultOnDiskOptions)))?.minimizeOnCopyToClipboard ?? false;
    }
    async setMinimizeOnCopyToClipboard(value: boolean, options?: StorageOptions): Promise<void> {
        const account = await this.getAccount(this.reconcileOptions(options, this.defaultOnDiskOptions));
        account.minimizeOnCopyToClipboard = value;
        await this.saveAccount(account, this.reconcileOptions(options, this.defaultOnDiskOptions));
    }

    async getNeverDomains(options?: StorageOptions): Promise<{ [id: string]: any; }> {
        return (await this.getAccount(this.reconcileOptions(options, this.defaultInMemoryOptions)))?.neverDomains;
    }
    async setNeverDomains(value: { [id: string]: any; }, options?: StorageOptions): Promise<void> {
        const account = await this.getAccount(this.reconcileOptions(options, this.defaultInMemoryOptions));
        account.neverDomains = value;
        await this.saveAccount(account, this.reconcileOptions(options, this.defaultInMemoryOptions));
    }

    async getNoAutoPromptBiometrics(options?: StorageOptions): Promise<boolean> {
        return (await this.getAccount(this.reconcileOptions(options, this.defaultOnDiskOptions)))?.noAutoPromptBiometrics ?? false;
    }
    async setNoAutoPromptBiometrics(value: boolean, options?: StorageOptions): Promise<void> {
        const account = await this.getAccount(this.reconcileOptions(options, this.defaultOnDiskOptions));
        account.noAutoPromptBiometrics = value;
        await this.saveAccount(account, this.reconcileOptions(options, this.defaultOnDiskOptions));
    }

    async getNoAutoPromptBiometricsText(options?: StorageOptions): Promise<string> {
        return (await this.getAccount(this.reconcileOptions(options, this.defaultOnDiskOptions)))?.noAutoPromptBiometricsText;
    }
    async setNoAutoPromptBiometricsText(value: string, options?: StorageOptions): Promise<void> {
        const account = await this.getAccount(this.reconcileOptions(options, this.defaultOnDiskOptions));
        account.noAutoPromptBiometricsText = value;
        await this.saveAccount(account, this.reconcileOptions(options, this.defaultOnDiskOptions));
    }

    async getOpenAtLogin(options?: StorageOptions): Promise<boolean> {
        return (await this.getGlobals(this.reconcileOptions(options, this.defaultOnDiskOptions)))?.openAtLogin ?? false;
    }
    async setOpenAtLogin(value: boolean, options?: StorageOptions): Promise<void> {
        const globals = await this.getGlobals(this.reconcileOptions(options, this.defaultOnDiskOptions));
        globals.openAtLogin = value;
        await this.saveGlobals(globals, this.reconcileOptions(options, this.defaultOnDiskOptions));
    }

    async getOrganizationInvitation(options?: StorageOptions): Promise<any> {
        return (await this.getGlobals(this.reconcileOptions(options, this.defaultInMemoryOptions))).organizationInvitation;
    }
    async setOrganizationInvitation(value: any, options?: StorageOptions): Promise<void> {
        const globals = await this.getGlobals(this.reconcileOptions(options, this.defaultInMemoryOptions));
        globals.organizationInvitation = value;
        await this.saveGlobals(globals, this.reconcileOptions(options, this.defaultInMemoryOptions));
    }

    async getOrganizations(options?: StorageOptions): Promise<{ [id: string]: OrganizationData; }> {
        return (await this.getAccount(this.reconcileOptions(options, this.defaultInMemoryOptions))).organizations;
    }
    async setOrganizations(value: { [id: string]: OrganizationData; }, options?: StorageOptions): Promise<void> {
        const account = await this.getAccount(this.reconcileOptions(options, this.defaultInMemoryOptions));
        account.organizations = value;
        await this.saveAccount(account, this.reconcileOptions(options, this.defaultInMemoryOptions));
    }

    async getPasswordGenerationOptions(options?: StorageOptions): Promise<any> {
        return (await this.getAccount(this.reconcileOptions(options, this.defaultInMemoryOptions)))?.passwordGenerationOptions;
    }
    async setPasswordGenerationOptions(value: any, options?: StorageOptions): Promise<void> {
        const account = await this.getAccount(this.reconcileOptions(options, this.defaultInMemoryOptions));
        account.passwordGenerationOptions = value;
        await this.saveAccount(account, this.reconcileOptions(options, this.defaultInMemoryOptions));
    }

    async getProtectedPin(options?: StorageOptions): Promise<string> {
        return (await this.getAccount(this.reconcileOptions(options, this.defaultInMemoryOptions)))?.protectedPin;
    }
    async setProtectedPin(value: string, options?: StorageOptions): Promise<void> {
        const account = await this.getAccount(this.reconcileOptions(options, this.defaultOnDiskOptions));
        account.protectedPin = value;
        await this.saveAccount(account, this.reconcileOptions(options, this.defaultOnDiskOptions));
    }

    async getProviders(options?: StorageOptions): Promise<{ [id: string]: ProviderData; }> {
        return (await this.getAccount(this.reconcileOptions(options, this.defaultInMemoryOptions)))?.providers;
    }
    async setProviders(value: { [id: string]: ProviderData; }, options?: StorageOptions): Promise<void> {
        const account = await this.getAccount(this.reconcileOptions(options, this.defaultInMemoryOptions));
        account.providers = value;
        await this.saveAccount(account, this.reconcileOptions(options, this.defaultInMemoryOptions));
    }

    async getPublicKey(options?: StorageOptions): Promise<ArrayBuffer> {
        return (await this.getAccount(this.reconcileOptions(options, this.defaultInMemoryOptions)))?.publicKey;
    }
    async setPublicKey(value: ArrayBuffer, options?: StorageOptions): Promise<void> {
        const account = await this.getAccount(this.reconcileOptions(options, this.defaultInMemoryOptions));
        account.publicKey = value;
        await this.saveAccount(account, this.reconcileOptions(options, this.defaultInMemoryOptions));
    }

    async getRefreshToken(options?: StorageOptions): Promise<string> {
        return (await this.getAccount(this.reconcileOptions(options, this.defaultInMemoryOptions)))?.refreshToken;
    }
    async setRefreshToken(value: string, options?: StorageOptions): Promise<void> {
        const account = await this.getAccount(this.reconcileOptions(options, this.defaultInMemoryOptions));
        account.refreshToken = value;
        await this.saveAccount(account, this.reconcileOptions(options, this.defaultInMemoryOptions));
    }

    async getRememberedEmail(options?: StorageOptions): Promise<string> {
        return (await this.getGlobals(this.reconcileOptions(options, this.defaultOnDiskLocalOptions)))?.rememberedEmail;
    }
    async setRememberedEmail(value: string, options?: StorageOptions): Promise<void> {
        const globals = await this.getGlobals(this.reconcileOptions(options, this.defaultOnDiskLocalOptions));
        globals.rememberedEmail = value;
        await this.saveGlobals(globals, this.reconcileOptions(options, this.defaultOnDiskLocalOptions));
    }

    async getSecurityStamp(options?: StorageOptions): Promise<string> {
        return (await this.getAccount(this.reconcileOptions(options, this.defaultInMemoryOptions)))?.securityStamp;
    }
    async setSecurityStamp(value: string, options?: StorageOptions): Promise<void> {
        const account = await this.getAccount(this.reconcileOptions(options, this.defaultInMemoryOptions));
        account.securityStamp = value;
        await this.saveAccount(account, this.reconcileOptions(options, this.defaultInMemoryOptions));
    }

    async getSettings(options?: StorageOptions): Promise<any> {
        return (await this.getAccount(this.reconcileOptions(options, this.defaultOnDiskMemoryOptions)))?.settings;
    }
    async setSettings(value: string, options?: StorageOptions): Promise<void> {
        const account = await this.getAccount(this.reconcileOptions(options, this.defaultOnDiskMemoryOptions));
        account.settings = value;
        await this.saveAccount(account, this.reconcileOptions(options, this.defaultOnDiskMemoryOptions));
    }

    async getSsoCodeVerifier(options?: StorageOptions): Promise<string> {
        return (await this.getAccount(this.reconcileOptions(options, this.defaultInMemoryOptions)))?.ssoCodeVerifier;
    }
    async setSsoCodeVerifier(value: string, options?: StorageOptions): Promise<void> {
        const account = await this.getAccount(this.reconcileOptions(options, this.defaultInMemoryOptions));
        account.ssoCodeVerifier = value;
        await this.saveAccount(account, this.reconcileOptions(options, this.defaultInMemoryOptions));
    }

    async getSsoOrgIdentifier(options?: StorageOptions): Promise<string> {
        return (await this.getAccount(this.reconcileOptions(options, this.defaultOnDiskLocalOptions)))?.ssoOrganizationIdentifier;
    }
    async setSsoOrganizationIdentifier(value: string, options?: StorageOptions): Promise<void> {
        const account = await this.getAccount(this.reconcileOptions(options, this.defaultOnDiskLocalOptions));
        account.ssoOrganizationIdentifier = value;
        await this.saveAccount(account, this.reconcileOptions(options, this.defaultOnDiskLocalOptions));
    }

    async getSsoState(options?: StorageOptions): Promise<string> {
        return (await this.getAccount(this.reconcileOptions(options, this.defaultInMemoryOptions)))?.ssoState;
    }
    async setSsoState(value: string, options?: StorageOptions): Promise<void> {
        const account = await this.getAccount(this.reconcileOptions(options, this.defaultInMemoryOptions));
        account.ssoState = value;
        await this.saveAccount(account, this.reconcileOptions(options, this.defaultInMemoryOptions));
    }

    async getTheme(options?: StorageOptions): Promise<string> {
        const accountTheme = (await this.getAccount(this.reconcileOptions(options, this.defaultOnDiskLocalOptions)))?.theme;
        const globalTheme = (await this.getGlobals(this.reconcileOptions(options, this.defaultOnDiskLocalOptions)))?.theme;
        return accountTheme ?? globalTheme;
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

    async getTwoFactorToken(options?: StorageOptions): Promise<string> {
        return (await this.getGlobals(this.reconcileOptions(options, this.defaultOnDiskLocalOptions)))?.twoFactorToken;
    }
    async setTwoFactorToken(value: string, options?: StorageOptions): Promise<void> {
        const globals = await this.getGlobals(this.reconcileOptions(options, this.defaultOnDiskLocalOptions));
        globals.twoFactorToken = value;
        await this.saveGlobals(globals, this.reconcileOptions(options, this.defaultOnDiskLocalOptions));
    }

    async getUserId(options?: StorageOptions): Promise<string> {
        return (await this.getAccount(this.reconcileOptions(options, this.defaultInMemoryOptions))).userId;
    }

    async getUsesKeyConnector(options?: StorageOptions): Promise<boolean> {
        return (await this.getAccount(this.reconcileOptions(options, this.defaultInMemoryOptions)))?.usesKeyConnector;
    }

    async setUsesKeyConnector(value: boolean, options?: StorageOptions): Promise<void> {
        const account = await this.getAccount(this.reconcileOptions(options, this.defaultInMemoryOptions));
        account.usesKeyConnector = value;
        await this.saveAccount(account, this.reconcileOptions(options, this.defaultInMemoryOptions));
    }

    async getVaultTimeout(options?: StorageOptions): Promise<number> {
        const accountVaultTimeout = (await this.getAccount(this.reconcileOptions(options, this.defaultOnDiskOptions)))?.vaultTimeout;
        const globalVaultTimeout = (await this.getGlobals(this.reconcileOptions(options, this.defaultOnDiskOptions)))?.vaultTimeout;
        return accountVaultTimeout ?? globalVaultTimeout;
    }
    async setVaultTimeout(value: number, options?: StorageOptions): Promise<void> {
        const account = await this.getAccount(this.reconcileOptions(options, this.defaultOnDiskOptions));
        account.vaultTimeout = value;
        await this.saveAccount(account, this.reconcileOptions(options, this.defaultOnDiskOptions));
    }

    async getVaultTimeoutAction(options?: StorageOptions): Promise<string> {
        const accountVaultTimeoutAction = (await this.getAccount(this.reconcileOptions(options, this.defaultOnDiskOptions)))?.vaultTimeoutAction;
        const globalVaultTimeoutAction = (await this.getGlobals(this.reconcileOptions(options, this.defaultOnDiskOptions)))?.vaultTimeoutAction;
        return accountVaultTimeoutAction ?? globalVaultTimeoutAction;
    }
    async setVaultTimeoutAction(value: string, options?: StorageOptions): Promise<void> {
        const account = await this.getAccount(this.reconcileOptions(options, this.defaultOnDiskOptions));
        account.vaultTimeoutAction = value;
        await this.saveAccount(account, this.reconcileOptions(options, this.defaultOnDiskOptions));
    }

    async getWindow(): Promise<Map<string, any>> {
        const globals = await this.getGlobals({ storageLocation: StorageLocation.Disk });
        return Object.keys(globals.window).length > 0 ?
            globals.window :
            new Map<string, any>();
    }

    async setWindow(value: Map<string, any>, options?: StorageOptions): Promise<void> {
        const globals = await this.getGlobals(this.reconcileOptions(options, this.defaultOnDiskOptions));
        globals.window = value;
        return await this.saveGlobals(globals, this.reconcileOptions(options, this.defaultOnDiskOptions));
    }

    private async getGlobals(options: StorageOptions): Promise<GlobalState> {
        let globals: GlobalState;
        if (this.useMemory(options.storageLocation)) {
            globals = this.getGlobalsFromMemory();
        }

        if (this.useDisk && globals == null) {
            globals = await this.getGlobalsFromDisk(options);
        }

        return globals ?? new GlobalState();
    }

    private async saveGlobals(globals: GlobalState, options: StorageOptions = {
        storageLocation: StorageLocation.Memory,
        useSecureStorage: false,
    }) {
        return this.useMemory(options.storageLocation) ?
            this.saveGlobalsToMemory(globals) :
            this.saveGlobalsToDisk(globals, options);
    }

    private getGlobalsFromMemory(): GlobalState {
        return this.state.globals;
    }

    private async getGlobalsFromDisk(options: StorageOptions): Promise<GlobalState> {
        return (await this.storageService.get<State>('state', options))?.globals;
    }

    private saveGlobalsToMemory(globals: GlobalState): void {
        this.state.globals = globals;
    }

    private async saveGlobalsToDisk(globals: GlobalState, options: StorageOptions): Promise<void> {
        if (options.useSecureStorage) {
            const state = await this.secureStorageService.get<State>('state', options) ?? new State();
            state.globals = globals;
            await this.secureStorageService.save('state', state, options);
        } else {
            const state = await this.storageService.get<State>('state', options) ?? new State();
            state.globals = globals;
            await this.storageService.save('state', state, options);
        }
    }

    private async getAccount(options: StorageOptions): Promise<Account> {
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

        const state = options?.useSecureStorage ?
            await this.secureStorageService.get<State>('state', options) :
            await this.storageService.get<State>('state', options);

        return state.accounts[options?.userId ?? this.state.activeUserId];
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
        const storageLocation = options.useSecureStorage ?
            this.secureStorageService :
            this.storageService;

        const state = await storageLocation.get<State>('state', options);
        state.accounts[account.userId] = account;

        await storageLocation.save('state', state, options);
        await this.pushAccounts();
    }

    private async saveAccountToMemory(account: Account): Promise<void> {
        if (this.getAccountFromMemory({ userId: account.userId }) !== null) {
            this.state.accounts[account.userId] = account;
        }
        await this.pushAccounts();
    }

    private async scaffoldNewAccountStorage(account: Account): Promise<void> {
        const storedState = await this.storageService.get<State>('state', this.defaultOnDiskLocalOptions) ?? new State();
        const storedAccount = storedState.accounts[account.userId];
        if (storedAccount != null) {
            storedAccount.accessToken = account.accessToken;
            storedAccount.refreshToken = account.refreshToken;
            account = storedAccount;
        }
        storedState.accounts[account.userId] = account;
        await this.storageService.save('state', storedState, this.defaultOnDiskLocalOptions);
        await this.storageService.save('state', storedState, this.defaultOnDiskMemoryOptions);
        await this.storageService.save('state', storedState);

        if (await this.secureStorageService.get<State>('state') == null) {
            await this.secureStorageService.save('state', storedState);
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
