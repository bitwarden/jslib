import { BaseResponse } from './baseResponse';

import { DeviceType } from '../../enums/deviceType';
import { EventType } from '../../enums/eventType';

export class EventResponse extends BaseResponse {
    type: EventType;
    userId: string;
    organizationId: string;
    cipherId: string;
    collectionId: string;
    groupId: string;
    organizationUserId: string;
    actingUserId: string;
    date: string;
    deviceType: DeviceType;
    ipAddress: string;

    constructor(response: any) {
        super(response);
        this.type = this.getResponseProperty('Type');
        this.userId = this.getResponseProperty('UserId');
        this.organizationId = this.getResponseProperty('OrganizationId');
        this.cipherId = this.getResponseProperty('CipherId');
        this.collectionId = this.getResponseProperty('CollectionId');
        this.groupId = this.getResponseProperty('GroupId');
        this.organizationUserId = this.getResponseProperty('OrganizationUserId');
        this.actingUserId = this.getResponseProperty('ActingUserId');
        this.date = this.getResponseProperty('Date');
        this.deviceType = this.getResponseProperty('DeviceType');
        this.ipAddress = this.getResponseProperty('IpAddress');
    }
}
