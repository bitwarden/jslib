import { BaseResponse } from '../response/baseResponse';

export class SendFileApi extends BaseResponse {
    id: string;
    url: string;
    fileName: string;
    key: string;
    size: string;
    sizeName: string;

    constructor(data: any = null) {
        super(data);
        if (data == null) {
            return;
        }
        this.id = this.getResponseProperty('Id');
        this.url = this.getResponseProperty('Url');
        this.fileName = this.getResponseProperty('FileName');
        this.key = this.getResponseProperty('Key');
        this.size = this.getResponseProperty('Size');
        this.sizeName = this.getResponseProperty('SizeName');
    }
}
