import { CipherString } from '../models/domain';
import { AttachmentUploadDataResponse } from '../models/response/attachmentUploadDataResponse';
import { SendFileUploadDataResponse } from '../models/response/sendFileUploadDataResponse';

export abstract class FileUploadService {
    uploadSendFile: (uploadData: SendFileUploadDataResponse, fileName: CipherString,
        encryptedFileData: ArrayBuffer) => Promise<any>;
    uploadCipherAttachment: (admin: boolean, uploadData: AttachmentUploadDataResponse, fileName: string,
        encryptedFileData: ArrayBuffer) => Promise<any>;
}
