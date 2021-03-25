import { ApiService } from '../abstractions/api.service';

import { Utils } from '../misc/utils';

import { CipherString } from '../models/domain';
import { SendResponse } from '../models/response/sendResponse';

export class BitwardenFileUploadService
{
    constructor(private apiService: ApiService) { }

    async upload(sendResponse: SendResponse, fileName: CipherString, data: ArrayBuffer) {
        const fd = new FormData();
        try {
            const blob = new Blob([data], { type: 'application/octet-stream' });
            fd.append('data', blob, fileName.encryptedString);
        } catch (e) {
            if (Utils.isNode && !Utils.isBrowser) {
                fd.append('data', Buffer.from(data) as any, {
                    filepath: fileName.encryptedString,
                    contentType: 'application/octet-stream',
                } as any);
            } else {
                throw e;
            }
        }
        await this.apiService.postSendFile(sendResponse.id, sendResponse.file.id, fd);
    }
}
