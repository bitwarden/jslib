import { BaseResponse } from '../response/baseResponse';

import { FieldType } from '../../enums/fieldType';

export class FieldApi extends BaseResponse {
    name: string;
    value: string;
    type: FieldType;

    constructor(data: any = null) {
        super(data);
        if (data == null) {
            return;
        }
        this.type = this.getResponseProperty('Type');
        this.name = this.getResponseProperty('Name');
        this.value = this.getResponseProperty('Value');
    }
}
