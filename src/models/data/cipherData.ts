import { CipherType } from '../../enums/cipherType';

import { AttachmentData } from './attachmentData';
import { CardData } from './cardData';
import { FieldData } from './fieldData';
import { IdentityData } from './identityData';
import { LoginData } from './loginData';
import { PasswordHistoryData } from './passwordHistoryData';
import { SecureNoteData } from './secureNoteData';

import { CipherResponse } from '../response/cipherResponse';

export class CipherData {
    id: string;
    organizationId: string;
    folderId: string;
    userId: string;
    edit: boolean;
    organizationUseTotp: boolean;
    favorite: boolean;
    revisionDate: string;
    type: CipherType;
    sizeName: string;
    name: string;
    notes: string;
    login?: LoginData;
    secureNote?: SecureNoteData;
    card?: CardData;
    identity?: IdentityData;
    fields?: FieldData[];
    attachments?: AttachmentData[];
    passwordHistory?: PasswordHistoryData[];
    collectionIds?: string[];

    constructor(response?: CipherResponse, userId?: string, collectionIds?: string[]) {
        if (response == null) {
            return;
        }

        this.id = response.id;
        this.organizationId = response.organizationId;
        this.folderId = response.folderId;
        this.userId = userId;
        this.edit = response.edit;
        this.organizationUseTotp = response.organizationUseTotp;
        this.favorite = response.favorite;
        this.revisionDate = response.revisionDate;
        this.type = response.type;
        this.name = response.name;
        this.notes = response.notes;
        this.collectionIds = collectionIds != null ? collectionIds : response.collectionIds;

        switch (this.type) {
            case CipherType.Login:
                this.login = new LoginData(response.login);
                break;
            case CipherType.SecureNote:
                this.secureNote = new SecureNoteData(response.secureNote);
                break;
            case CipherType.Card:
                this.card = new CardData(response.card);
                break;
            case CipherType.Identity:
                this.identity = new IdentityData(response.identity);
                break;
            default:
                break;
        }

        if (response.fields != null) {
            this.fields = response.fields.map((f) => new FieldData(f));
        }
        if (response.attachments != null) {
            this.attachments = response.attachments.map((a) => new AttachmentData(a));
        }
        if (response.passwordHistory != null) {
            this.passwordHistory = response.passwordHistory.map((ph) => new PasswordHistoryData(ph));
        }
    }
}
