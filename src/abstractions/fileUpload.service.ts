import { CipherString } from '../models/domain';
import { CipherArrayBuffer } from '../models/domain/cipherArrayBuffer';
import { AttachmentUploadDataResponse } from '../models/response/attachmentUploadDataResponse';
import { SendFileUploadDataResponse } from '../models/response/sendFileUploadDataResponse';

export abstract class FileUploadService {
    uploadSendFile: (uploadData: SendFileUploadDataResponse, fileName: CipherString,
        encryptedFileData: CipherArrayBuffer) => Promise<any>;
    uploadCipherAttachment: (admin: boolean, uploadData: AttachmentUploadDataResponse, fileName: string,
        encryptedFileData: CipherArrayBuffer) => Promise<any>;
}
