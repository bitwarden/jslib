import { DeviceType } from '../../enums';
import { EventType } from '../../enums/eventType';

export class EventView {
    message: string;
    humanReadableMessage: string;
    appIcon: string;
    deviceType: DeviceType;
    appName: string;
    userId: string;
    userName: string;
    userEmail: string;
    date: string;
    ip: string;
    type: EventType;

    constructor(data: Required<EventView>) {
        this.message = data.message;
        this.humanReadableMessage = data.humanReadableMessage;
        this.appIcon = data.appIcon;
        this.appName = data.appName;
        this.deviceType = data.deviceType;
        this.userId = data.userId;
        this.userName = data.userName;
        this.userEmail = data.userEmail;
        this.date = data.date;
        this.ip = data.ip;
        this.type = data.type;
    }
}
