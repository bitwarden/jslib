import { BaseResponse } from './baseResponse';

import { DeviceType } from '../../enums/deviceType';

export class DeviceResponse extends BaseResponse {
    id: string;
    name: number;
    identifier: string;
    type: DeviceType;
    creationDate: string;

    constructor(response: any) {
        super(response);
        this.id = this.getResponseProperty('Id');
        this.name = this.getResponseProperty('Name');
        this.identifier = this.getResponseProperty('Identifier');
        this.type = this.getResponseProperty('Type');
        this.creationDate = this.getResponseProperty('CreationDate');
    }
}
