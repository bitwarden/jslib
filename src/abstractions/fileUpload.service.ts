import { CipherString } from '../models/domain';
import { SendFileUploadDataResponse } from '../models/response/sendFileUploadDataResponse';

export abstract class FileUploadService {
    uploadSendFile: (uploadData: SendFileUploadDataResponse, fileName: CipherString,
        encryptedFileData: ArrayBuffer) => Promise<any>;
}
