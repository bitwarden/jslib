import * as signalR from '@aspnet/signalr';

import { NotificationType } from '../enums/notificationType';

import { ApiService } from '../abstractions/api.service';
import { AppIdService } from '../abstractions/appId.service';
import { EnvironmentService } from '../abstractions/environment.service';
import { NotificationsService as NotificationsServiceAbstraction } from '../abstractions/notifications.service';
import { SyncService } from '../abstractions/sync.service';
import { TokenService } from '../abstractions/token.service';
import { UserService } from '../abstractions/user.service';

import {
    NotificationResponse,
    SyncCipherNotification,
    SyncFolderNotification,
} from '../models/response/notificationResponse';

export class NotificationsService implements NotificationsServiceAbstraction {
    private signalrConnection: signalR.HubConnection;
    private url: string;

    constructor(private userService: UserService, private tokenService: TokenService,
        private syncService: SyncService, private appIdService: AppIdService,
        private apiService: ApiService) { }

    async init(environmentService: EnvironmentService): Promise<void> {
        this.url = 'https://notifications.bitwarden.com';
        if (environmentService.notificationsUrl != null) {
            this.url = environmentService.notificationsUrl;
        } else if (environmentService.baseUrl != null) {
            this.url = environmentService.baseUrl + '/notifications';
        }
        this.reconnect();
    }

    async updateConnection(): Promise<void> {
        try {
            if (await this.userService.isAuthenticated()) {
                await this.signalrConnection.start();
            } else {
                await this.signalrConnection.stop();
            }
        } catch (e) {
            // tslint:disable-next-line
            console.error(e.toString());
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
                await this.syncService.syncUpsertCipher(notification.payload as SyncCipherNotification);
                break;
            case NotificationType.SyncCipherDelete:
            case NotificationType.SyncLoginDelete:
                await this.syncService.syncDeleteCipher(notification.payload as SyncCipherNotification);
                break;
            case NotificationType.SyncFolderCreate:
            case NotificationType.SyncFolderUpdate:
                await this.syncService.syncUpsertFolder(notification.payload as SyncFolderNotification);
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
                // Now reconnect to join the new org groups
                await this.reconnect();
                break;
            default:
                break;
        }
    }

    private async reconnect() {
        if (this.signalrConnection != null) {
            await this.signalrConnection.stop();
            this.signalrConnection = null;
        }

        this.signalrConnection = new signalR.HubConnectionBuilder()
            .withUrl(this.url + '/hub', {
                accessTokenFactory: () => this.tokenService.getToken(),
            })
            // .configureLogging(signalR.LogLevel.Information)
            .build();

        this.signalrConnection.on('ReceiveMessage', async (data: any) => {
            await this.processNotification(new NotificationResponse(data));
        });
        await this.updateConnection();
    }
}
