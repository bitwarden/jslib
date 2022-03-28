import { Injector, LOCALE_ID, NgModule } from "@angular/core";

import { ApiService as ApiServiceAbstraction } from "jslib-common/abstractions/api.service";
import { AppIdService as AppIdServiceAbstraction } from "jslib-common/abstractions/appId.service";
import { AuditService as AuditServiceAbstraction } from "jslib-common/abstractions/audit.service";
import { AuthService as AuthServiceAbstraction } from "jslib-common/abstractions/auth.service";
import { BroadcasterService as BroadcasterServiceAbstraction } from "jslib-common/abstractions/broadcaster.service";
import { CipherService as CipherServiceAbstraction } from "jslib-common/abstractions/cipher.service";
import { CollectionService as CollectionServiceAbstraction } from "jslib-common/abstractions/collection.service";
import { CryptoService as CryptoServiceAbstraction } from "jslib-common/abstractions/crypto.service";
import { CryptoFunctionService as CryptoFunctionServiceAbstraction } from "jslib-common/abstractions/cryptoFunction.service";
import { EnvironmentService as EnvironmentServiceAbstraction } from "jslib-common/abstractions/environment.service";
import { EventService as EventServiceAbstraction } from "jslib-common/abstractions/event.service";
import { ExportService as ExportServiceAbstraction } from "jslib-common/abstractions/export.service";
import { FileUploadService as FileUploadServiceAbstraction } from "jslib-common/abstractions/fileUpload.service";
import { FolderService as FolderServiceAbstraction } from "jslib-common/abstractions/folder.service";
import { I18nService as I18nServiceAbstraction } from "jslib-common/abstractions/i18n.service";
import { KeyConnectorService as KeyConnectorServiceAbstraction } from "jslib-common/abstractions/keyConnector.service";
import { LogService } from "jslib-common/abstractions/log.service";
import { MessagingService as MessagingServiceAbstraction } from "jslib-common/abstractions/messaging.service";
import { NotificationsService as NotificationsServiceAbstraction } from "jslib-common/abstractions/notifications.service";
import { OrganizationService as OrganizationServiceAbstraction } from "jslib-common/abstractions/organization.service";
import { PasswordGenerationService as PasswordGenerationServiceAbstraction } from "jslib-common/abstractions/passwordGeneration.service";
import { PasswordRepromptService as PasswordRepromptServiceAbstraction } from "jslib-common/abstractions/passwordReprompt.service";
import { PlatformUtilsService as PlatformUtilsServiceAbstraction } from "jslib-common/abstractions/platformUtils.service";
import { PolicyService as PolicyServiceAbstraction } from "jslib-common/abstractions/policy.service";
import { ProviderService as ProviderServiceAbstraction } from "jslib-common/abstractions/provider.service";
import { SearchService as SearchServiceAbstraction } from "jslib-common/abstractions/search.service";
import { SendService as SendServiceAbstraction } from "jslib-common/abstractions/send.service";
import { SettingsService as SettingsServiceAbstraction } from "jslib-common/abstractions/settings.service";
import { StateService as StateServiceAbstraction } from "jslib-common/abstractions/state.service";
import { StateMigrationService as StateMigrationServiceAbstraction } from "jslib-common/abstractions/stateMigration.service";
import { SyncService as SyncServiceAbstraction } from "jslib-common/abstractions/sync.service";
import { TokenService as TokenServiceAbstraction } from "jslib-common/abstractions/token.service";
import { TotpService as TotpServiceAbstraction } from "jslib-common/abstractions/totp.service";
import { TwoFactorService as TwoFactorServiceAbstraction } from "jslib-common/abstractions/twoFactor.service";
import { UserVerificationService as UserVerificationServiceAbstraction } from "jslib-common/abstractions/userVerification.service";
import { UsernameGenerationService as UsernameGenerationServiceAbstraction } from "jslib-common/abstractions/usernameGeneration.service";
import { VaultTimeoutService as VaultTimeoutServiceAbstraction } from "jslib-common/abstractions/vaultTimeout.service";
import { StateFactory } from "jslib-common/factories/stateFactory";
import {
  STATE_FACTORY,
  STATE_SERVICE_USE_CACHE,
  WINDOW_TOKEN,
} from "jslib-common/misc/injectionTokens";
import { Account } from "jslib-common/models/domain/account";
import { GlobalState } from "jslib-common/models/domain/globalState";
import { ApiService } from "jslib-common/services/api.service";
import { AppIdService } from "jslib-common/services/appId.service";
import { AuditService } from "jslib-common/services/audit.service";
import { AuthService } from "jslib-common/services/auth.service";
import { CipherService } from "jslib-common/services/cipher.service";
import { CollectionService } from "jslib-common/services/collection.service";
import { ConsoleLogService } from "jslib-common/services/consoleLog.service";
import { CryptoService } from "jslib-common/services/crypto.service";
import { EnvironmentService } from "jslib-common/services/environment.service";
import { EventService } from "jslib-common/services/event.service";
import { ExportService } from "jslib-common/services/export.service";
import { FileUploadService } from "jslib-common/services/fileUpload.service";
import { FolderService } from "jslib-common/services/folder.service";
import { KeyConnectorService } from "jslib-common/services/keyConnector.service";
import { NotificationsService } from "jslib-common/services/notifications.service";
import { OrganizationService } from "jslib-common/services/organization.service";
import { PasswordGenerationService } from "jslib-common/services/passwordGeneration.service";
import { PolicyService } from "jslib-common/services/policy.service";
import { ProviderService } from "jslib-common/services/provider.service";
import { SearchService } from "jslib-common/services/search.service";
import { SendService } from "jslib-common/services/send.service";
import { SettingsService } from "jslib-common/services/settings.service";
import { StateService } from "jslib-common/services/state.service";
import { StateMigrationService } from "jslib-common/services/stateMigration.service";
import { SyncService } from "jslib-common/services/sync.service";
import { TokenService } from "jslib-common/services/token.service";
import { TotpService } from "jslib-common/services/totp.service";
import { TwoFactorService } from "jslib-common/services/twoFactor.service";
import { UserVerificationService } from "jslib-common/services/userVerification.service";
import { UsernameGenerationService } from "jslib-common/services/usernameGeneration.service";
import { VaultTimeoutService } from "jslib-common/services/vaultTimeout.service";
import { WebCryptoFunctionService } from "jslib-common/services/webCryptoFunction.service";

import { AuthGuardService } from "./auth-guard.service";
import { BroadcasterService } from "./broadcaster.service";
import { LockGuardService } from "./lock-guard.service";
import { ModalService } from "./modal.service";
import { PasswordRepromptService } from "./passwordReprompt.service";
import { UnauthGuardService } from "./unauth-guard.service";
import { ValidationService } from "./validation.service";

@NgModule({
  declarations: [],
  providers: [
    { provide: WINDOW_TOKEN, useValue: window },
    {
      provide: LOCALE_ID,
      useFactory: (i18nService: I18nServiceAbstraction) => i18nService.translationLocale,
      deps: [I18nServiceAbstraction],
    },
    ValidationService,
    AuthGuardService,
    UnauthGuardService,
    LockGuardService,
    ModalService,
    {
      provide: AppIdServiceAbstraction,
      useClass: AppIdService,
    },
    {
      provide: AuditServiceAbstraction,
      useClass: AuditService,
    },
    {
      provide: AuthServiceAbstraction,
      useClass: AuthService,
    },
    {
      provide: CipherServiceAbstraction,
      useFactory: (
        cryptoService: CryptoServiceAbstraction,
        settingsService: SettingsServiceAbstraction,
        apiService: ApiServiceAbstraction,
        fileUploadService: FileUploadServiceAbstraction,
        i18nService: I18nServiceAbstraction,
        injector: Injector,
        logService: LogService,
        stateService: StateServiceAbstraction
      ) =>
        new CipherService(
          cryptoService,
          settingsService,
          apiService,
          fileUploadService,
          i18nService,
          () => injector.get(SearchServiceAbstraction),
          logService,
          stateService
        ),
      deps: [
        CryptoServiceAbstraction,
        SettingsServiceAbstraction,
        ApiServiceAbstraction,
        FileUploadServiceAbstraction,
        I18nServiceAbstraction,
        Injector, // TODO: Get rid of this circular dependency!
        LogService,
        StateServiceAbstraction,
      ],
    },
    {
      provide: FolderServiceAbstraction,
      useClass: FolderService,
    },
    { provide: LogService, useFactory: () => new ConsoleLogService(false) },
    {
      provide: CollectionServiceAbstraction,
      useClass: CollectionService,
    },
    {
      provide: EnvironmentServiceAbstraction,
      useClass: EnvironmentService,
    },
    {
      provide: TotpServiceAbstraction,
      useClass: TotpService,
    },
    { provide: TokenServiceAbstraction, useClass: TokenService },
    {
      provide: CryptoServiceAbstraction,
      useClass: CryptoService,
    },
    {
      provide: PasswordGenerationServiceAbstraction,
      useClass: PasswordGenerationService,
    },
    {
      provide: UsernameGenerationServiceAbstraction,
      useClass: UsernameGenerationService,
      deps: [CryptoServiceAbstraction, StateServiceAbstraction],
    },
    {
      provide: ApiServiceAbstraction,
      useFactory: (
        tokenService: TokenServiceAbstraction,
        platformUtilsService: PlatformUtilsServiceAbstraction,
        environmentService: EnvironmentServiceAbstraction,
        messagingService: MessagingServiceAbstraction
      ) =>
        new ApiService(
          tokenService,
          platformUtilsService,
          environmentService,
          async (expired: boolean) => messagingService.send("logout", { expired: expired })
        ),
      deps: [
        TokenServiceAbstraction,
        PlatformUtilsServiceAbstraction,
        EnvironmentServiceAbstraction,
        MessagingServiceAbstraction,
      ],
    },
    {
      provide: FileUploadServiceAbstraction,
      useClass: FileUploadService,
      deps: [LogService, ApiServiceAbstraction],
    },
    {
      provide: SyncServiceAbstraction,
      useFactory: (
        apiService: ApiServiceAbstraction,
        settingsService: SettingsServiceAbstraction,
        folderService: FolderServiceAbstraction,
        cipherService: CipherServiceAbstraction,
        cryptoService: CryptoServiceAbstraction,
        collectionService: CollectionServiceAbstraction,
        messagingService: MessagingServiceAbstraction,
        policyService: PolicyServiceAbstraction,
        sendService: SendServiceAbstraction,
        logService: LogService,
        keyConnectorService: KeyConnectorServiceAbstraction,
        stateService: StateServiceAbstraction,
        organizationService: OrganizationServiceAbstraction,
        providerService: ProviderServiceAbstraction
      ) =>
        new SyncService(
          apiService,
          settingsService,
          folderService,
          cipherService,
          cryptoService,
          collectionService,
          messagingService,
          policyService,
          sendService,
          logService,
          keyConnectorService,
          stateService,
          organizationService,
          providerService,
          async (expired: boolean) => messagingService.send("logout", { expired: expired })
        ),
      deps: [
        ApiServiceAbstraction,
        SettingsServiceAbstraction,
        FolderServiceAbstraction,
        CipherServiceAbstraction,
        CryptoServiceAbstraction,
        CollectionServiceAbstraction,
        MessagingServiceAbstraction,
        PolicyServiceAbstraction,
        SendServiceAbstraction,
        LogService,
        KeyConnectorServiceAbstraction,
        StateServiceAbstraction,
        OrganizationServiceAbstraction,
        ProviderServiceAbstraction,
      ],
    },
    { provide: BroadcasterServiceAbstraction, useClass: BroadcasterService },
    {
      provide: SettingsServiceAbstraction,
      useClass: SettingsService,
    },
    {
      provide: VaultTimeoutServiceAbstraction,
      useFactory: (
        cipherService: CipherServiceAbstraction,
        folderService: FolderServiceAbstraction,
        collectionService: CollectionServiceAbstraction,
        cryptoService: CryptoServiceAbstraction,
        platformUtilsService: PlatformUtilsServiceAbstraction,
        messagingService: MessagingServiceAbstraction,
        searchService: SearchServiceAbstraction,
        tokenService: TokenServiceAbstraction,
        policyService: PolicyServiceAbstraction,
        keyConnectorService: KeyConnectorServiceAbstraction,
        stateService: StateServiceAbstraction
      ) =>
        new VaultTimeoutService(
          cipherService,
          folderService,
          collectionService,
          cryptoService,
          platformUtilsService,
          messagingService,
          searchService,
          tokenService,
          policyService,
          keyConnectorService,
          stateService,
          null,
          async (userId?: string) =>
            messagingService.send("logout", { expired: false, userId: userId })
        ),
      deps: [
        CipherServiceAbstraction,
        FolderServiceAbstraction,
        CollectionServiceAbstraction,
        CryptoServiceAbstraction,
        PlatformUtilsServiceAbstraction,
        MessagingServiceAbstraction,
        SearchServiceAbstraction,
        TokenServiceAbstraction,
        PolicyServiceAbstraction,
        KeyConnectorServiceAbstraction,
        StateServiceAbstraction,
      ],
    },
    {
      provide: STATE_SERVICE_USE_CACHE,
      useValue: true,
    },
    {
      provide: STATE_FACTORY,
      useFactory: () => new StateFactory(GlobalState, Account),
    },
    {
      provide: StateServiceAbstraction,
      useClass: StateService,
    },
    {
      provide: StateMigrationServiceAbstraction,
      useClass: StateMigrationService,
    },
    {
      provide: ExportServiceAbstraction,
      useClass: ExportService,
    },
    {
      provide: SearchServiceAbstraction,
      useClass: SearchService,
    },
    {
      provide: NotificationsServiceAbstraction,
      useFactory: (
        syncService: SyncServiceAbstraction,
        appIdService: AppIdServiceAbstraction,
        apiService: ApiServiceAbstraction,
        vaultTimeoutService: VaultTimeoutServiceAbstraction,
        environmentService: EnvironmentServiceAbstraction,
        messagingService: MessagingServiceAbstraction,
        logService: LogService,
        stateService: StateServiceAbstraction
      ) =>
        new NotificationsService(
          syncService,
          appIdService,
          apiService,
          vaultTimeoutService,
          environmentService,
          async () => messagingService.send("logout", { expired: true }),
          logService,
          stateService
        ),
      deps: [
        SyncServiceAbstraction,
        AppIdServiceAbstraction,
        ApiServiceAbstraction,
        VaultTimeoutServiceAbstraction,
        EnvironmentServiceAbstraction,
        MessagingServiceAbstraction,
        LogService,
        StateServiceAbstraction,
      ],
    },
    {
      provide: CryptoFunctionServiceAbstraction,
      useClass: WebCryptoFunctionService,
    },
    {
      provide: EventServiceAbstraction,
      useClass: EventService,
    },
    {
      provide: PolicyServiceAbstraction,
      useClass: PolicyService,
    },
    {
      provide: SendServiceAbstraction,
      useClass: SendService,
    },
    {
      provide: KeyConnectorServiceAbstraction,
      useClass: KeyConnectorService,
    },
    {
      provide: UserVerificationServiceAbstraction,
      useClass: UserVerificationService,
    },
    { provide: PasswordRepromptServiceAbstraction, useClass: PasswordRepromptService },
    {
      provide: OrganizationServiceAbstraction,
      useClass: OrganizationService,
    },
    {
      provide: ProviderServiceAbstraction,
      useClass: ProviderService,
    },
    {
      provide: TwoFactorServiceAbstraction,
      useClass: TwoFactorService,
    },
  ],
})
export class JslibServicesModule {}
