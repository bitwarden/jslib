import { ApiService } from '../abstractions/api.service';

import { Utils } from '../misc/utils';

export class BitwardenFileUploadService
{
    constructor(private apiService: ApiService) { }

    async upload(encryptedFileName: string, encryptedFileData: ArrayBuffer, apiCall: (fd: FormData) => Promise<any>) {
        const fd = new FormData();
        try {
            const blob = new Blob([encryptedFileData], { type: 'application/octet-stream' });
            fd.append('data', blob, encryptedFileName);
        } catch (e) {
            if (Utils.isNode && !Utils.isBrowser) {
                fd.append('data', Buffer.from(encryptedFileData) as any, {
                    filepath: encryptedFileName,
                    contentType: 'application/octet-stream',
                } as any);
            } else {
                throw e;
            }
        }

        await apiCall(fd);
    }
}
