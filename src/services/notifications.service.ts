import * as signalR from '@aspnet/signalr';

import { NotificationType } from '../enums/notificationType';

import { CipherService } from '../abstractions/cipher.service';
import { CollectionService } from '../abstractions/collection.service';
import { EnvironmentService } from '../abstractions/environment.service';
import { FolderService } from '../abstractions/folder.service';
import { NotificationsService as NotificationsServiceAbstraction } from '../abstractions/notifications.service';
import { SettingsService } from '../abstractions/settings.service';
import { SyncService } from '../abstractions/sync.service';
import { TokenService } from '../abstractions/token.service';
import { UserService } from '../abstractions/user.service';

import { NotificationResponse } from '../models/response/notificationResponse';

export class NotificationsService implements NotificationsServiceAbstraction {
    private signalrConnection: signalR.HubConnection;

    constructor(private userService: UserService, private tokenService: TokenService,
        private syncService: SyncService) { }

    async init(environmentService: EnvironmentService): Promise<void> {
        let url = 'https://notifications.bitwarden.com';
        if (environmentService.notificationsUrl != null) {
            url = environmentService.notificationsUrl;
        } else if (environmentService.baseUrl != null) {
            url = environmentService.baseUrl + '/notifications';
        }

        if (this.signalrConnection != null) {
            await this.signalrConnection.stop();
            this.signalrConnection = null;
        }

        this.signalrConnection = new signalR.HubConnectionBuilder()
            .withUrl(url + '/hub', {
                accessTokenFactory: () => this.tokenService.getToken(),
            })
            .configureLogging(signalR.LogLevel.Information)
            .build();

        this.signalrConnection.on('ReceiveMessage', async (data: any) => {
            await this.processNotification(new NotificationResponse(data));
        });

        this.updateConnection();
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
        if (notification == null) {
            return;
        }

        switch (notification.type) {
            case NotificationType.SyncCipherCreate:
            case NotificationType.SyncCipherDelete:
            case NotificationType.SyncCipherUpdate:
            case NotificationType.SyncLoginDelete:
                this.syncService.fullSync(false);
                break;
            case NotificationType.SyncFolderCreate:
            case NotificationType.SyncFolderDelete:
            case NotificationType.SyncFolderUpdate:
                this.syncService.fullSync(false);
                break;
            case NotificationType.SyncVault:
            case NotificationType.SyncCiphers:
            case NotificationType.SyncOrgKeys:
            case NotificationType.SyncSettings:
                this.syncService.fullSync(false);
                break;
            default:
                break;
        }
    }
}
