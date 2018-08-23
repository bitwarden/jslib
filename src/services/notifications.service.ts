import * as signalR from '@aspnet/signalr';

import { NotificationType } from '../enums/notificationType';

import { ApiService } from '../abstractions/api.service';
import { AppIdService } from '../abstractions/appId.service';
import { CryptoService } from '../abstractions/crypto.service';
import { EnvironmentService } from '../abstractions/environment.service';
import { NotificationsService as NotificationsServiceAbstraction } from '../abstractions/notifications.service';
import { SyncService } from '../abstractions/sync.service';
import { UserService } from '../abstractions/user.service';

import {
    NotificationResponse,
    SyncCipherNotification,
    SyncFolderNotification,
} from '../models/response/notificationResponse';

export class NotificationsService implements NotificationsServiceAbstraction {
    private signalrConnection: signalR.HubConnection;
    private url: string;
    private connected = false;
    private inited = false;
    private inactive = false;
    private reconnectTimer: any = null;

    constructor(private userService: UserService, private syncService: SyncService,
        private appIdService: AppIdService, private apiService: ApiService,
        private cryptoService: CryptoService) { }

    async init(environmentService: EnvironmentService): Promise<void> {
        this.inited = false;
        this.url = 'https://notifications.bitwarden.com';
        if (environmentService.notificationsUrl != null) {
            this.url = environmentService.notificationsUrl;
        } else if (environmentService.baseUrl != null) {
            this.url = environmentService.baseUrl + '/notifications';
        }

        if (this.signalrConnection != null) {
            this.signalrConnection.off('ReceiveMessage');
            await this.signalrConnection.stop();
            this.connected = false;
            this.signalrConnection = null;
        }

        this.signalrConnection = new signalR.HubConnectionBuilder()
            .withUrl(this.url + '/hub', {
                accessTokenFactory: () => this.apiService.getActiveBearerToken(),
            })
            // .configureLogging(signalR.LogLevel.Information)
            .build();

        this.signalrConnection.on('ReceiveMessage',
            (data: any) => this.processNotification(new NotificationResponse(data)));
        this.signalrConnection.onclose(() => {
            this.connected = false;
            this.reconnect();
        });
        this.inited = true;
        if (await this.isAuthedAndUnlocked()) {
            await this.connect();
        }
    }

    async updateConnection(): Promise<void> {
        try {
            if (await this.isAuthedAndUnlocked()) {
                await this.connect();
            } else {
                await this.signalrConnection.stop();
            }
        } catch (e) {
            // tslint:disable-next-line
            console.error(e.toString());
        }
    }

    async reconnectFromActivity(): Promise<void> {
        this.inactive = false;
        if (!this.connected) {
            if (await this.isAuthedAndUnlocked()) {
                await this.reconnect();
                await this.syncService.fullSync(false);
            }
        }
    }

    async disconnectFromInactivity(): Promise<void> {
        this.inactive = true;
        if (this.connected) {
            await this.signalrConnection.stop();
        }
    }

    private async processNotification(notification: NotificationResponse) {
        const appId = await this.appIdService.getAppId();
        if (notification == null || notification.contextId === appId) {
            return;
        }

        switch (notification.type) {
            case NotificationType.SyncCipherCreate:
            case NotificationType.SyncCipherUpdate:
                await this.syncService.syncUpsertCipher(notification.payload as SyncCipherNotification,
                    notification.type === NotificationType.SyncCipherUpdate);
                break;
            case NotificationType.SyncCipherDelete:
            case NotificationType.SyncLoginDelete:
                await this.syncService.syncDeleteCipher(notification.payload as SyncCipherNotification);
                break;
            case NotificationType.SyncFolderCreate:
            case NotificationType.SyncFolderUpdate:
                await this.syncService.syncUpsertFolder(notification.payload as SyncFolderNotification,
                    notification.type === NotificationType.SyncFolderUpdate);
                break;
            case NotificationType.SyncFolderDelete:
                await this.syncService.syncDeleteFolder(notification.payload as SyncFolderNotification);
                break;
            case NotificationType.SyncVault:
            case NotificationType.SyncCiphers:
            case NotificationType.SyncSettings:
                await this.syncService.fullSync(false);
                break;
            case NotificationType.SyncOrgKeys:
                await this.apiService.refreshIdentityToken();
                await this.syncService.fullSync(true);
                // Stop so a reconnect can be made
                await this.signalrConnection.stop();
                break;
            default:
                break;
        }
    }

    private async connect() {
        await this.signalrConnection.start();
        this.connected = true;
    }

    private async reconnect() {
        if (this.reconnectTimer != null) {
            clearTimeout(this.reconnectTimer);
            this.reconnectTimer = null;
        }
        if (this.connected || !this.inited || this.inactive) {
            return;
        }
        const authedAndUnlocked = await this.isAuthedAndUnlocked();
        if (!authedAndUnlocked) {
            return;
        }

        try {
            await this.connect();
        } catch { }

        if (!this.connected) {
            this.reconnectTimer = setTimeout(() => this.reconnect(), 120000);
        }
    }

    private async isAuthedAndUnlocked() {
        if (await this.userService.isAuthenticated()) {
            return this.cryptoService.hasKey();
        }
        return false;
    }
}
