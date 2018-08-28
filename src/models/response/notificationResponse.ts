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
            case NotificationType.LogOut:
                this.payload = new UserNotification(payload);
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
    collectionIds: string[];
    revisionDate: Date;

    constructor(response: any) {
        this.id = response.id || response.Id;
        this.userId = response.userId || response.UserId;
        this.organizationId = response.organizationId || response.OrganizationId;
        this.collectionIds = response.collectionIds || response.CollectionIds;
        this.revisionDate = new Date(response.revisionDate || response.RevisionDate);
    }
}

export class SyncFolderNotification {
    id: string;
    userId: string;
    revisionDate: Date;

    constructor(response: any) {
        this.id = response.id || response.Id;
        this.userId = response.userId || response.UserId;
        this.revisionDate = new Date(response.revisionDate || response.RevisionDate);
    }
}

export class UserNotification {
    userId: string;
    date: Date;

    constructor(response: any) {
        this.userId = response.userId || response.UserId;
        this.date = new Date(response.date || response.Date);
    }
}
