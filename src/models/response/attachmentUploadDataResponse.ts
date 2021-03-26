import { FileUploadType } from '../../enums/fileUploadType';
import { BaseResponse } from './baseResponse';
import { CipherResponse } from './cipherResponse';

export class AttachmentUploadDataResponse extends BaseResponse {
    attachmentId: string;
    fileUploadType: FileUploadType;
    cipherResponse: CipherResponse;
    cipherMiniResponse: CipherResponse;
    url: string = null;
    constructor(response: any) {
        super(response);
        this.attachmentId = this.getResponseProperty('AttachmentId');
        this.fileUploadType = this.getResponseProperty('FileUploadType');
        this.cipherResponse = this.getResponseProperty('CipherResponse');
        this.cipherMiniResponse = this.getResponseProperty('CipherMiniResponse');
        this.url = this.getResponseProperty('Url');
    }

}
