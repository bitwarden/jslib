import { StorageService } from "../abstractions/storage.service";

import { Account } from "../models/domain/account";
import { GeneratedPasswordHistory } from "../models/domain/generatedPasswordHistory";
import { GlobalState } from "../models/domain/globalState";
import { State } from "../models/domain/state";
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

// Originally (before January 2022) storage was handled as a flat key/value pair store.
// With the move to a typed object for state storage these keys should no longer be in use anywhere outside of this migration.
const v1Keys = {
  accessToken: "accessToken",
  alwaysShowDock: "alwaysShowDock",
  autoConfirmFingerprints: "autoConfirmFingerprints",
  autoFillOnPageLoadDefault: "autoFillOnPageLoadDefault",
  biometricAwaitingAcceptance: "biometricAwaitingAcceptance",
  biometricFingerprintValidated: "biometricFingerprintValidated",
  biometricText: "biometricText",
  biometricUnlock: "biometric",
  clearClipboard: "clearClipboardKey",
  clientId: "clientId",
  clientSecret: "clientSecret",
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

const v1KeyPrefixes = {
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

export class StateMigrationService {
  constructor(
    protected storageService: StorageService,
    protected secureStorageService: StorageService
  ) {}

  async needsMigration(): Promise<boolean> {
    const currentStateVersion = (
      await this.storageService.get<State<Account>>("state", {
        htmlStorageLocation: HtmlStorageLocation.Local,
      })
    )?.globals?.stateVersion;
    return currentStateVersion == null || currentStateVersion < StateVersion.Latest;
  }

  async migrate(): Promise<void> {
    let currentStateVersion =
      (await this.storageService.get<State<Account>>("state"))?.globals?.stateVersion ??
      StateVersion.One;
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
    const options: StorageOptions = { htmlStorageLocation: HtmlStorageLocation.Local };
    const userId = await this.storageService.get<string>("userId");
    const initialState: State<Account> =
      userId == null
        ? {
            globals: new GlobalState(),
            accounts: {},
            activeUserId: null,
          }
        : {
            activeUserId: userId,
            globals: {
              biometricAwaitingAcceptance: await this.storageService.get<boolean>(
                v1Keys.biometricAwaitingAcceptance,
                options
              ),
              biometricFingerprintValidated: await this.storageService.get<boolean>(
                v1Keys.biometricFingerprintValidated,
                options
              ),
              biometricText: await this.storageService.get<string>(v1Keys.biometricText, options),
              disableFavicon: await this.storageService.get<boolean>(
                v1Keys.disableFavicon,
                options
              ),
              enableAlwaysOnTop: await this.storageService.get<boolean>(
                v1Keys.enableAlwaysOnTop,
                options
              ),
              enableBiometrics: await this.storageService.get<boolean>(
                v1Keys.enableBiometric,
                options
              ),
              environmentUrls: await this.storageService.get<any>(v1Keys.environmentUrls, options),
              installedVersion: await this.storageService.get<string>(
                v1Keys.installedVersion,
                options
              ),
              lastActive: await this.storageService.get<number>(v1Keys.lastActive, options),
              locale: await this.storageService.get<string>(v1Keys.locale, options),
              loginRedirect: null,
              mainWindowSize: null,
              noAutoPromptBiometrics: await this.storageService.get<boolean>(
                v1Keys.disableAutoBiometricsPrompt,
                options
              ),
              noAutoPromptBiometricsText: await this.storageService.get<string>(
                v1Keys.noAutoPromptBiometricsText,
                options
              ),
              openAtLogin: await this.storageService.get<boolean>(v1Keys.openAtLogin, options),
              organizationInvitation: await this.storageService.get<string>("", options),
              ssoCodeVerifier: await this.storageService.get<string>(
                v1Keys.ssoCodeVerifier,
                options
              ),
              ssoOrganizationIdentifier: await this.storageService.get<string>(
                v1Keys.ssoIdentifier,
                options
              ),
              ssoState: null,
              rememberedEmail: await this.storageService.get<string>(
                v1Keys.rememberedEmail,
                options
              ),
              stateVersion: StateVersion.Two,
              theme: await this.storageService.get<string>(v1Keys.theme, options),
              twoFactorToken: await this.storageService.get<string>(
                v1KeyPrefixes.twoFactorToken + userId,
                options
              ),
              vaultTimeout: await this.storageService.get<number>(v1Keys.vaultTimeout, options),
              vaultTimeoutAction: await this.storageService.get<string>(
                v1Keys.vaultTimeoutAction,
                options
              ),
              window: null,
            },
            accounts: {
              [userId]: new Account({
                data: {
                  addEditCipherInfo: null,
                  ciphers: {
                    decrypted: null,
                    encrypted: await this.storageService.get<{ [id: string]: CipherData }>(
                      v1KeyPrefixes.ciphers + userId,
                      options
                    ),
                  },
                  collapsedGroupings: null,
                  collections: {
                    decrypted: null,
                    encrypted: await this.storageService.get<{ [id: string]: CollectionData }>(
                      v1KeyPrefixes.collections + userId,
                      options
                    ),
                  },
                  eventCollection: await this.storageService.get<EventData[]>(
                    v1Keys.eventCollection,
                    options
                  ),
                  folders: {
                    decrypted: null,
                    encrypted: await this.storageService.get<{ [id: string]: FolderData }>(
                      v1KeyPrefixes.folders + userId,
                      options
                    ),
                  },
                  localData: null,
                  organizations: await this.storageService.get<{ [id: string]: OrganizationData }>(
                    v1KeyPrefixes.organizations + userId
                  ),
                  passwordGenerationHistory: {
                    decrypted: null,
                    encrypted: await this.storageService.get<GeneratedPasswordHistory[]>(
                      "TODO",
                      options
                    ), // TODO: Whats up here?
                  },
                  policies: {
                    decrypted: null,
                    encrypted: await this.storageService.get<{ [id: string]: PolicyData }>(
                      v1KeyPrefixes.policies + userId,
                      options
                    ),
                  },
                  providers: await this.storageService.get<{ [id: string]: ProviderData }>(
                    v1KeyPrefixes.providers + userId
                  ),
                  sends: {
                    decrypted: null,
                    encrypted: await this.storageService.get<{ [id: string]: SendData }>(
                      v1KeyPrefixes.sends,
                      options
                    ),
                  },
                },
                keys: {
                  apiKeyClientSecret: await this.storageService.get<string>(
                    v1Keys.clientSecret,
                    options
                  ),
                  cryptoMasterKey: null,
                  cryptoMasterKeyAuto: null,
                  cryptoMasterKeyB64: null,
                  cryptoMasterKeyBiometric: null,
                  cryptoSymmetricKey: {
                    encrypted: await this.storageService.get<string>(v1Keys.encKey, options),
                    decrypted: null,
                  },
                  legacyEtmKey: null,
                  organizationKeys: {
                    decrypted: null,
                    encrypted: await this.storageService.get<any>(
                      v1Keys.encOrgKeys + userId,
                      options
                    ),
                  },
                  privateKey: {
                    decrypted: null,
                    encrypted: await this.storageService.get<string>(v1Keys.encPrivate, options),
                  },
                  providerKeys: {
                    decrypted: null,
                    encrypted: await this.storageService.get<any>(
                      v1Keys.encProviderKeys + userId,
                      options
                    ),
                  },
                  publicKey: null,
                },
                profile: {
                  apiKeyClientId: await this.storageService.get<string>(v1Keys.clientId, options),
                  authenticationStatus: null,
                  convertAccountToKeyConnector: await this.storageService.get<boolean>(
                    v1Keys.convertAccountToKeyConnector,
                    options
                  ),
                  email: await this.storageService.get<string>(v1Keys.userEmail, options),
                  emailVerified: await this.storageService.get<boolean>(
                    v1Keys.emailVerified,
                    options
                  ),
                  entityId: null,
                  entityType: null,
                  everBeenUnlocked: null,
                  forcePasswordReset: null,
                  hasPremiumPersonally: null,
                  kdfIterations: await this.storageService.get<number>(
                    v1Keys.kdfIterations,
                    options
                  ),
                  kdfType: await this.storageService.get<KdfType>(v1Keys.kdf, options),
                  keyHash: await this.storageService.get<string>(v1Keys.keyHash, options),
                  lastActive: await this.storageService.get<number>(v1Keys.lastActive, options),
                  lastSync: null,
                  userId: userId,
                  usesKeyConnector: null,
                },
                settings: {
                  alwaysShowDock: await this.storageService.get<boolean>(
                    v1Keys.alwaysShowDock,
                    options
                  ),
                  autoConfirmFingerPrints: await this.storageService.get<boolean>(
                    v1Keys.autoConfirmFingerprints,
                    options
                  ),
                  autoFillOnPageLoadDefault: await this.storageService.get<boolean>(
                    v1Keys.autoFillOnPageLoadDefault,
                    options
                  ),
                  biometricLocked: null,
                  biometricUnlock: await this.storageService.get<boolean>(
                    v1Keys.biometricUnlock,
                    options
                  ),
                  clearClipboard: await this.storageService.get<number>(
                    v1Keys.clearClipboard,
                    options
                  ),
                  defaultUriMatch: await this.storageService.get<any>(
                    v1Keys.defaultUriMatch,
                    options
                  ),
                  disableAddLoginNotification: await this.storageService.get<boolean>(
                    v1Keys.disableAddLoginNotification,
                    options
                  ),
                  disableAutoBiometricsPrompt: await this.storageService.get<boolean>(
                    v1Keys.disableAutoBiometricsPrompt,
                    options
                  ),
                  disableAutoTotpCopy: await this.storageService.get<boolean>(
                    v1Keys.disableAutoTotpCopy,
                    options
                  ),
                  disableBadgeCounter: await this.storageService.get<boolean>(
                    v1Keys.disableBadgeCounter,
                    options
                  ),
                  disableChangedPasswordNotification: await this.storageService.get<boolean>(
                    v1Keys.disableChangedPasswordNotification,
                    options
                  ),
                  disableContextMenuItem: await this.storageService.get<boolean>(
                    v1Keys.disableContextMenuItem,
                    options
                  ),
                  disableGa: await this.storageService.get<boolean>(v1Keys.disableGa, options),
                  dontShowCardsCurrentTab: await this.storageService.get<boolean>(
                    v1Keys.dontShowCardsCurrentTab,
                    options
                  ),
                  dontShowIdentitiesCurrentTab: await this.storageService.get<boolean>(
                    v1Keys.dontShowIdentitiesCurrentTab,
                    options
                  ),
                  enableAlwaysOnTop: await this.storageService.get<boolean>(
                    v1Keys.enableAlwaysOnTop,
                    options
                  ),
                  enableAutoFillOnPageLoad: await this.storageService.get<boolean>(
                    v1Keys.enableAutoFillOnPageLoad,
                    options
                  ),
                  enableBiometric: await this.storageService.get<boolean>(
                    v1Keys.enableBiometric,
                    options
                  ),
                  enableBrowserIntegration: await this.storageService.get<boolean>(
                    v1Keys.enableBrowserIntegration,
                    options
                  ),
                  enableBrowserIntegrationFingerprint: await this.storageService.get<boolean>(
                    v1Keys.enableBrowserIntegrationFingerprint,
                    options
                  ),
                  enableCloseToTray: await this.storageService.get<boolean>(
                    v1Keys.enableCloseToTray,
                    options
                  ),
                  enableFullWidth: await this.storageService.get<boolean>(
                    v1Keys.enableFullWidth,
                    options
                  ),
                  enableGravitars: await this.storageService.get<boolean>(
                    v1Keys.enableGravatars,
                    options
                  ),
                  enableMinimizeToTray: await this.storageService.get<boolean>(
                    v1Keys.enableMinimizeToTray,
                    options
                  ),
                  enableStartToTray: await this.storageService.get<boolean>(
                    v1Keys.enableStartToTray,
                    options
                  ),
                  enableTray: await this.storageService.get<boolean>(v1Keys.enableTray, options),
                  equivalentDomains: await this.storageService.get<any>(
                    v1Keys.equivalentDomains,
                    options
                  ),
                  minimizeOnCopyToClipboard: await this.storageService.get<boolean>(
                    v1Keys.minimizeOnCopyToClipboard,
                    options
                  ),
                  neverDomains: await this.storageService.get<any>(v1Keys.neverDomains, options),
                  openAtLogin: await this.storageService.get<boolean>(v1Keys.openAtLogin, options),
                  passwordGenerationOptions: await this.storageService.get<any>(
                    v1Keys.passwordGenerationOptions,
                    options
                  ),
                  pinProtected: {
                    decrypted: null,
                    encrypted: await this.storageService.get<string>(v1Keys.pinProtected, options),
                  },
                  protectedPin: await this.storageService.get<string>(v1Keys.protectedPin, options),
                  settings: await this.storageService.get<any>(
                    v1KeyPrefixes.settings + userId,
                    options
                  ),
                  vaultTimeout: await this.storageService.get<number>(v1Keys.vaultTimeout, options),
                  vaultTimeoutAction: await this.storageService.get<string>(
                    v1Keys.vaultTimeoutAction,
                    options
                  ),
                },
                tokens: {
                  accessToken: await this.storageService.get<string>(v1Keys.accessToken, options),
                  decodedToken: null,
                  refreshToken: await this.storageService.get<string>(v1Keys.refreshToken, options),
                  securityStamp: null,
                },
              }),
            },
          };

    await this.storageService.save("state", initialState, options);

    if (await this.secureStorageService.has(v1Keys.key, { keySuffix: "biometric" })) {
      await this.secureStorageService.save(
        `${userId}_masterkey_biometric`,
        await this.secureStorageService.get(v1Keys.key, { keySuffix: "biometric" }),
        { keySuffix: "biometric" }
      );
      await this.secureStorageService.remove(v1Keys.key, { keySuffix: "biometric" });
    }

    if (await this.secureStorageService.has(v1Keys.key, { keySuffix: "auto" })) {
      await this.secureStorageService.save(
        `${userId}_masterkey_auto`,
        await this.secureStorageService.get(v1Keys.key, { keySuffix: "auto" }),
        { keySuffix: "auto" }
      );
      await this.secureStorageService.remove(v1Keys.key, { keySuffix: "auto" });
    }

    if (await this.secureStorageService.has(v1Keys.key)) {
      await this.secureStorageService.save(
        `${userId}_masterkey`,
        await this.secureStorageService.get(v1Keys.key)
      );
      await this.secureStorageService.remove(v1Keys.key);
    }
  }
}
