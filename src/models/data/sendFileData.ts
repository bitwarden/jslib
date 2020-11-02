import { SendFileApi } from '../api/sendFileApi';

export class SendFileData {
    id: string;
    url: string;
    fileName: string;
    key: string;
    size: string;
    sizeName: string;

    constructor(data?: SendFileApi) {
        if (data == null) {
            return;
        }

        this.id = data.id;
        this.url = data.url;
        this.fileName = data.fileName;
        this.key = data.key;
        this.size = data.size;
        this.sizeName = data.sizeName;
    }
}
