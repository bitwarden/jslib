import { FileUploadType } from '../../enums/fileUploadType';

import { BaseResponse } from './baseResponse';
import { SendResponse } from './sendResponse';

export class SendFileUploadDataResponse extends BaseResponse {

    fileUploadType: FileUploadType;
    sendResponse: SendResponse;
    url: string = null;
    constructor(response: any) {
        super(response);
        this.fileUploadType = this.getResponseProperty('FileUploadType');
        this.sendResponse = this.getResponseProperty('SendResponse');
        this.url = this.getResponseProperty('Url');
    }
}
