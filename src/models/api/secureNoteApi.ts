import { BaseResponse } from '../response/baseResponse';

import { SecureNoteType } from '../../enums/secureNoteType';

export class SecureNoteApi extends BaseResponse {
    type: SecureNoteType;

    constructor(data: any = null) {
        super(data);
        if (data == null) {
            return;
        }
        this.type = this.getResponseProperty('Type');
    }
}
