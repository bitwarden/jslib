import { StateService as StateServiceAbstraction } from '../abstractions/state.service';

import { Account } from '../models/domain/account';

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

import { StateMigrationService } from './stateMigration.service';

export class StateService implements StateServiceAbstraction {
    accounts = new BehaviorSubject<{ [userId: string]: Account }>({});
    activeAccount = new BehaviorSubject<string>(null);

    private state: State = new State();

    constructor(
        private storageService: StorageService,
        private secureStorageService: StorageService,
        private logService: LogService,
        private stateMigrationService: StateMigrationService
    ) { }

    async init(): Promise<void> {
        if (await this.stateMigrationService.needsMigration()) {
            await this.stateMigrationService.migrate();
        }
        if (this.state.activeUserId == null) {
            await this.loadStateFromDisk();
        }
    }

    async loadStateFromDisk() {
        if (await this.getActiveUserIdFromStorage() != null) {
            const diskState = await this.storageService.get<State>('state', await this.defaultOnDiskOptions());
            this.state = diskState;
            await this.pruneInMemoryAccounts();
            await this.saveStateToStorage(this.state, await this.defaultOnDiskMemoryOptions());
            await this.pushAccounts();
        }
    }

    async addAccount(account: Account) {
        if (account?.profile?.userId == null) {
            return;
        }
        this.state.accounts[account.profile.userId] = account;
        await this.scaffoldNewAccountStorage(account);
        await this.setActiveUser(account.profile.userId);
        this.activeAccount.next(account.profile.userId);
    }

    async setActiveUser(userId: string): Promise<void> {
        this.state.activeUserId = userId;
        const storedState = await this.storageService.get<State>('state', await this.defaultOnDiskOptions());
        storedState.activeUserId = userId;
        await this.saveStateToStorage(storedState, await this.defaultOnDiskOptions());
        await this.pushAccounts();
        this.activeAccount.next(this.state.activeUserId);
    }

    async clean(options?: StorageOptions): Promise<void> {
        // Find and set the next active user if any exists
        if (options?.userId == null || options.userId === await this.getUserId()) {
            for (const userId in this.state.accounts) {
                if (userId == null) {
                    continue;
                }
                if (await this.getIsAuthenticated({ userId: userId })) {
                    await this.setActiveUser(userId);
                    break;
                }
                await this.setActiveUser(null);
            }
        }

        await this.removeAccountFromSessionStorage(options?.userId);
        await this.removeAccountFromLocalStorage(options?.userId);
        await this.removeAccountFromSecureStorage(options?.userId);
        this.removeAccountFromMemory(options?.userId);
        await this.pushAccounts();
    }

    async getAccessToken(options?: StorageOptions): Promise<string> {
        return (await this.getAccount(this.reconcileOptions(options, await this.defaultOnDiskOptions())))?.tokens?.accessToken;
    }

    async setAccessToken(value: string, options?: StorageOptions): Promise<void> {
        const account = await this.getAccount(this.reconcileOptions(options, await this.defaultOnDiskOptions()));
        account.tokens.accessToken = value;
        await this.saveAccount(account, this.reconcileOptions(options, await this.defaultOnDiskOptions()));
    }

    async getAddEditCipherInfo(options?: StorageOptions): Promise<any> {
        return (await this.getAccount(this.reconcileOptions(options, this.defaultInMemoryOptions)))?.data?.addEditCipherInfo;
    }

    async setAddEditCipherInfo(value: any, options?: StorageOptions): Promise<void> {
        const account = await this.getAccount(this.reconcileOptions(options, this.defaultInMemoryOptions));
        account.data.addEditCipherInfo = value;
        await this.saveAccount(account, this.reconcileOptions(options, this.defaultInMemoryOptions));
    }

    async getAlwaysShowDock(options?: StorageOptions): Promise<boolean> {
        return (await this.getAccount(this.reconcileOptions(options, await this.defaultOnDiskOptions())))?.settings?.alwaysShowDock ?? false;
    }

    async setAlwaysShowDock(value: boolean, options?: StorageOptions): Promise<void> {
        const account = await this.getAccount(this.reconcileOptions(options, await this.defaultOnDiskOptions()));
        account.settings.alwaysShowDock = value;
        await this.saveAccount(account, this.reconcileOptions(options, await this.defaultOnDiskOptions()));
    }

    async getApiKeyClientId(options?: StorageOptions): Promise<string> {
        return (await this.getAccount(this.reconcileOptions(options, await this.defaultOnDiskOptions())))?.profile?.apiKeyClientId;
    }

    async setApiKeyClientId(value: string, options?: StorageOptions): Promise<void> {
        const account = await this.getAccount(this.reconcileOptions(options, await this.defaultOnDiskOptions()));
        account.profile.apiKeyClientId = value;
        await this.saveAccount(account, this.reconcileOptions(options, await this.defaultOnDiskOptions()));
    }

    async getApiKeyClientSecret(options?: StorageOptions): Promise<string> {
        return (await this.getAccount(this.reconcileOptions(options, await this.defaultOnDiskOptions())))?.keys?.apiKeyClientSecret;
    }

    async setApiKeyClientSecret(value: string, options?: StorageOptions): Promise<void> {
        const account = await this.getAccount(this.reconcileOptions(options, await this.defaultOnDiskOptions()));
        account.keys.apiKeyClientSecret = value;
        await this.saveAccount(account, this.reconcileOptions(options, await this.defaultOnDiskOptions()));
    }

    async getAutoConfirmFingerPrints(options?: StorageOptions): Promise<boolean> {
        return (await this.getAccount(this.reconcileOptions(options, await this.defaultOnDiskOptions())))?.settings?.autoConfirmFingerPrints ?? true;
    }

    async setAutoConfirmFingerprints(value: boolean, options?: StorageOptions): Promise<void> {
        const account = await this.getAccount(this.reconcileOptions(options, await this.defaultOnDiskOptions()));
        account.settings.autoConfirmFingerPrints = value;
        await this.saveAccount(account, this.reconcileOptions(options, await this.defaultOnDiskOptions()));
    }

    async getAutoFillOnPageLoadDefault(options?: StorageOptions): Promise<boolean> {
        return (await this.getAccount(this.reconcileOptions(options, await this.defaultOnDiskOptions())))?.settings?.autoFillOnPageLoadDefault ?? false;
    }

    async setAutoFillOnPageLoadDefault(value: boolean, options?: StorageOptions): Promise<void> {
        const account = await this.getAccount(this.reconcileOptions(options, await this.defaultOnDiskOptions()));
        account.settings.autoFillOnPageLoadDefault = value;
        await this.saveAccount(account, this.reconcileOptions(options, await this.defaultOnDiskOptions()));
    }

    async getBiometricAwaitingAcceptance(options?: StorageOptions): Promise<boolean> {
        return (await this.getGlobals(this.reconcileOptions(options, await this.defaultOnDiskOptions())))?.biometricAwaitingAcceptance ?? false;
    }

    async setBiometricAwaitingAcceptance(value: boolean, options?: StorageOptions): Promise<void> {
        const globals = await this.getGlobals(this.reconcileOptions(options, await this.defaultOnDiskOptions()));
        globals.biometricAwaitingAcceptance = value;
        await this.saveGlobals(globals, this.reconcileOptions(options, await this.defaultOnDiskOptions()));
    }

    async getBiometricFingerprintValidated(options?: StorageOptions): Promise<boolean> {
        return (await this.getGlobals(this.reconcileOptions(options, await this.defaultOnDiskOptions())))?.biometricFingerprintValidated ?? false;
    }

    async setBiometricFingerprintValidated(value: boolean, options?: StorageOptions): Promise<void> {
        const globals = await this.getGlobals(this.reconcileOptions(options, await this.defaultOnDiskOptions()));
        globals.biometricFingerprintValidated = value;
        await this.saveGlobals(globals, this.reconcileOptions(options, await this.defaultOnDiskOptions()));
    }

    async getBiometricLocked(options?: StorageOptions): Promise<boolean> {
        return (await this.getAccount(this.reconcileOptions(options, this.defaultInMemoryOptions)))?.settings?.biometricLocked ?? false;
    }

    async setBiometricLocked(value: boolean, options?: StorageOptions): Promise<void> {
        const account = await this.getAccount(this.reconcileOptions(options, this.defaultInMemoryOptions));
        account.settings.biometricLocked = value;
        await this.saveAccount(account, this.reconcileOptions(options, this.defaultInMemoryOptions));
    }

    async getBiometricText(options?: StorageOptions): Promise<string> {
        return (await this.getGlobals(this.reconcileOptions(options, await this.defaultOnDiskOptions())))?.biometricText;
    }

    async setBiometricText(value: string, options?: StorageOptions): Promise<void> {
        const globals = await this.getGlobals(this.reconcileOptions(options, await this.defaultOnDiskOptions()));
        globals.biometricText = value;
        await this.saveGlobals(globals, this.reconcileOptions(options, await this.defaultOnDiskOptions()));
    }

    async getBiometricUnlock(options?: StorageOptions): Promise<boolean> {
        return (await this.getAccount(this.reconcileOptions(options, await this.defaultOnDiskOptions())))?.settings?.biometricUnlock ?? false;
    }

    async setBiometricUnlock(value: boolean, options?: StorageOptions): Promise<void> {
        const account = await this.getAccount(this.reconcileOptions(options, await this.defaultOnDiskOptions()));
        account.settings.biometricUnlock = value;
        await this.saveAccount(account, this.reconcileOptions(options, await this.defaultOnDiskOptions()));
    }

    async getCanAccessPremium(options?: StorageOptions): Promise<boolean> {
        if (!await this.getIsAuthenticated(options)) {
            return false;
        }

        const account = await this.getAccount(this.reconcileOptions(options, await this.defaultOnDiskOptions()));
        if (account.profile.hasPremiumPersonally) {
            return true;
        }

        const organizations = await this.getOrganizations(options);
        if (organizations == null) {
            return false;
        }

        for (const id of Object.keys(organizations)) {
            const o = organizations[id];
            if (o.enabled && o.usersGetPremium && !o.isProviderUser) {
                return true;
            }
        }

        return false;
    }

    async getClearClipboard(options?: StorageOptions): Promise<number> {
        return (await this.getAccount(this.reconcileOptions(options, await this.defaultOnDiskLocalOptions())))?.settings?.clearClipboard;
    }

    async setClearClipboard(value: number, options?: StorageOptions): Promise<void> {
        const account = await this.getAccount(this.reconcileOptions(options, await this.defaultOnDiskLocalOptions()));
        account.settings.clearClipboard = value;
        await this.saveAccount(account, this.reconcileOptions(options, await this.defaultOnDiskLocalOptions()));
    }

    async getCollapsedGroupings(options?: StorageOptions): Promise<Set<string>> {
        return (await this.getAccount(this.reconcileOptions(options, this.defaultInMemoryOptions)))?.data?.collapsedGroupings;
    }

    async setCollapsedGroupings(value: Set<string>, options?: StorageOptions): Promise<void> {
        const account = await this.getAccount(this.reconcileOptions(options, this.defaultInMemoryOptions));
        account.data.collapsedGroupings = value;
        await this.saveAccount(account, this.reconcileOptions(options, this.defaultInMemoryOptions));
    }

    async getConvertAccountToKeyConnector(options?: StorageOptions): Promise<boolean> {
        return (await this.getAccount(this.reconcileOptions(options, await this.defaultOnDiskOptions())))?.profile?.convertAccountToKeyConnector;
    }

    async setConvertAccountToKeyConnector(value: boolean, options?: StorageOptions): Promise<void> {
        const account = await this.getAccount(this.reconcileOptions(options, await this.defaultOnDiskOptions()));
        account.profile.convertAccountToKeyConnector = value;
        await this.saveAccount(account, this.reconcileOptions(options, await this.defaultOnDiskOptions()));
    }

    async getCryptoMasterKey(options?: StorageOptions): Promise<SymmetricCryptoKey> {
        return (await this.getAccount(this.reconcileOptions(options, this.defaultInMemoryOptions)))?.keys?.cryptoMasterKey;
    }

    async setCryptoMasterKey(value: SymmetricCryptoKey, options?: StorageOptions): Promise<void> {
        const account = await this.getAccount(this.reconcileOptions(options, this.defaultInMemoryOptions));
        account.keys.cryptoMasterKey = value;
        await this.saveAccount(account, this.reconcileOptions(options, this.defaultInMemoryOptions));
    }

    async getCryptoMasterKeyAuto(options?: StorageOptions): Promise<string> {
        options = this.reconcileOptions(this.reconcileOptions(options, { keySuffix: 'auto' }), await this.defaultSecureStorageOptions());
        if (options?.userId == null) {
            return null;
        }
        return await this.secureStorageService.get(`${options.userId}_masterkey_auto`, options);
    }

    async setCryptoMasterKeyAuto(value: string, options?: StorageOptions): Promise<void> {
        options = this.reconcileOptions(this.reconcileOptions(options, { keySuffix: 'auto' }), await this.defaultSecureStorageOptions());
        if (options?.userId == null) {
            return;
        }
        await this.secureStorageService.save(`${options.userId}_masterkey_auto`, value, options);
    }

    async getCryptoMasterKeyB64(options?: StorageOptions): Promise<string> {
        options = this.reconcileOptions(options, await this.defaultSecureStorageOptions());
        if (options?.userId == null) {
            return null;
        }
        return await this.secureStorageService.get(`${options?.userId}_masterkey`, options);
    }

    async setCryptoMasterKeyB64(value: string, options?: StorageOptions): Promise<void> {
        options = this.reconcileOptions(options, await this.defaultSecureStorageOptions());
        if (options?.userId == null) {
            return;
        }
        await this.secureStorageService.save(`${options.userId}_masterkey`, value, options);
    }

    async getCryptoMasterKeyBiometric(options?: StorageOptions): Promise<string> {
        options = this.reconcileOptions(this.reconcileOptions(options, { keySuffix: 'biometric' }), await this.defaultSecureStorageOptions());
        if (options?.userId == null) {

            return null;
        }
        return await this.secureStorageService.get(`${options.userId}_masterkey_biometric`, options);
    }

    async hasCryptoMasterKeyBiometric(options?: StorageOptions): Promise<boolean> {
        options = this.reconcileOptions(this.reconcileOptions(options, { keySuffix: 'biometric' }), await this.defaultSecureStorageOptions());
        if (options?.userId == null) {
            return false;
        }
        return await this.secureStorageService.has(`${options.userId}_masterkey_biometric`, options);
    }

    async setCryptoMasterKeyBiometric(value: string, options?: StorageOptions): Promise<void> {
        options = this.reconcileOptions(this.reconcileOptions(options, { keySuffix: 'biometric' }), await this.defaultSecureStorageOptions());
        if (options?.userId == null) {
            return;
        }
        await this.secureStorageService.save(`${options.userId}_masterkey_biometric`, value, options);
    }

    async getDecodedToken(options?: StorageOptions): Promise<any> {
        return (await this.getAccount(this.reconcileOptions(options, this.defaultInMemoryOptions)))?.tokens?.decodedToken;
    }

    async setDecodedToken(value: any, options?: StorageOptions): Promise<void> {
        const account = await this.getAccount(this.reconcileOptions(options, this.defaultInMemoryOptions));
        account.tokens.decodedToken = value;
        await this.saveAccount(account, this.reconcileOptions(options, this.defaultInMemoryOptions));
    }

    async getDecryptedCiphers(options?: StorageOptions): Promise<CipherView[]> {
        return (await this.getAccount(this.reconcileOptions(options, this.defaultInMemoryOptions)))?.data?.ciphers?.decrypted;
    }

    async setDecryptedCiphers(value: CipherView[], options?: StorageOptions): Promise<void> {
        const account = await this.getAccount(this.reconcileOptions(options, this.defaultInMemoryOptions));
        account.data.ciphers.decrypted = value;
        await this.saveAccount(account, this.reconcileOptions(options, this.defaultInMemoryOptions));
    }

    async getDecryptedCollections(options?: StorageOptions): Promise<CollectionView[]> {
        return (await this.getAccount(this.reconcileOptions(options, this.defaultInMemoryOptions)))?.data?.collections?.decrypted;
    }

    async setDecryptedCollections(value: CollectionView[], options?: StorageOptions): Promise<void> {
        const account = await this.getAccount(this.reconcileOptions(options, this.defaultInMemoryOptions));
        account.data.collections.decrypted = value;
        await this.saveAccount(account, this.reconcileOptions(options, this.defaultInMemoryOptions));
    }

    async getDecryptedCryptoSymmetricKey(options?: StorageOptions): Promise<SymmetricCryptoKey> {
        return (await this.getAccount(this.reconcileOptions(options, this.defaultInMemoryOptions)))?.keys?.cryptoSymmetricKey?.decrypted;
    }

    async setDecryptedCryptoSymmetricKey(value: SymmetricCryptoKey, options?: StorageOptions): Promise<void> {
        const account = await this.getAccount(this.reconcileOptions(options, this.defaultInMemoryOptions));
        account.keys.cryptoSymmetricKey.decrypted = value;
        await this.saveAccount(account, this.reconcileOptions(options, this.defaultInMemoryOptions));
    }

    async getDecryptedFolders(options?: StorageOptions): Promise<FolderView[]> {
        return (await this.getAccount(this.reconcileOptions(options, this.defaultInMemoryOptions)))?.data?.folders?.decrypted;
    }

    async setDecryptedFolders(value: FolderView[], options?: StorageOptions): Promise<void> {
        const account = await this.getAccount(this.reconcileOptions(options, this.defaultInMemoryOptions));
        account.data.folders.decrypted = value;
        await this.saveAccount(account, this.reconcileOptions(options, this.defaultInMemoryOptions));
    }

    async getDecryptedOrganizationKeys(options?: StorageOptions): Promise<Map<string, SymmetricCryptoKey>> {
        return (await this.getAccount(this.reconcileOptions(options, this.defaultInMemoryOptions)))?.keys?.organizationKeys?.decrypted;
    }

    async setDecryptedOrganizationKeys(value: Map<string, SymmetricCryptoKey>, options?: StorageOptions): Promise<void> {
        const account = await this.getAccount(this.reconcileOptions(options, this.defaultInMemoryOptions));
        account.keys.organizationKeys.decrypted = value;
        await this.saveAccount(account, this.reconcileOptions(options, this.defaultInMemoryOptions));
    }

    async getDecryptedPasswordGenerationHistory(options?: StorageOptions): Promise<GeneratedPasswordHistory[]> {
        return (await this.getAccount(this.reconcileOptions(options, this.defaultInMemoryOptions)))?.data?.passwordGenerationHistory?.decrypted;
    }

    async setDecryptedPasswordGenerationHistory(value: GeneratedPasswordHistory[], options?: StorageOptions): Promise<void> {
        const account = await this.getAccount(this.reconcileOptions(options, this.defaultInMemoryOptions));
        account.data.passwordGenerationHistory.decrypted = value;
        await this.saveAccount(account, this.reconcileOptions(options, this.defaultInMemoryOptions));
    }

    async getDecryptedPinProtected(options?: StorageOptions): Promise<EncString> {
        return (await this.getAccount(this.reconcileOptions(options, this.defaultInMemoryOptions)))?.settings?.pinProtected?.decrypted;
    }

    async setDecryptedPinProtected(value: EncString, options?: StorageOptions): Promise<void> {
        const account = await this.getAccount(this.reconcileOptions(options, this.defaultInMemoryOptions));
        account.settings.pinProtected.decrypted = value;
        await this.saveAccount(account, this.reconcileOptions(options, this.defaultInMemoryOptions));
    }

    async getDecryptedPolicies(options?: StorageOptions): Promise<Policy[]> {
        return (await this.getAccount(this.reconcileOptions(options, this.defaultInMemoryOptions)))?.data?.policies?.decrypted;
    }

    async setDecryptedPolicies(value: Policy[], options?: StorageOptions): Promise<void> {
        const account = await this.getAccount(this.reconcileOptions(options, this.defaultInMemoryOptions));
        account.data.policies.decrypted = value;
        await this.saveAccount(account, this.reconcileOptions(options, this.defaultInMemoryOptions));
    }

    async getDecryptedPrivateKey(options?: StorageOptions): Promise<ArrayBuffer> {
        return (await this.getAccount(this.reconcileOptions(options, this.defaultInMemoryOptions)))?.keys?.privateKey?.decrypted;
    }

    async setDecryptedPrivateKey(value: ArrayBuffer, options?: StorageOptions): Promise<void> {
        const account = await this.getAccount(this.reconcileOptions(options, this.defaultInMemoryOptions));
        account.keys.privateKey.decrypted = value;
        await this.saveAccount(account, this.reconcileOptions(options, this.defaultInMemoryOptions));
    }

    async getDecryptedProviderKeys(options?: StorageOptions): Promise<Map<string, SymmetricCryptoKey>> {
        return (await this.getAccount(this.reconcileOptions(options, this.defaultInMemoryOptions)))?.keys?.providerKeys?.decrypted;
    }

    async setDecryptedProviderKeys(value: Map<string, SymmetricCryptoKey>, options?: StorageOptions): Promise<void> {
        const account = (await this.getAccount(this.reconcileOptions(options, this.defaultInMemoryOptions)));
        account.keys.providerKeys.decrypted = value;
        await this.saveAccount(account, this.reconcileOptions(options, this.defaultInMemoryOptions));
    }

    async getDecryptedSends(options?: StorageOptions): Promise<SendView[]> {
        return (await this.getAccount(this.reconcileOptions(options, this.defaultInMemoryOptions)))?.data?.sends?.decrypted;
    }

    async setDecryptedSends(value: SendView[], options?: StorageOptions): Promise<void> {
        const account = await this.getAccount(this.reconcileOptions(options, this.defaultInMemoryOptions));
        account.data.sends.decrypted = value;
        await this.saveAccount(account, this.reconcileOptions(options, this.defaultInMemoryOptions));
    }

    async getDefaultUriMatch(options?: StorageOptions): Promise<UriMatchType> {
        return (await this.getAccount(this.reconcileOptions(options, await this.defaultOnDiskOptions())))?.settings?.defaultUriMatch;
    }

    async setDefaultUriMatch(value: UriMatchType, options?: StorageOptions): Promise<void> {
        const account = await this.getAccount(this.reconcileOptions(options, await this.defaultOnDiskOptions()));
        account.settings.defaultUriMatch = value;
        await this.saveAccount(account, this.reconcileOptions(options, await this.defaultOnDiskOptions()));
    }

    async getDisableAddLoginNotification(options?: StorageOptions): Promise<boolean> {
        return (await this.getAccount(this.reconcileOptions(options, await this.defaultOnDiskOptions())))?.settings?.disableAddLoginNotification ?? false;
    }

    async setDisableAddLoginNotification(value: boolean, options?: StorageOptions): Promise<void> {
        const account = await this.getAccount(this.reconcileOptions(options, await this.defaultOnDiskOptions()));
        account.settings.disableAddLoginNotification = value;
        await this.saveAccount(account, this.reconcileOptions(options, await this.defaultOnDiskOptions()));
    }

    async getDisableAutoBiometricsPrompt(options?: StorageOptions): Promise<boolean> {
        return (await this.getAccount(this.reconcileOptions(options, await this.defaultOnDiskOptions())))?.settings?.disableAutoBiometricsPrompt ?? false;
    }

    async setDisableAutoBiometricsPrompt(value: boolean, options?: StorageOptions): Promise<void> {
        const account = await this.getAccount(this.reconcileOptions(options, await this.defaultOnDiskOptions()));
        account.settings.disableAutoBiometricsPrompt = value;
        await this.saveAccount(account, this.reconcileOptions(options, await this.defaultOnDiskOptions()));
    }

    async getDisableAutoTotpCopy(options?: StorageOptions): Promise<boolean> {
        return (await this.getAccount(this.reconcileOptions(options, await this.defaultOnDiskOptions())))?.settings?.disableAutoTotpCopy ?? false;
    }

    async setDisableAutoTotpCopy(value: boolean, options?: StorageOptions): Promise<void> {
        const account = await this.getAccount(this.reconcileOptions(options, await this.defaultOnDiskOptions()));
        account.settings.disableAutoTotpCopy = value;
        await this.saveAccount(account, this.reconcileOptions(options, await this.defaultOnDiskOptions()));
    }

    async getDisableBadgeCounter(options?: StorageOptions): Promise<boolean> {
        return (await this.getAccount(this.reconcileOptions(options, await this.defaultOnDiskOptions())))?.settings?.disableBadgeCounter ?? false;
    }

    async setDisableBadgeCounter(value: boolean, options?: StorageOptions): Promise<void> {
        const account = await this.getAccount(this.reconcileOptions(options, await this.defaultOnDiskOptions()));
        account.settings.disableBadgeCounter = value;
        await this.saveAccount(account, this.reconcileOptions(options, await this.defaultOnDiskOptions()));
    }

    async getDisableChangedPasswordNotification(options?: StorageOptions): Promise<boolean> {
        return (await this.getAccount(this.reconcileOptions(options, await this.defaultOnDiskOptions())))?.settings?.disableChangedPasswordNotification ?? false;
    }

    async setDisableChangedPasswordNotification(value: boolean, options?: StorageOptions): Promise<void> {
        const account = await this.getAccount(this.reconcileOptions(options, await this.defaultOnDiskOptions()));
        account.settings.disableChangedPasswordNotification = value;
        await this.saveAccount(account, this.reconcileOptions(options, await this.defaultOnDiskOptions()));
    }

    async getDisableContextMenuItem(options?: StorageOptions): Promise<boolean> {
        return (await this.getAccount(this.reconcileOptions(options, await this.defaultOnDiskOptions())))?.settings?.disableContextMenuItem ?? false;
    }

    async setDisableContextMenuItem(value: boolean, options?: StorageOptions): Promise<void> {
        const account = await this.getAccount(this.reconcileOptions(options, await this.defaultOnDiskOptions()));
        account.settings.disableContextMenuItem = value;
        await this.saveAccount(account, this.reconcileOptions(options, await this.defaultOnDiskOptions()));
    }

    async getDisableFavicon(options?: StorageOptions): Promise<boolean> {
        return (await this.getGlobals(this.reconcileOptions(options, await this.defaultOnDiskLocalOptions())))?.disableFavicon ?? false;
    }

    async setDisableFavicon(value: boolean, options?: StorageOptions): Promise<void> {
        const globals = await this.getGlobals(this.reconcileOptions(options, await this.defaultOnDiskLocalOptions()));
        globals.disableFavicon = value;
        await this.saveGlobals(globals, this.reconcileOptions(options, await this.defaultOnDiskLocalOptions()));
    }

    async getDisableGa(options?: StorageOptions): Promise<boolean> {
        return (await this.getAccount(this.reconcileOptions(options, await this.defaultOnDiskOptions())))?.settings?.disableGa ?? false;
    }

    async setDisableGa(value: boolean, options?: StorageOptions): Promise<void> {
        const account = await this.getAccount(this.reconcileOptions(options, await this.defaultOnDiskOptions()));
        account.settings.disableGa = value;
        await this.saveAccount(account, this.reconcileOptions(options, await this.defaultOnDiskOptions()));
    }

    async getDontShowCardsCurrentTab(options?: StorageOptions): Promise<boolean> {
        return (await this.getAccount(this.reconcileOptions(options, await this.defaultOnDiskOptions())))?.settings?.dontShowCardsCurrentTab ?? false;
    }

    async setDontShowCardsCurrentTab(value: boolean, options?: StorageOptions): Promise<void> {
        const account = await this.getAccount(this.reconcileOptions(options, await this.defaultOnDiskOptions()));
        account.settings.dontShowCardsCurrentTab = value;
        await this.saveAccount(account, this.reconcileOptions(options, await this.defaultOnDiskOptions()));
    }

    async getDontShowIdentitiesCurrentTab(options?: StorageOptions): Promise<boolean> {
        return (await this.getAccount(this.reconcileOptions(options, await this.defaultOnDiskOptions())))?.settings?.dontShowIdentitiesCurrentTab ?? false;
    }

    async setDontShowIdentitiesCurrentTab(value: boolean, options?: StorageOptions): Promise<void> {
        const account = await this.getAccount(this.reconcileOptions(options, await this.defaultOnDiskOptions()));
        account.settings.dontShowIdentitiesCurrentTab = value;
        await this.saveAccount(account, this.reconcileOptions(options, await this.defaultOnDiskOptions()));
    }

    async getEmail(options?: StorageOptions): Promise<string> {
        return (await this.getAccount(this.reconcileOptions(options, await this.defaultOnDiskOptions())))?.profile?.email;
    }

    async setEmail(value: string, options?: StorageOptions): Promise<void> {
        const account = await this.getAccount(this.reconcileOptions(options, await this.defaultOnDiskOptions()));
        account.profile.email = value;
        await this.saveAccount(account, this.reconcileOptions(options, await this.defaultOnDiskOptions()));
    }

    async getEmailVerified(options?: StorageOptions): Promise<boolean> {
        return (await this.getAccount(this.reconcileOptions(options, await this.defaultOnDiskOptions())))?.profile.emailVerified ?? false;
    }

    async setEmailVerified(value: boolean, options?: StorageOptions): Promise<void> {
        const account = await this.getAccount(this.reconcileOptions(options, await this.defaultOnDiskOptions()));
        account.profile.emailVerified = value;
        await this.saveAccount(account, this.reconcileOptions(options, await this.defaultOnDiskOptions()));
    }

    async getEnableAlwaysOnTop(options?: StorageOptions): Promise<boolean> {
        const accountPreference = (await this.getAccount(this.reconcileOptions(options, await this.defaultOnDiskOptions())))?.settings?.enableAlwaysOnTop;
        const globalPreference = (await this.getGlobals(this.reconcileOptions(options, await this.defaultOnDiskOptions())))?.enableAlwaysOnTop;
        return accountPreference ?? globalPreference ?? false;
    }

    async setEnableAlwaysOnTop(value: boolean, options?: StorageOptions): Promise<void> {
        const account = await this.getAccount(this.reconcileOptions(options, await this.defaultOnDiskOptions()));
        account.settings.enableAlwaysOnTop = value;
        await this.saveAccount(account, this.reconcileOptions(options, await this.defaultOnDiskOptions()));

        const globals = await this.getGlobals(this.reconcileOptions(options, await this.defaultOnDiskOptions()));
        globals.enableAlwaysOnTop = value;
        await this.saveGlobals(globals, this.reconcileOptions(options, await this.defaultOnDiskOptions()));
    }

    async getEnableAutoFillOnPageLoad(options?: StorageOptions): Promise<boolean> {
        return (await this.getAccount(this.reconcileOptions(options, await this.defaultOnDiskOptions())))?.settings?.enableAutoFillOnPageLoad ?? false;
    }

    async setEnableAutoFillOnPageLoad(value: boolean, options?: StorageOptions): Promise<void> {
        const account = await this.getAccount(this.reconcileOptions(options, await this.defaultOnDiskOptions()));
        account.settings.enableAutoFillOnPageLoad = value;
        await this.saveAccount(account, this.reconcileOptions(options, await this.defaultOnDiskOptions()));
    }

    async getEnableBiometric(options?: StorageOptions): Promise<boolean> {
        return (await this.getGlobals(this.reconcileOptions(options, await this.defaultOnDiskOptions())))?.enableBiometrics ?? false;
    }

    async setEnableBiometric(value: boolean, options?: StorageOptions): Promise<void> {
        const globals = await this.getGlobals(this.reconcileOptions(options, await this.defaultOnDiskOptions()));
        globals.enableBiometrics = value;
        await this.saveGlobals(globals, this.reconcileOptions(options, await this.defaultOnDiskOptions()));
    }

    async getEnableBrowserIntegration(options?: StorageOptions): Promise<boolean> {
        return (await this.getAccount(this.reconcileOptions(options, await this.defaultOnDiskOptions())))?.settings?.enableBrowserIntegration ?? false;
    }

    async setEnableBrowserIntegration(value: boolean, options?: StorageOptions): Promise<void> {
        const account = await this.getAccount(this.reconcileOptions(options, await this.defaultOnDiskOptions()));
        account.settings.enableBrowserIntegration = value;
        await this.saveAccount(account, this.reconcileOptions(options, await this.defaultOnDiskOptions()));
    }

    async getEnableBrowserIntegrationFingerprint(options?: StorageOptions): Promise<boolean> {
        return (await this.getAccount(this.reconcileOptions(options, await this.defaultOnDiskOptions())))?.settings?.enableBrowserIntegrationFingerprint ?? false;
    }

    async setEnableBrowserIntegrationFingerprint(value: boolean, options?: StorageOptions): Promise<void> {
        const account = await this.getAccount(this.reconcileOptions(options, await this.defaultOnDiskOptions()));
        account.settings.enableBrowserIntegrationFingerprint = value;
        await this.saveAccount(account, this.reconcileOptions(options, await this.defaultOnDiskOptions()));
    }

    async getEnableCloseToTray(options?: StorageOptions): Promise<boolean> {
        return (await this.getAccount(this.reconcileOptions(options, await this.defaultOnDiskOptions())))?.settings?.enableCloseToTray ?? false;
    }

    async setEnableCloseToTray(value: boolean, options?: StorageOptions): Promise<void> {
        const account = await this.getAccount(this.reconcileOptions(options, await this.defaultOnDiskOptions()));
        account.settings.enableCloseToTray = value;
        await this.saveAccount(account, this.reconcileOptions(options, await this.defaultOnDiskOptions()));
    }

    async getEnableFullWidth(options?: StorageOptions): Promise<boolean> {
        return (await this.getAccount(this.reconcileOptions(options, await this.defaultOnDiskLocalOptions())))?.settings?.enableFullWidth ?? false;
    }

    async setEnableFullWidth(value: boolean, options?: StorageOptions): Promise<void> {
        const account = await this.getAccount(this.reconcileOptions(options, await this.defaultOnDiskLocalOptions()));
        account.settings.enableFullWidth = value;
        await this.saveAccount(account, this.reconcileOptions(options, await this.defaultOnDiskLocalOptions()));
    }

    async getEnableGravitars(options?: StorageOptions): Promise<boolean> {
        return (await this.getAccount(this.reconcileOptions(options, await this.defaultOnDiskLocalOptions())))?.settings?.enableGravitars ?? false;
    }

    async setEnableGravitars(value: boolean, options?: StorageOptions): Promise<void> {
        const account = await this.getAccount(this.reconcileOptions(options, await this.defaultOnDiskLocalOptions()));
        account.settings.enableGravitars = value;
        await this.saveAccount(account, this.reconcileOptions(options, await this.defaultOnDiskLocalOptions()));
    }

    async getEnableMinimizeToTray(options?: StorageOptions): Promise<boolean> {
        return (await this.getAccount(this.reconcileOptions(options, await this.defaultOnDiskOptions())))?.settings?.enableMinimizeToTray ?? false;
    }

    async setEnableMinimizeToTray(value: boolean, options?: StorageOptions): Promise<void> {
        const account = await this.getAccount(this.reconcileOptions(options, await this.defaultOnDiskOptions()));
        account.settings.enableMinimizeToTray = value;
        await this.saveAccount(account, this.reconcileOptions(options, await this.defaultOnDiskOptions()));
    }

    async getEnableStartToTray(options?: StorageOptions): Promise<boolean> {
        return (await this.getAccount(this.reconcileOptions(options, await this.defaultOnDiskOptions())))?.settings.enableStartToTray ?? false;
    }

    async setEnableStartToTray(value: boolean, options?: StorageOptions): Promise<void> {
        const account = await this.getAccount(this.reconcileOptions(options, await this.defaultOnDiskOptions()));
        account.settings.enableStartToTray = value;
        await this.saveAccount(account, this.reconcileOptions(options, await this.defaultOnDiskOptions()));
    }

    async getEnableTray(options?: StorageOptions): Promise<boolean> {
        return (await this.getAccount(this.reconcileOptions(options, await this.defaultOnDiskOptions())))?.settings?.enableTray ?? false;
    }

    async setEnableTray(value: boolean, options?: StorageOptions): Promise<void> {
        const account = await this.getAccount(this.reconcileOptions(options, await this.defaultOnDiskOptions()));
        account.settings.enableTray = value;
        await this.saveAccount(account, this.reconcileOptions(options, await this.defaultOnDiskOptions()));
    }

    async getEncryptedCiphers(options?: StorageOptions): Promise<{ [id: string]: CipherData; }> {
        return (await this.getAccount(this.reconcileOptions(options, await this.defaultOnDiskMemoryOptions())))?.data?.ciphers?.encrypted;
    }

    async setEncryptedCiphers(value: { [id: string]: CipherData; }, options?: StorageOptions): Promise<void> {
        const account = await this.getAccount(this.reconcileOptions(options, await this.defaultOnDiskMemoryOptions()));
        account.data.ciphers.encrypted = value;
        await this.saveAccount(account, this.reconcileOptions(options, await this.defaultOnDiskMemoryOptions()));
    }

    async getEncryptedCollections(options?: StorageOptions): Promise<{ [id: string]: CollectionData; }> {
        return (await this.getAccount(this.reconcileOptions(options, await this.defaultOnDiskMemoryOptions())))?.data?.collections?.encrypted;
    }

    async setEncryptedCollections(value: { [id: string]: CollectionData; }, options?: StorageOptions): Promise<void> {
        const account = await this.getAccount(this.reconcileOptions(options, await this.defaultOnDiskMemoryOptions()));
        account.data.collections.encrypted = value;
        await this.saveAccount(account, this.reconcileOptions(options, await this.defaultOnDiskMemoryOptions()));
    }

    async getEncryptedCryptoSymmetricKey(options?: StorageOptions): Promise<string> {
        return (await this.getAccount(this.reconcileOptions(options, await this.defaultOnDiskOptions())))?.keys.cryptoSymmetricKey.encrypted;
    }

    async setEncryptedCryptoSymmetricKey(value: string, options?: StorageOptions): Promise<void> {
        const account = await this.getAccount(this.reconcileOptions(options, await this.defaultOnDiskOptions()));
        account.keys.cryptoSymmetricKey.encrypted = value;
        await this.saveAccount(account, this.reconcileOptions(options, await this.defaultOnDiskOptions()));
    }

    async getEncryptedFolders(options?: StorageOptions): Promise<{ [id: string]: FolderData; }> {
        return (await this.getAccount(this.reconcileOptions(options, await this.defaultOnDiskMemoryOptions())))?.data?.folders?.encrypted;
    }

    async setEncryptedFolders(value: { [id: string]: FolderData; }, options?: StorageOptions): Promise<void> {
        const account = await this.getAccount(this.reconcileOptions(options, await this.defaultOnDiskMemoryOptions()));
        account.data.folders.encrypted = value;
        await this.saveAccount(account, this.reconcileOptions(options, await this.defaultOnDiskMemoryOptions()));
    }

    async getEncryptedOrganizationKeys(options?: StorageOptions): Promise<any> {
        return (await this.getAccount(this.reconcileOptions(options, await this.defaultOnDiskOptions())))?.keys?.organizationKeys.encrypted;
    }

    async setEncryptedOrganizationKeys(value: Map<string, SymmetricCryptoKey>, options?: StorageOptions): Promise<void> {
        const account = await this.getAccount(this.reconcileOptions(options, await this.defaultOnDiskOptions()));
        account.keys.organizationKeys.encrypted = value;
        await this.saveAccount(account, this.reconcileOptions(options, await this.defaultOnDiskOptions()));
    }

    async getEncryptedPasswordGenerationHistory(options?: StorageOptions): Promise<GeneratedPasswordHistory[]> {
        return (await this.getAccount(this.reconcileOptions(options, await this.defaultOnDiskOptions())))?.data?.passwordGenerationHistory?.encrypted;
    }

    async setEncryptedPasswordGenerationHistory(value: GeneratedPasswordHistory[], options?: StorageOptions): Promise<void> {
        const account = await this.getAccount(this.reconcileOptions(options, await this.defaultOnDiskOptions()));
        account.data.passwordGenerationHistory.encrypted = value;
        await this.saveAccount(account, this.reconcileOptions(options, await this.defaultOnDiskOptions()));
    }

    async getEncryptedPinProtected(options?: StorageOptions): Promise<string> {
        return (await this.getAccount(this.reconcileOptions(options, await this.defaultOnDiskOptions())))?.settings?.pinProtected?.encrypted;
    }

    async setEncryptedPinProtected(value: string, options?: StorageOptions): Promise<void> {
        const account = await this.getAccount(this.reconcileOptions(options, await this.defaultOnDiskOptions()));
        account.settings.pinProtected.encrypted = value;
        await this.saveAccount(account, this.reconcileOptions(options, await this.defaultOnDiskOptions()));
    }

    async getEncryptedPolicies(options?: StorageOptions): Promise<{ [id: string]: PolicyData; }> {
        return (await this.getAccount(this.reconcileOptions(options, await this.defaultOnDiskOptions())))?.data?.policies?.encrypted;
    }

    async setEncryptedPolicies(value: { [id: string]: PolicyData; }, options?: StorageOptions): Promise<void> {
        const account = await this.getAccount(this.reconcileOptions(options, await this.defaultOnDiskOptions()));
        account.data.policies.encrypted = value;
        await this.saveAccount(account, this.reconcileOptions(options, await this.defaultOnDiskOptions()));
    }

    async getEncryptedPrivateKey(options?: StorageOptions): Promise<string> {
        return (await this.getAccount(this.reconcileOptions(options, await this.defaultOnDiskOptions())))?.keys?.privateKey?.encrypted;
    }

    async setEncryptedPrivateKey(value: string, options?: StorageOptions): Promise<void> {
        const account = await this.getAccount(this.reconcileOptions(options, await this.defaultOnDiskOptions()));
        account.keys.privateKey.encrypted = value;
        await this.saveAccount(account, this.reconcileOptions(options, await this.defaultOnDiskOptions()));
    }

    async getEncryptedProviderKeys(options?: StorageOptions): Promise<any> {
        return (await this.getAccount(this.reconcileOptions(options, await this.defaultOnDiskOptions())))?.keys?.providerKeys?.encrypted;
    }

    async setEncryptedProviderKeys(value: any, options?: StorageOptions): Promise<void> {
        const account = await this.getAccount(this.reconcileOptions(options, await this.defaultOnDiskOptions()));
        account.keys.providerKeys.encrypted = value;
        await this.saveAccount(account, this.reconcileOptions(options, await this.defaultOnDiskOptions()));
    }

    async getEncryptedSends(options?: StorageOptions): Promise<{ [id: string]: SendData; }> {
        return (await this.getAccount(this.reconcileOptions(options, await this.defaultOnDiskMemoryOptions())))?.data?.sends.encrypted;
    }

    async setEncryptedSends(value: { [id: string]: SendData; }, options?: StorageOptions): Promise<void> {
        const account = await this.getAccount(this.reconcileOptions(options, await this.defaultOnDiskMemoryOptions()));
        account.data.sends.encrypted = value;
        await this.saveAccount(account, this.reconcileOptions(options, await this.defaultOnDiskMemoryOptions()));
    }

    async getEntityId(options?: StorageOptions): Promise<string> {
        return (await this.getAccount(this.reconcileOptions(options, this.defaultInMemoryOptions)))?.profile?.entityId;
    }

    async setEntityId(value: string, options?: StorageOptions): Promise<void> {
        const account = await this.getAccount(this.reconcileOptions(options, this.defaultInMemoryOptions));
        account.profile.entityId = value;
        await this.saveAccount(account, this.reconcileOptions(options, this.defaultInMemoryOptions));
    }

    async getEntityType(options?: StorageOptions): Promise<any> {
        return (await this.getAccount(this.reconcileOptions(options, this.defaultInMemoryOptions)))?.profile?.entityType;
    }

    async setEntityType(value: string, options?: StorageOptions): Promise<void> {
        const account = await this.getAccount(this.reconcileOptions(options, this.defaultInMemoryOptions));
        account.profile.entityType = value;
        await this.saveAccount(account, this.reconcileOptions(options, this.defaultInMemoryOptions));
    }

    async getEnvironmentUrls(options?: StorageOptions): Promise<any> {
        return (await this.getAccount(this.reconcileOptions(options, await this.defaultOnDiskOptions())))?.settings?.environmentUrls ?? {
            server: 'bitwarden.com',
        };
    }

    async setEnvironmentUrls(value: any, options?: StorageOptions): Promise<void> {
        const account = await this.getAccount(this.reconcileOptions(options, await this.defaultOnDiskOptions()));
        account.settings.environmentUrls = value;
        await this.saveAccount(account, this.reconcileOptions(options, await this.defaultOnDiskOptions()));
    }

    async getEquivalentDomains(options?: StorageOptions): Promise<any> {
        return (await this.getAccount(this.reconcileOptions(options, await this.defaultOnDiskOptions())))?.settings?.equivalentDomains;
    }

    async setEquivalentDomains(value: string, options?: StorageOptions): Promise<void> {
        const account = await this.getAccount(this.reconcileOptions(options, await this.defaultOnDiskOptions()));
        account.settings.equivalentDomains = value;
        await this.saveAccount(account, this.reconcileOptions(options, await this.defaultOnDiskOptions()));
    }

    async getEventCollection(options?: StorageOptions): Promise<EventData[]> {
        return (await this.getAccount(this.reconcileOptions(options, await this.defaultOnDiskOptions())))?.data?.eventCollection;
    }

    async setEventCollection(value: EventData[], options?: StorageOptions): Promise<void> {
        const account = await this.getAccount(this.reconcileOptions(options, await this.defaultOnDiskOptions()));
        account.data.eventCollection = value;
        await this.saveAccount(account, this.reconcileOptions(options, await this.defaultOnDiskOptions()));
    }

    async getEverBeenUnlocked(options?: StorageOptions): Promise<boolean> {
        return (await this.getAccount(this.reconcileOptions(options, this.defaultInMemoryOptions)))?.profile?.everBeenUnlocked ?? false;
    }

    async setEverBeenUnlocked(value: boolean, options?: StorageOptions): Promise<void> {
        const account = await this.getAccount(this.reconcileOptions(options, this.defaultInMemoryOptions));
        account.profile.everBeenUnlocked = value;
        await this.saveAccount(account, this.reconcileOptions(options, this.defaultInMemoryOptions));
    }

    async getForcePasswordReset(options?: StorageOptions): Promise<boolean> {
        return (await this.getAccount(this.reconcileOptions(options, this.defaultInMemoryOptions)))?.profile?.forcePasswordReset ?? false;
    }

    async setForcePasswordReset(value: boolean, options?: StorageOptions): Promise<void> {
        const account = await this.getAccount(this.reconcileOptions(options, this.defaultInMemoryOptions));
        account.profile.forcePasswordReset = value;
        await this.saveAccount(account, this.reconcileOptions(options, this.defaultInMemoryOptions));
    }

    async getInstalledVersion(options?: StorageOptions): Promise<string> {
        return (await this.getGlobals(this.reconcileOptions(options, await this.defaultOnDiskOptions())))?.installedVersion;
    }

    async setInstalledVersion(value: string, options?: StorageOptions): Promise<void> {
        const globals = await this.getGlobals(this.reconcileOptions(options, await this.defaultOnDiskOptions()));
        globals.installedVersion = value;
        await this.saveGlobals(globals, this.reconcileOptions(options, await this.defaultOnDiskOptions()));
    }

    async getIsAuthenticated(options?: StorageOptions): Promise<boolean> {
        return await this.getAccessToken(options) != null && await this.getUserId(options) != null;
    }

    async getKdfIterations(options?: StorageOptions): Promise<number> {
        return (await this.getAccount(this.reconcileOptions(options, await this.defaultOnDiskOptions())))?.profile?.kdfIterations;
    }

    async setKdfIterations(value: number, options?: StorageOptions): Promise<void> {
        const account = await this.getAccount(this.reconcileOptions(options, await this.defaultOnDiskOptions()));
        account.profile.kdfIterations = value;
        await this.saveAccount(account, this.reconcileOptions(options, await this.defaultOnDiskOptions()));
    }

    async getKdfType(options?: StorageOptions): Promise<KdfType> {
        return (await this.getAccount(this.reconcileOptions(options, await this.defaultOnDiskOptions())))?.profile?.kdfType;
    }

    async setKdfType(value: KdfType, options?: StorageOptions): Promise<void> {
        const account = await this.getAccount(this.reconcileOptions(options, await this.defaultOnDiskOptions()));
        account.profile.kdfType = value;
        await this.saveAccount(account, this.reconcileOptions(options, await this.defaultOnDiskOptions()));
    }

    async getKeyHash(options?: StorageOptions): Promise<string> {
        return (await this.getAccount(this.reconcileOptions(options, await this.defaultOnDiskOptions())))?.profile?.keyHash;
    }

    async setKeyHash(value: string, options?: StorageOptions): Promise<void> {
        const account = await this.getAccount(this.reconcileOptions(options, await this.defaultOnDiskOptions()));
        account.profile.keyHash = value;
        await this.saveAccount(account, this.reconcileOptions(options, await this.defaultOnDiskOptions()));
    }

    async getLastActive(options?: StorageOptions): Promise<number> {
        const lastActive = (await this.getAccount(this.reconcileOptions(options, await this.defaultOnDiskOptions())))?.profile?.lastActive;
        return lastActive ?? (await this.getGlobals(this.reconcileOptions(options, await this.defaultOnDiskOptions())))?.lastActive;
    }

    async setLastActive(value: number, options?: StorageOptions): Promise<void> {
        const account = await this.getAccount(this.reconcileOptions(options, await this.defaultOnDiskOptions()));
        if (account != null) {
            account.profile.lastActive = value;
            await this.saveAccount(account, this.reconcileOptions(options, await this.defaultOnDiskOptions()));
        }

        const globals = await this.getGlobals(this.reconcileOptions(options, await this.defaultOnDiskOptions()));
        globals.lastActive = value;
        await this.saveGlobals(globals, this.reconcileOptions(options, await this.defaultOnDiskOptions()));
    }

    async getLastSync(options?: StorageOptions): Promise<string> {
        return (await this.getAccount(this.reconcileOptions(options, await this.defaultOnDiskMemoryOptions())))?.profile?.lastSync;
    }

    async setLastSync(value: string, options?: StorageOptions): Promise<void> {
        const account = await this.getAccount(this.reconcileOptions(options, await this.defaultOnDiskMemoryOptions()));
        account.profile.lastSync = value;
        await this.saveAccount(account, this.reconcileOptions(options, await this.defaultOnDiskMemoryOptions()));
    }

    async getLegacyEtmKey(options?: StorageOptions): Promise<SymmetricCryptoKey> {
        return (await this.getAccount(this.reconcileOptions(options, await this.defaultOnDiskOptions())))?.keys?.legacyEtmKey;
    }

    async setLegacyEtmKey(value: SymmetricCryptoKey, options?: StorageOptions): Promise<void> {
        const account = await this.getAccount(this.reconcileOptions(options, await this.defaultOnDiskOptions()));
        account.keys.legacyEtmKey = value;
        await this.saveAccount(account, this.reconcileOptions(options, await this.defaultOnDiskOptions()));
    }

    async getLocalData(options?: StorageOptions): Promise<any> {
        return (await this.getAccount(this.reconcileOptions(options, this.defaultInMemoryOptions)))?.data?.localData;
    }

    async setLocalData(value: string, options?: StorageOptions): Promise<void> {
        const account = await this.getAccount(this.reconcileOptions(options, this.defaultInMemoryOptions));
        account.data.localData = value;
        await this.saveAccount(account, this.reconcileOptions(options, this.defaultInMemoryOptions));
    }

    async getLocale(options?: StorageOptions): Promise<string> {
        return (await this.getGlobals(this.reconcileOptions(options, await this.defaultOnDiskLocalOptions())))?.locale;
    }

    async setLocale(value: string, options?: StorageOptions): Promise<void> {
        const globals = await this.getGlobals(this.reconcileOptions(options, await this.defaultOnDiskLocalOptions()));
        globals.locale = value;
        await this.saveGlobals(globals, this.reconcileOptions(options, await this.defaultOnDiskLocalOptions()));
    }

    async getLoginRedirect(options?: StorageOptions): Promise<any> {
        return (await this.getGlobals(this.reconcileOptions(options, this.defaultInMemoryOptions)))?.loginRedirect;
    }

    async setLoginRedirect(value: any, options?: StorageOptions): Promise<void> {
        const globals = await this.getGlobals(this.reconcileOptions(options, this.defaultInMemoryOptions));
        globals.loginRedirect = value;
        await this.saveGlobals(globals, this.reconcileOptions(options, this.defaultInMemoryOptions));
    }

    async getMainWindowSize(options?: StorageOptions): Promise<number> {
        return (await this.getGlobals(this.reconcileOptions(options, this.defaultInMemoryOptions)))?.mainWindowSize;
    }

    async setMainWindowSize(value: number, options?: StorageOptions): Promise<void> {
        const globals = await this.getGlobals(this.reconcileOptions(options, this.defaultInMemoryOptions));
        globals.mainWindowSize = value;
        await this.saveGlobals(globals, this.reconcileOptions(options, this.defaultInMemoryOptions));
    }

    async getMinimizeOnCopyToClipboard(options?: StorageOptions): Promise<boolean> {
        return (await this.getAccount(this.reconcileOptions(options, await this.defaultOnDiskOptions())))?.settings?.minimizeOnCopyToClipboard ?? false;
    }

    async setMinimizeOnCopyToClipboard(value: boolean, options?: StorageOptions): Promise<void> {
        const account = await this.getAccount(this.reconcileOptions(options, await this.defaultOnDiskOptions()));
        account.settings.minimizeOnCopyToClipboard = value;
        await this.saveAccount(account, this.reconcileOptions(options, await this.defaultOnDiskOptions()));
    }

    async getNeverDomains(options?: StorageOptions): Promise<{ [id: string]: any; }> {
        return (await this.getAccount(this.reconcileOptions(options, await this.defaultOnDiskOptions())))?.settings?.neverDomains;
    }

    async setNeverDomains(value: { [id: string]: any; }, options?: StorageOptions): Promise<void> {
        const account = await this.getAccount(this.reconcileOptions(options, await this.defaultOnDiskOptions()));
        account.settings.neverDomains = value;
        await this.saveAccount(account, this.reconcileOptions(options, await this.defaultOnDiskOptions()));
    }

    async getNoAutoPromptBiometrics(options?: StorageOptions): Promise<boolean> {
        return (await this.getGlobals(this.reconcileOptions(options, await this.defaultOnDiskOptions())))?.noAutoPromptBiometrics ?? false;
    }

    async setNoAutoPromptBiometrics(value: boolean, options?: StorageOptions): Promise<void> {
        const globals = await this.getGlobals(this.reconcileOptions(options, await this.defaultOnDiskOptions()));
        globals.noAutoPromptBiometrics = value;
        await this.saveGlobals(globals, this.reconcileOptions(options, await this.defaultOnDiskOptions()));
    }

    async getNoAutoPromptBiometricsText(options?: StorageOptions): Promise<string> {
        return (await this.getGlobals(this.reconcileOptions(options, await this.defaultOnDiskOptions())))?.noAutoPromptBiometricsText;
    }

    async setNoAutoPromptBiometricsText(value: string, options?: StorageOptions): Promise<void> {
        const globals = await this.getGlobals(this.reconcileOptions(options, await this.defaultOnDiskOptions()));
        globals.noAutoPromptBiometricsText = value;
        await this.saveGlobals(globals, this.reconcileOptions(options, await this.defaultOnDiskOptions()));
    }

    async getOpenAtLogin(options?: StorageOptions): Promise<boolean> {
        return (await this.getGlobals(this.reconcileOptions(options, await this.defaultOnDiskOptions())))?.openAtLogin ?? false;
    }

    async setOpenAtLogin(value: boolean, options?: StorageOptions): Promise<void> {
        const globals = await this.getGlobals(this.reconcileOptions(options, await this.defaultOnDiskOptions()));
        globals.openAtLogin = value;
        await this.saveGlobals(globals, this.reconcileOptions(options, await this.defaultOnDiskOptions()));
    }

    async getOrganizationInvitation(options?: StorageOptions): Promise<any> {
        return (await this.getGlobals(this.reconcileOptions(options, this.defaultInMemoryOptions)))?.organizationInvitation;
    }

    async setOrganizationInvitation(value: any, options?: StorageOptions): Promise<void> {
        const globals = await this.getGlobals(this.reconcileOptions(options, this.defaultInMemoryOptions));
        globals.organizationInvitation = value;
        await this.saveGlobals(globals, this.reconcileOptions(options, this.defaultInMemoryOptions));
    }

    async getOrganizations(options?: StorageOptions): Promise<{ [id: string]: OrganizationData; }> {
        return (await this.getAccount(this.reconcileOptions(options, await this.defaultOnDiskOptions())))?.data?.organizations;
    }

    async setOrganizations(value: { [id: string]: OrganizationData; }, options?: StorageOptions): Promise<void> {
        const account = await this.getAccount(this.reconcileOptions(options, await this.defaultOnDiskOptions()));
        account.data.organizations = value;
        await this.saveAccount(account, this.reconcileOptions(options, await this.defaultOnDiskOptions()));
    }

    async getPasswordGenerationOptions(options?: StorageOptions): Promise<any> {
        return (await this.getAccount(this.reconcileOptions(options, await this.defaultOnDiskOptions())))?.settings?.passwordGenerationOptions;
    }

    async setPasswordGenerationOptions(value: any, options?: StorageOptions): Promise<void> {
        const account = await this.getAccount(this.reconcileOptions(options, await this.defaultOnDiskOptions()));
        account.settings.passwordGenerationOptions = value;
        await this.saveAccount(account, this.reconcileOptions(options, await this.defaultOnDiskOptions()));
    }

    async getProtectedPin(options?: StorageOptions): Promise<string> {
        return (await this.getAccount(this.reconcileOptions(options, await this.defaultOnDiskOptions())))?.settings?.protectedPin;
    }

    async setProtectedPin(value: string, options?: StorageOptions): Promise<void> {
        const account = await this.getAccount(this.reconcileOptions(options, await this.defaultOnDiskOptions()));
        account.settings.protectedPin = value;
        await this.saveAccount(account, this.reconcileOptions(options, await this.defaultOnDiskOptions()));
    }

    async getProviders(options?: StorageOptions): Promise<{ [id: string]: ProviderData; }> {
        return (await this.getAccount(this.reconcileOptions(options, this.defaultInMemoryOptions)))?.data?.providers;
    }

    async setProviders(value: { [id: string]: ProviderData; }, options?: StorageOptions): Promise<void> {
        const account = await this.getAccount(this.reconcileOptions(options, this.defaultInMemoryOptions));
        account.data.providers = value;
        await this.saveAccount(account, this.reconcileOptions(options, this.defaultInMemoryOptions));
    }

    async getPublicKey(options?: StorageOptions): Promise<ArrayBuffer> {
        return (await this.getAccount(this.reconcileOptions(options, this.defaultInMemoryOptions)))?.keys?.publicKey;
    }

    async setPublicKey(value: ArrayBuffer, options?: StorageOptions): Promise<void> {
        const account = await this.getAccount(this.reconcileOptions(options, this.defaultInMemoryOptions));
        account.keys.publicKey = value;
        await this.saveAccount(account, this.reconcileOptions(options, this.defaultInMemoryOptions));
    }

    async getRefreshToken(options?: StorageOptions): Promise<string> {
        return (await this.getAccount(this.reconcileOptions(options, await this.defaultOnDiskOptions())))?.tokens?.refreshToken;
    }

    async setRefreshToken(value: string, options?: StorageOptions): Promise<void> {
        const account = await this.getAccount(this.reconcileOptions(options, await this.defaultOnDiskOptions()));
        account.tokens.refreshToken = value;
        await this.saveAccount(account, this.reconcileOptions(options, await this.defaultOnDiskOptions()));
    }

    async getRememberedEmail(options?: StorageOptions): Promise<string> {
        return (await this.getGlobals(this.reconcileOptions(options, await this.defaultOnDiskLocalOptions())))?.rememberedEmail;
    }

    async setRememberedEmail(value: string, options?: StorageOptions): Promise<void> {
        const globals = await this.getGlobals(this.reconcileOptions(options, await this.defaultOnDiskLocalOptions()));
        globals.rememberedEmail = value;
        await this.saveGlobals(globals, this.reconcileOptions(options, await this.defaultOnDiskLocalOptions()));
    }

    async getSecurityStamp(options?: StorageOptions): Promise<string> {
        return (await this.getAccount(this.reconcileOptions(options, this.defaultInMemoryOptions)))?.tokens?.securityStamp;
    }

    async setSecurityStamp(value: string, options?: StorageOptions): Promise<void> {
        const account = await this.getAccount(this.reconcileOptions(options, this.defaultInMemoryOptions));
        account.tokens.securityStamp = value;
        await this.saveAccount(account, this.reconcileOptions(options, this.defaultInMemoryOptions));
    }

    async getSettings(options?: StorageOptions): Promise<any> {
        return (await this.getAccount(this.reconcileOptions(options, await this.defaultOnDiskMemoryOptions())))?.settings?.settings;
    }

    async setSettings(value: string, options?: StorageOptions): Promise<void> {
        const account = await this.getAccount(this.reconcileOptions(options, await this.defaultOnDiskMemoryOptions()));
        account.settings.settings = value;
        await this.saveAccount(account, this.reconcileOptions(options, await this.defaultOnDiskMemoryOptions()));
    }

    async getSsoCodeVerifier(options?: StorageOptions): Promise<string> {
        return (await this.getAccount(this.reconcileOptions(options, this.defaultInMemoryOptions)))?.profile?.ssoCodeVerifier;
    }

    async setSsoCodeVerifier(value: string, options?: StorageOptions): Promise<void> {
        const account = await this.getAccount(this.reconcileOptions(options, this.defaultInMemoryOptions));
        account.profile.ssoCodeVerifier = value;
        await this.saveAccount(account, this.reconcileOptions(options, this.defaultInMemoryOptions));
    }

    async getSsoOrgIdentifier(options?: StorageOptions): Promise<string> {
        return (await this.getAccount(this.reconcileOptions(options, await this.defaultOnDiskLocalOptions())))?.profile?.ssoOrganizationIdentifier;
    }

    async setSsoOrganizationIdentifier(value: string, options?: StorageOptions): Promise<void> {
        const account = await this.getAccount(this.reconcileOptions(options, await this.defaultOnDiskLocalOptions()));
        account.profile.ssoOrganizationIdentifier = value;
        await this.saveAccount(account, this.reconcileOptions(options, await this.defaultOnDiskLocalOptions()));
    }

    async getSsoState(options?: StorageOptions): Promise<string> {
        return (await this.getAccount(this.reconcileOptions(options, this.defaultInMemoryOptions)))?.profile?.ssoState;
    }

    async setSsoState(value: string, options?: StorageOptions): Promise<void> {
        const account = await this.getAccount(this.reconcileOptions(options, this.defaultInMemoryOptions));
        account.profile.ssoState = value;
        await this.saveAccount(account, this.reconcileOptions(options, this.defaultInMemoryOptions));
    }

    async getTheme(options?: StorageOptions): Promise<string> {
        return (await this.getGlobals(this.reconcileOptions(options, await this.defaultOnDiskLocalOptions())))?.theme;
    }

    async setTheme(value: string, options?: StorageOptions): Promise<void> {
        const globals = await this.getGlobals(this.reconcileOptions(options, await this.defaultOnDiskLocalOptions()));
        globals.theme = value;
        await this.saveGlobals(globals, this.reconcileOptions(options, await this.defaultOnDiskLocalOptions()));
    }

    async getTwoFactorToken(options?: StorageOptions): Promise<string> {
        return (await this.getGlobals(this.reconcileOptions(options, await this.defaultOnDiskLocalOptions())))?.twoFactorToken;
    }

    async setTwoFactorToken(value: string, options?: StorageOptions): Promise<void> {
        const globals = await this.getGlobals(this.reconcileOptions(options, await this.defaultOnDiskLocalOptions()));
        globals.twoFactorToken = value;
        await this.saveGlobals(globals, this.reconcileOptions(options, await this.defaultOnDiskLocalOptions()));
    }

    async getUserId(options?: StorageOptions): Promise<string> {
        return (await this.getAccount(this.reconcileOptions(options, await this.defaultOnDiskOptions())))?.profile?.userId;
    }

    async getUsesKeyConnector(options?: StorageOptions): Promise<boolean> {
        return (await this.getAccount(this.reconcileOptions(options, this.defaultInMemoryOptions)))?.profile?.usesKeyConnector;
    }

    async setUsesKeyConnector(value: boolean, options?: StorageOptions): Promise<void> {
        const account = await this.getAccount(this.reconcileOptions(options, this.defaultInMemoryOptions));
        account.profile.usesKeyConnector = value;
        await this.saveAccount(account, this.reconcileOptions(options, this.defaultInMemoryOptions));
    }

    async getVaultTimeout(options?: StorageOptions): Promise<number> {
        const accountVaultTimeout = (await this.getAccount(this.reconcileOptions(options, await this.defaultOnDiskLocalOptions())))?.settings?.vaultTimeout;
        const globalVaultTimeout = (await this.getGlobals(this.reconcileOptions(options, await this.defaultOnDiskLocalOptions())))?.vaultTimeout;
        return accountVaultTimeout ?? globalVaultTimeout ?? 15;
    }

    async setVaultTimeout(value: number, options?: StorageOptions): Promise<void> {
        const account = await this.getAccount(this.reconcileOptions(options, await this.defaultOnDiskLocalOptions()));
        account.settings.vaultTimeout = value;
        await this.saveAccount(account, this.reconcileOptions(options, await this.defaultOnDiskLocalOptions()));
    }

    async getVaultTimeoutAction(options?: StorageOptions): Promise<string> {
        const accountVaultTimeoutAction = (await this.getAccount(this.reconcileOptions(options, await this.defaultOnDiskLocalOptions())))?.settings?.vaultTimeoutAction;
        const globalVaultTimeoutAction = (await this.getGlobals(this.reconcileOptions(options, await this.defaultOnDiskLocalOptions())))?.vaultTimeoutAction;
        return accountVaultTimeoutAction ?? globalVaultTimeoutAction;
    }

    async setVaultTimeoutAction(value: string, options?: StorageOptions): Promise<void> {
        const account = await this.getAccount(this.reconcileOptions(options, await this.defaultOnDiskLocalOptions()));
        account.settings.vaultTimeoutAction = value;
        await this.saveAccount(account, this.reconcileOptions(options, await this.defaultOnDiskLocalOptions()));
    }

    async getStateVersion(): Promise<number> {
        return (await this.getGlobals(await this.defaultOnDiskLocalOptions())).stateVersion ?? 1;
    }

    async setStateVersion(value: number): Promise<void> {
        const globals = await this.getGlobals(await this.defaultOnDiskOptions());
        globals.stateVersion = value;
        await this.saveGlobals(globals, await this.defaultOnDiskOptions());
    }

    async getWindow(): Promise<Map<string, any>> {
        const globals = await this.getGlobals(await this.defaultOnDiskOptions());
        return globals?.window != null && Object.keys(globals.window).length > 0 ?
            globals.window :
            new Map<string, any>();
    }

    async setWindow(value: Map<string, any>, options?: StorageOptions): Promise<void> {
        const globals = await this.getGlobals(this.reconcileOptions(options, await this.defaultOnDiskOptions()));
        globals.window = value;
        return await this.saveGlobals(globals, this.reconcileOptions(options, await this.defaultOnDiskOptions()));
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

    private async saveGlobals(globals: GlobalState, options: StorageOptions) {
        return this.useMemory(options.storageLocation) ?
            this.saveGlobalsToMemory(globals) :
            await this.saveGlobalsToDisk(globals, options);
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
            await this.saveStateToStorage(state, options);
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

            return account != null ?
                new Account(account) :
                null;
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
            this.state.accounts[options.userId]?.profile?.userId :
            this.state.activeUserId;
    }

    private async getAccountFromDisk(options: StorageOptions): Promise<Account> {
        if (options?.userId == null && this.state.activeUserId == null) {
            return null;
        }

        const state = options?.useSecureStorage ?
            await this.secureStorageService.get<State>('state', options) ??
            await this.storageService.get<State>('state', this.reconcileOptions(options, { htmlStorageLocation: HtmlStorageLocation.Local })) :
            await this.storageService.get<State>('state', options);

        return state?.accounts[options?.userId ?? this.state.activeUserId];
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

        const state = await storageLocation.get<State>('state', options) ?? new State();
        state.accounts[account.profile.userId] = account;

        await storageLocation.save('state', state, options);
        await this.pushAccounts();
    }

    private async saveAccountToMemory(account: Account): Promise<void> {
        if (this.getAccountFromMemory({ userId: account.profile.userId }) !== null) {
            this.state.accounts[account.profile.userId] = account;
        }
        await this.pushAccounts();
    }

    private async scaffoldNewAccountStorage(account: Account): Promise<void> {
        await this.scaffoldNewAccountLocalStorage(account);
        await this.scaffoldNewAccountSessionStorage(account);
        await this.scaffoldNewAccountMemoryStorage(account);
    }

    private async scaffoldNewAccountLocalStorage(account: Account): Promise<void> {
        const storedState = await this.storageService.get<State>('state', await this.defaultOnDiskLocalOptions()) ?? new State();
        const storedAccount = storedState.accounts[account.profile.userId];
        if (storedAccount != null) {
            account = {
                settings: storedAccount.settings,
                profile: account.profile,
                tokens: account.tokens,
                keys: account.keys,
                data: account.data,
            };
        }
        storedState.accounts[account.profile.userId] = account;
        await this.saveStateToStorage(storedState, await this.defaultOnDiskLocalOptions());
    }

    private async scaffoldNewAccountMemoryStorage(account: Account): Promise<void> {
        const storedState = await this.storageService.get<State>('state', await this.defaultOnDiskMemoryOptions()) ?? new State();
        const storedAccount = storedState.accounts[account.profile.userId];
        if (storedAccount != null) {
            account = {
                settings: storedAccount.settings,
                profile: account.profile,
                tokens: account.tokens,
                keys: account.keys,
                data: account.data,
            };
        }
        storedState.accounts[account.profile.userId] = account;
        await this.saveStateToStorage(storedState, await this.defaultOnDiskMemoryOptions());
    }

    private async scaffoldNewAccountSessionStorage(account: Account): Promise<void> {
        const storedState = await this.storageService.get<State>('state', await this.defaultOnDiskOptions()) ?? new State();
        const storedAccount = storedState.accounts[account.profile.userId];
        if (storedAccount != null) {
            account = {
                settings: storedAccount.settings,
                profile: account.profile,
                tokens: account.tokens,
                keys: account.keys,
                data: account.data,
            };
        }
        storedState.accounts[account.profile.userId] = account;
        await this.saveStateToStorage(storedState, await this.defaultOnDiskOptions());
    }

    private async pushAccounts(): Promise<void> {
        await this.pruneInMemoryAccounts();
        if (this.state?.accounts == null || Object.keys(this.state.accounts).length < 1) {
            this.accounts.next(null);
            return;
        }

        this.accounts.next(this.state.accounts);
    }

    private reconcileOptions(requestedOptions: StorageOptions, defaultOptions: StorageOptions): StorageOptions {
        if (requestedOptions == null) {
            return defaultOptions;
        }
        requestedOptions.userId = requestedOptions?.userId ?? defaultOptions.userId;
        requestedOptions.storageLocation = requestedOptions?.storageLocation ?? defaultOptions.storageLocation;
        requestedOptions.useSecureStorage = requestedOptions?.useSecureStorage ?? defaultOptions.useSecureStorage;
        requestedOptions.htmlStorageLocation = requestedOptions?.htmlStorageLocation ?? defaultOptions.htmlStorageLocation;
        requestedOptions.keySuffix = requestedOptions?.keySuffix ?? defaultOptions.keySuffix;
        return requestedOptions;
    }

    private get defaultInMemoryOptions(): StorageOptions {
        return { storageLocation: StorageLocation.Memory, userId: this.state.activeUserId };
    }

    private async defaultOnDiskOptions(): Promise<StorageOptions> {
        return {
            storageLocation: StorageLocation.Disk,
            htmlStorageLocation: HtmlStorageLocation.Session,
            userId: await this.getActiveUserIdFromStorage(),
            useSecureStorage: false,
        };
    }

    private async defaultOnDiskLocalOptions(): Promise<StorageOptions> {
        return {
            storageLocation: StorageLocation.Disk,
            htmlStorageLocation: HtmlStorageLocation.Local,
            userId: await this.getActiveUserIdFromStorage(),
            useSecureStorage: false,
        };
    }

    private async defaultOnDiskMemoryOptions(): Promise<StorageOptions> {
        return {
            storageLocation: StorageLocation.Disk,
            htmlStorageLocation: HtmlStorageLocation.Memory,
            userId: await this.getUserId(),
            useSecureStorage: false,
        };
    }

    private async defaultSecureStorageOptions(): Promise<StorageOptions> {
        return {
            storageLocation: StorageLocation.Disk,
            useSecureStorage: true,
            userId: await this.getActiveUserIdFromStorage(),
        };
    }

    private async getActiveUserIdFromStorage(): Promise<string> {
        const state = await this.storageService.get<State>('state');
        return state?.activeUserId;
    }

    private async removeAccountFromLocalStorage(userId: string = this.state.activeUserId): Promise<void> {
        const state = await this.storageService.get<State>('state', { htmlStorageLocation: HtmlStorageLocation.Local });
        if (state?.accounts[userId] == null) {
            return;
        }

        state.accounts[userId] = new Account({
            settings: state.accounts[userId].settings,
        });

        await this.saveStateToStorage(state, await this.defaultOnDiskLocalOptions());
    }

    private async removeAccountFromSessionStorage(userId: string = this.state.activeUserId): Promise<void> {
        const state = await this.storageService.get<State>('state', { htmlStorageLocation: HtmlStorageLocation.Session });
        if (state?.accounts[userId] == null) {
            return;
        }

        state.accounts[userId] = new Account({
            settings: state.accounts[userId].settings,
        });

        await this.saveStateToStorage(state, await this.defaultOnDiskOptions());
    }

    private async removeAccountFromSecureStorage(userId: string = this.state.activeUserId): Promise<void> {
        await this.setCryptoMasterKeyAuto(null, { userId: userId });
        await this.setCryptoMasterKeyBiometric(null, { userId: userId });
        await this.setCryptoMasterKeyB64(null, { userId: userId });
    }

    private removeAccountFromMemory(userId: string = this.state.activeUserId): void {
        delete this.state.accounts[userId];
    }

    private async saveStateToStorage(state: State, options: StorageOptions): Promise<void> {
        await this.storageService.save('state', state, options);
    }

    private async pruneInMemoryAccounts() {
        // We preserve settings for logged out accounts, but we don't want to consider them when thinking about active account state
        for (const userId in this.state.accounts) {
            if (!await this.getIsAuthenticated({ userId: userId })) {
                delete this.state.accounts[userId];
            }
        }
    }
}
