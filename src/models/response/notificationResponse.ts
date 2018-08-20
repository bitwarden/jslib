import { NotificationType } from '../../enums/notificationType';

export class NotificationResponse {
    contextId: string;
    type: NotificationType;
    payload: any;

    constructor(response: any) {
        this.contextId = response.contextId || response.ContextId;
        this.type = response.type != null ? response.type : response.Type;

        const payload = response.payload || response.Payload;
        switch (this.type) {
            case NotificationType.SyncCipherCreate:
            case NotificationType.SyncCipherDelete:
            case NotificationType.SyncCipherUpdate:
            case NotificationType.SyncLoginDelete:
                this.payload = new SyncCipherNotification(payload);
                break;
            case NotificationType.SyncFolderCreate:
            case NotificationType.SyncFolderDelete:
            case NotificationType.SyncFolderUpdate:
                this.payload = new SyncFolderNotification(payload);
                break;
            case NotificationType.SyncVault:
            case NotificationType.SyncCiphers:
            case NotificationType.SyncOrgKeys:
            case NotificationType.SyncSettings:
                this.payload = new SyncUserNotification(payload);
                break;
            default:
                break;
        }
    }
}

export class SyncCipherNotification {
    id: string;
    userId: string;
    organizationId: string;
    revisionDate: Date;

    constructor(response: any) {
        this.id = response.Id;
        this.userId = response.UserId;
        this.organizationId = response.OrganizationId;
        this.revisionDate = new Date(response.RevisionDate);
    }
}

export class SyncFolderNotification {
    id: string;
    userId: string;
    revisionDate: Date;

    constructor(response: any) {
        this.id = response.Id;
        this.userId = response.UserId;
        this.revisionDate = new Date(response.RevisionDate);
    }
}

export class SyncUserNotification {
    userId: string;
    date: Date;

    constructor(response: any) {
        this.userId = response.UserId;
        this.date = new Date(response.Date);
    }
}
