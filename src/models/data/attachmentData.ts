import { AttachmentResponse } from '../response/attachmentResponse';

export class AttachmentData {
    id: string;
    url: string;
    fileName: string;
    size: number;
    sizeName: string;

    constructor(response?: AttachmentResponse) {
        if (response == null) {
            return;
        }
        this.id = response.id;
        this.url = response.url;
        this.fileName = response.fileName;
        this.size = response.size;
        this.sizeName = response.sizeName;
    }
}
