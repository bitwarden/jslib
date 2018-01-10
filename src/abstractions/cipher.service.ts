import { CipherData } from '../models/data/cipherData';

import { Cipher } from '../models/domain/cipher';
import { Field } from '../models/domain/field';
import { SymmetricCryptoKey } from '../models/domain/symmetricCryptoKey';

export interface CipherService {
    decryptedCipherCache: any[];
    clearCache(): void;
    encrypt(model: any): Promise<Cipher>;
    encryptFields(fieldsModel: any[], key: SymmetricCryptoKey): Promise<Field[]>;
    encryptField(fieldModel: any, key: SymmetricCryptoKey): Promise<Field>;
    get(id: string): Promise<Cipher>;
    getAll(): Promise<Cipher[]>;
    getAllDecrypted(): Promise<any[]>;
    getAllDecryptedForGrouping(groupingId: string, folder?: boolean): Promise<any[]>;
    getAllDecryptedForDomain(domain: string, includeOtherTypes?: any[]): Promise<any[]>;
    getLastUsedForDomain(domain: string): Promise<any>;
    updateLastUsedDate(id: string): Promise<void>;
    saveNeverDomain(domain: string): Promise<void>;
    saveWithServer(cipher: Cipher): Promise<any>;
    saveAttachmentWithServer(cipher: Cipher, unencryptedFile: any): Promise<any>;
    upsert(cipher: CipherData | CipherData[]): Promise<any>;
    replace(ciphers: { [id: string]: CipherData; }): Promise<any>;
    clear(userId: string): Promise<any>;
    delete(id: string | string[]): Promise<any>;
    deleteWithServer(id: string): Promise<any>;
    deleteAttachment(id: string, attachmentId: string): Promise<void>;
    deleteAttachmentWithServer(id: string, attachmentId: string): Promise<void>;
    sortCiphersByLastUsed(a: any, b: any): number;
    sortCiphersByLastUsedThenName(a: any, b: any): number;
}
