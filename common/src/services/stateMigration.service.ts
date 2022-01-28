import { StorageService } from "../abstractions/storage.service";

import { GeneratedPasswordHistory } from "../models/domain/generatedPasswordHistory";
import { GlobalState } from "../models/domain/globalState";
import { StorageOptions } from "../models/domain/storageOptions";

import { CipherData } from "../models/data/cipherData";
import { CollectionData } from "../models/data/collectionData";
import { EventData } from "../models/data/eventData";
import { FolderData } from "../models/data/folderData";
import { OrganizationData } from "../models/data/organizationData";
import { PolicyData } from "../models/data/policyData";
import { ProviderData } from "../models/data/providerData";
import { SendData } from "../models/data/sendData";

import { HtmlStorageLocation } from "../enums/htmlStorageLocation";
import { KdfType } from "../enums/kdfType";
import { StateVersion } from "../enums/stateVersion";

import { EnvironmentUrls } from "../models/domain/environmentUrls";

// Originally (before January 2022) storage was handled as a flat key/value pair store.
// With the move to a typed object for state storage these keys should no longer be in use anywhere outside of this migration.
const v1Keys: { [key: string]: string } = {
  accessToken: "accessToken",
  alwaysShowDock: "alwaysShowDock",
  autoConfirmFingerprints: "autoConfirmFingerprints",
  autoFillOnPageLoadDefault: "autoFillOnPageLoadDefault",
  biometricAwaitingAcceptance: "biometricAwaitingAcceptance",
  biometricFingerprintValidated: "biometricFingerprintValidated",
  biometricText: "biometricText",
  biometricUnlock: "biometric",
  clearClipboard: "clearClipboardKey",
  clientId: "apikey_clientId",
  clientSecret: "apikey_clientSecret",
  collapsedGroupings: "collapsedGroupings",
  convertAccountToKeyConnector: "convertAccountToKeyConnector",
  defaultUriMatch: "defaultUriMatch",
  disableAddLoginNotification: "disableAddLoginNotification",
  disableAutoBiometricsPrompt: "noAutoPromptBiometrics",
  disableAutoTotpCopy: "disableAutoTotpCopy",
  disableBadgeCounter: "disableBadgeCounter",
  disableChangedPasswordNotification: "disableChangedPasswordNotification",
  disableContextMenuItem: "disableContextMenuItem",
  disableFavicon: "disableFavicon",
  disableGa: "disableGa",
  dontShowCardsCurrentTab: "dontShowCardsCurrentTab",
  dontShowIdentitiesCurrentTab: "dontShowIdentitiesCurrentTab",
  emailVerified: "emailVerified",
  enableAlwaysOnTop: "enableAlwaysOnTopKey",
  enableAutoFillOnPageLoad: "enableAutoFillOnPageLoad",
  enableBiometric: "enabledBiometric",
  enableBrowserIntegration: "enableBrowserIntegration",
  enableBrowserIntegrationFingerprint: "enableBrowserIntegrationFingerprint",
  enableCloseToTray: "enableCloseToTray",
  enableFullWidth: "enableFullWidth",
  enableGravatars: "enableGravatars",
  enableMinimizeToTray: "enableMinimizeToTray",
  enableStartToTray: "enableStartToTrayKey",
  enableTray: "enableTray",
  encKey: "encKey", // Generated Symmetric Key
  encOrgKeys: "encOrgKeys",
  encPrivate: "encPrivateKey",
  encProviderKeys: "encProviderKeys",
  entityId: "entityId",
  entityType: "entityType",
  environmentUrls: "environmentUrls",
  equivalentDomains: "equivalentDomains",
  eventCollection: "eventCollection",
  forcePasswordReset: "forcePasswordReset",
  history: "generatedPasswordHistory",
  installedVersion: "installedVersion",
  kdf: "kdf",
  kdfIterations: "kdfIterations",
  key: "key", // Master Key
  keyHash: "keyHash",
  lastActive: "lastActive",
  localData: "sitesLocalData",
  locale: "locale",
  mainWindowSize: "mainWindowSize",
  minimizeOnCopyToClipboard: "minimizeOnCopyToClipboardKey",
  neverDomains: "neverDomains",
  noAutoPromptBiometricsText: "noAutoPromptBiometricsText",
  openAtLogin: "openAtLogin",
  passwordGenerationOptions: "passwordGenerationOptions",
  pinProtected: "pinProtectedKey",
  protectedPin: "protectedPin",
  refreshToken: "refreshToken",
  ssoCodeVerifier: "ssoCodeVerifier",
  ssoIdentifier: "ssoOrgIdentifier",
  ssoState: "ssoState",
  stamp: "securityStamp",
  theme: "theme",
  userEmail: "userEmail",
  userId: "userId",
  usesConnector: "usesKeyConnector",
  vaultTimeoutAction: "vaultTimeoutAction",
  vaultTimeout: "lockOption",
  rememberedEmail: "rememberedEmail",
};

const v1KeyPrefixes: { [key: string]: string } = {
  ciphers: "ciphers_",
  collections: "collections_",
  folders: "folders_",
  lastSync: "lastSync_",
  policies: "policies_",
  twoFactorToken: "twoFactorToken_",
  organizations: "organizations_",
  providers: "providers_",
  sends: "sends_",
  settings: "settings_",
};

const keys = {
  global: "global",
  authenticatedAccounts: "authenticatedAccounts",
  activeUserId: "activeUserId",
  tempAccountSettings: "tempAccountSettings", // used to hold account specific settings (i.e clear clipboard) between initial migration and first account authentication
};

const partialKeys = {
  autoKey: "_masterkey_auto",
  biometricKey: "_masterkey_biometric",
  masterKey: "_masterkey",
};

export class StateMigrationService {
  constructor(
    protected storageService: StorageService,
    protected secureStorageService: StorageService
  ) {}

  async needsMigration(): Promise<boolean> {
    const currentStateVersion = await this.getCurrentStateVersion();
    return currentStateVersion == null || currentStateVersion < StateVersion.Latest;
  }

  async migrate(): Promise<void> {
    let currentStateVersion = await this.getCurrentStateVersion();
    while (currentStateVersion < StateVersion.Latest) {
      switch (currentStateVersion) {
        case StateVersion.One:
          await this.migrateStateFrom1To2();
          break;
      }

      currentStateVersion += 1;
    }
  }

  protected async migrateStateFrom1To2(): Promise<void> {
    const clearV1Keys = async (clearingUserId?: string) => {
      for (const key in v1Keys) {
        if (key == null) {
          continue;
        }
        await this.set(v1Keys[key], null);
      }
      if (clearingUserId != null) {
        for (const keyPrefix in v1KeyPrefixes) {
          if (keyPrefix == null) {
            continue;
          }
          await this.set(v1KeyPrefixes[keyPrefix] + userId, null);
        }
      }
    };

    // Some processes, like biometrics, may have already defined a value before migrations are run.
    // We don't want to null out those values if they don't exist in the old storage scheme (like for new installs)
    // So, the OOO for migration is that we:
    // 1. Check for an existing storage value from the old storage structure OR
    // 2. Check for a value already set by processes that run before migration OR
    // 3. Assign the default value
    const globals = (await this.get<GlobalState>(keys.global)) ?? new GlobalState();
    globals.stateVersion = StateVersion.Two;
    globals.environmentUrls =
      (await this.get<EnvironmentUrls>(v1Keys.environmentUrls)) ?? globals.environmentUrls;
    globals.locale = (await this.get<string>(v1Keys.locale)) ?? globals.locale;
    globals.noAutoPromptBiometrics =
      (await this.get<boolean>(v1Keys.disableAutoBiometricsPrompt)) ??
      globals.noAutoPromptBiometrics;
    globals.noAutoPromptBiometricsText =
      (await this.get<string>(v1Keys.noAutoPromptBiometricsText)) ??
      globals.noAutoPromptBiometricsText;
    globals.ssoCodeVerifier =
      (await this.get<string>(v1Keys.ssoCodeVerifier)) ?? globals.ssoCodeVerifier;
    globals.ssoOrganizationIdentifier =
      (await this.get<string>(v1Keys.ssoIdentifier)) ?? globals.ssoOrganizationIdentifier;
    globals.ssoState = (await this.get<any>(v1Keys.ssoState)) ?? globals.ssoState;
    globals.rememberedEmail =
      (await this.get<string>(v1Keys.rememberedEmail)) ?? globals.rememberedEmail;
    globals.theme = (await this.get<string>(v1Keys.theme)) ?? globals.theme;
    globals.vaultTimeout = (await this.get<number>(v1Keys.vaultTimeout)) ?? globals.vaultTimeout;
    globals.vaultTimeoutAction =
      (await this.get<string>(v1Keys.vaultTimeoutAction)) ?? globals.vaultTimeoutAction;
    globals.window = (await this.get<any>(v1Keys.mainWindowSize)) ?? globals.window;
    globals.enableTray = (await this.get<boolean>(v1Keys.enableTray)) ?? globals.enableTray;
    globals.enableMinimizeToTray =
      (await this.get<boolean>(v1Keys.enableMinimizeToTray)) ?? globals.enableMinimizeToTray;
    globals.enableCloseToTray =
      (await this.get<boolean>(v1Keys.enableCloseToTray)) ?? globals.enableCloseToTray;
    globals.enableStartToTray =
      (await this.get<boolean>(v1Keys.enableStartToTray)) ?? globals.enableStartToTray;
    globals.openAtLogin = (await this.get<boolean>(v1Keys.openAtLogin)) ?? globals.openAtLogin;
    globals.alwaysShowDock =
      (await this.get<boolean>(v1Keys.alwaysShowDock)) ?? globals.alwaysShowDock;
    globals.enableBrowserIntegration =
      (await this.get<boolean>(v1Keys.enableBrowserIntegration)) ??
      globals.enableBrowserIntegration;
    globals.enableBrowserIntegrationFingerprint =
      (await this.get<boolean>(v1Keys.enableBrowserIntegrationFingerprint)) ??
      globals.enableBrowserIntegrationFingerprint;

    const userId =
      (await this.get<string>(v1Keys.userId)) ?? (await this.get<string>(v1Keys.entityId));

    // (userId == null) = no logged in user (so no known userId) and we need to temporarily store account specific settings in state to migrate on first auth
    // (userId != null) = we have a currently authed user (so known userId) with encrypted data and other key settings we can move, no need to temporarily store account settings
    if (userId == null) {
      await this.set(keys.tempAccountSettings, {
        autoConfirmFingerPrints: await this.get<boolean>(v1Keys.autoConfirmFingerprints),
        autoFillOnPageLoadDefault: await this.get<boolean>(v1Keys.autoFillOnPageLoadDefault),
        biometricLocked: null,
        biometricUnlock: await this.get<boolean>(v1Keys.biometricUnlock),
        clearClipboard: await this.get<number>(v1Keys.clearClipboard),
        defaultUriMatch: await this.get<any>(v1Keys.defaultUriMatch),
        disableAddLoginNotification: await this.get<boolean>(v1Keys.disableAddLoginNotification),
        disableAutoBiometricsPrompt: await this.get<boolean>(v1Keys.disableAutoBiometricsPrompt),
        disableAutoTotpCopy: await this.get<boolean>(v1Keys.disableAutoTotpCopy),
        disableBadgeCounter: await this.get<boolean>(v1Keys.disableBadgeCounter),
        disableChangedPasswordNotification: await this.get<boolean>(
          v1Keys.disableChangedPasswordNotification
        ),
        disableContextMenuItem: await this.get<boolean>(v1Keys.disableContextMenuItem),
        disableGa: await this.get<boolean>(v1Keys.disableGa),
        dontShowCardsCurrentTab: await this.get<boolean>(v1Keys.dontShowCardsCurrentTab),
        dontShowIdentitiesCurrentTab: await this.get<boolean>(v1Keys.dontShowIdentitiesCurrentTab),
        enableAlwaysOnTop: await this.get<boolean>(v1Keys.enableAlwaysOnTop),
        enableAutoFillOnPageLoad: await this.get<boolean>(v1Keys.enableAutoFillOnPageLoad),
        enableBiometric: await this.get<boolean>(v1Keys.enableBiometric),
        enableFullWidth: await this.get<boolean>(v1Keys.enableFullWidth),
        enableGravitars: await this.get<boolean>(v1Keys.enableGravatars),
        environmentUrls: globals.environmentUrls,
        equivalentDomains: await this.get<any>(v1Keys.equivalentDomains),
        minimizeOnCopyToClipboard: await this.get<boolean>(v1Keys.minimizeOnCopyToClipboard),
        neverDomains: await this.get<any>(v1Keys.neverDomains),
        passwordGenerationOptions: await this.get<any>(v1Keys.passwordGenerationOptions),
        pinProtected: {
          decrypted: null,
          encrypted: await this.get<string>(v1Keys.pinProtected),
        },
        protectedPin: await this.get<string>(v1Keys.protectedPin),
        settings: null,
        vaultTimeout: await this.get<number>(v1Keys.vaultTimeout),
        vaultTimeoutAction: await this.get<string>(v1Keys.vaultTimeoutAction),
      });
      await this.set(keys.global, globals);
      await this.set(keys.authenticatedAccounts, []);
      await this.set(keys.activeUserId, null);
      await clearV1Keys();
      return;
    }

    globals.twoFactorToken = await this.get<string>(v1KeyPrefixes.twoFactorToken + userId);
    await this.set(keys.global, globals);
    await this.set(userId, {
      data: {
        addEditCipherInfo: null,
        ciphers: {
          decrypted: null,
          encrypted: await this.get<{ [id: string]: CipherData }>(v1KeyPrefixes.ciphers + userId),
        },
        collapsedGroupings: null,
        collections: {
          decrypted: null,
          encrypted: await this.get<{ [id: string]: CollectionData }>(
            v1KeyPrefixes.collections + userId
          ),
        },
        eventCollection: await this.get<EventData[]>(v1Keys.eventCollection),
        folders: {
          decrypted: null,
          encrypted: await this.get<{ [id: string]: FolderData }>(v1KeyPrefixes.folders + userId),
        },
        localData: null,
        organizations: await this.get<{ [id: string]: OrganizationData }>(
          v1KeyPrefixes.organizations + userId
        ),
        passwordGenerationHistory: {
          decrypted: null,
          encrypted: await this.get<GeneratedPasswordHistory[]>(v1Keys.history),
        },
        policies: {
          decrypted: null,
          encrypted: await this.get<{ [id: string]: PolicyData }>(v1KeyPrefixes.policies + userId),
        },
        providers: await this.get<{ [id: string]: ProviderData }>(v1KeyPrefixes.providers + userId),
        sends: {
          decrypted: null,
          encrypted: await this.get<{ [id: string]: SendData }>(v1KeyPrefixes.sends + userId),
        },
      },
      keys: {
        apiKeyClientSecret: await this.get<string>(v1Keys.clientSecret),
        cryptoMasterKey: null,
        cryptoMasterKeyAuto: null,
        cryptoMasterKeyB64: null,
        cryptoMasterKeyBiometric: null,
        cryptoSymmetricKey: {
          encrypted: await this.get<string>(v1Keys.encKey),
          decrypted: null,
        },
        legacyEtmKey: null,
        organizationKeys: {
          decrypted: null,
          encrypted: await this.get<any>(v1Keys.encOrgKeys + userId),
        },
        privateKey: {
          decrypted: null,
          encrypted: await this.get<string>(v1Keys.encPrivate),
        },
        providerKeys: {
          decrypted: null,
          encrypted: await this.get<any>(v1Keys.encProviderKeys + userId),
        },
        publicKey: null,
      },
      profile: {
        apiKeyClientId: await this.get<string>(v1Keys.clientId),
        authenticationStatus: null,
        convertAccountToKeyConnector: await this.get<boolean>(v1Keys.convertAccountToKeyConnector),
        email: await this.get<string>(v1Keys.userEmail),
        emailVerified: await this.get<boolean>(v1Keys.emailVerified),
        entityId: null,
        entityType: null,
        everBeenUnlocked: null,
        forcePasswordReset: null,
        hasPremiumPersonally: null,
        kdfIterations: await this.get<number>(v1Keys.kdfIterations),
        kdfType: await this.get<KdfType>(v1Keys.kdf),
        keyHash: await this.get<string>(v1Keys.keyHash),
        lastActive: await this.get<number>(v1Keys.lastActive),
        lastSync: null,
        userId: userId,
        usesKeyConnector: null,
      },
      settings: {
        autoConfirmFingerPrints: await this.get<boolean>(v1Keys.autoConfirmFingerprints),
        autoFillOnPageLoadDefault: await this.get<boolean>(v1Keys.autoFillOnPageLoadDefault),
        biometricLocked: null,
        biometricUnlock: await this.get<boolean>(v1Keys.biometricUnlock),
        clearClipboard: await this.get<number>(v1Keys.clearClipboard),
        defaultUriMatch: await this.get<any>(v1Keys.defaultUriMatch),
        disableAddLoginNotification: await this.get<boolean>(v1Keys.disableAddLoginNotification),
        disableAutoBiometricsPrompt: await this.get<boolean>(v1Keys.disableAutoBiometricsPrompt),
        disableAutoTotpCopy: await this.get<boolean>(v1Keys.disableAutoTotpCopy),
        disableBadgeCounter: await this.get<boolean>(v1Keys.disableBadgeCounter),
        disableChangedPasswordNotification: await this.get<boolean>(
          v1Keys.disableChangedPasswordNotification
        ),
        disableContextMenuItem: await this.get<boolean>(v1Keys.disableContextMenuItem),
        disableGa: await this.get<boolean>(v1Keys.disableGa),
        dontShowCardsCurrentTab: await this.get<boolean>(v1Keys.dontShowCardsCurrentTab),
        dontShowIdentitiesCurrentTab: await this.get<boolean>(v1Keys.dontShowIdentitiesCurrentTab),
        enableAlwaysOnTop: await this.get<boolean>(v1Keys.enableAlwaysOnTop),
        enableAutoFillOnPageLoad: await this.get<boolean>(v1Keys.enableAutoFillOnPageLoad),
        enableBiometric: await this.get<boolean>(v1Keys.enableBiometric),
        enableFullWidth: await this.get<boolean>(v1Keys.enableFullWidth),
        enableGravitars: await this.get<boolean>(v1Keys.enableGravatars),
        environmentUrls: globals.environmentUrls,
        equivalentDomains: await this.get<any>(v1Keys.equivalentDomains),
        minimizeOnCopyToClipboard: await this.get<boolean>(v1Keys.minimizeOnCopyToClipboard),
        neverDomains: await this.get<any>(v1Keys.neverDomains),
        passwordGenerationOptions: await this.get<any>(v1Keys.passwordGenerationOptions),
        pinProtected: {
          decrypted: null,
          encrypted: await this.get<string>(v1Keys.pinProtected),
        },
        protectedPin: await this.get<string>(v1Keys.protectedPin),
        settings: await this.get<any>(v1KeyPrefixes.settings + userId),
        vaultTimeout: await this.get<number>(v1Keys.vaultTimeout),
        vaultTimeoutAction: await this.get<string>(v1Keys.vaultTimeoutAction),
      },
      tokens: {
        accessToken: await this.get<string>(v1Keys.accessToken),
        decodedToken: null,
        refreshToken: await this.get<string>(v1Keys.refreshToken),
        securityStamp: null,
      },
    });

    await this.set(keys.authenticatedAccounts, [userId]);
    await this.set(keys.activeUserId, userId);
    await clearV1Keys(userId);

    if (await this.secureStorageService.has(v1Keys.key, { keySuffix: "biometric" })) {
      await this.secureStorageService.save(
        `${userId}${partialKeys.biometricKey}`,
        await this.secureStorageService.get(v1Keys.key, { keySuffix: "biometric" }),
        { keySuffix: "biometric" }
      );
      await this.secureStorageService.remove(v1Keys.key, { keySuffix: "biometric" });
    }

    if (await this.secureStorageService.has(v1Keys.key, { keySuffix: "auto" })) {
      await this.secureStorageService.save(
        `${userId}${partialKeys.autoKey}`,
        await this.secureStorageService.get(v1Keys.key, { keySuffix: "auto" }),
        { keySuffix: "auto" }
      );
      await this.secureStorageService.remove(v1Keys.key, { keySuffix: "auto" });
    }

    if (await this.secureStorageService.has(v1Keys.key)) {
      await this.secureStorageService.save(
        `${userId}${partialKeys.masterKey}`,
        await this.secureStorageService.get(v1Keys.key)
      );
      await this.secureStorageService.remove(v1Keys.key);
    }
  }

  protected get options(): StorageOptions {
    return { htmlStorageLocation: HtmlStorageLocation.Local };
  }

  protected get<T>(key: string): Promise<T> {
    return this.storageService.get<T>(key, this.options);
  }

  protected set(key: string, value: any): Promise<any> {
    if (value == null) {
      return this.storageService.remove(key, this.options);
    }
    return this.storageService.save(key, value, this.options);
  }

  protected async getGlobals(): Promise<GlobalState> {
    return await this.get<GlobalState>(keys.global);
  }

  protected async getCurrentStateVersion(): Promise<StateVersion> {
    return (await this.getGlobals())?.stateVersion;
  }
}
