import { DeviceType } from '../../enums/deviceType';
import { EventType } from '../../enums/eventType';

export class EventResponse {
    type: EventType;
    userId: string;
    organizationId: string;
    cipherId: string;
    groupId: string;
    organizationUserId: string;
    actingUserId: string;
    date: Date;
    deviceType: DeviceType;
    ipAddress: string;

    constructor(response: any) {
        this.type = response.Type;
        this.userId = response.UserId;
        this.organizationId = response.OrganizationId;
        this.cipherId = response.CipherId;
        this.groupId = response.GroupId;
        this.organizationUserId = response.OrganizationUserId;
        this.actingUserId = response.ActingUserId;
        this.date = response.Date;
        this.deviceType = response.DeviceType;
        this.ipAddress = response.IpAddress;
    }
}
