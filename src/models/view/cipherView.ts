import { CipherType } from '../../enums/cipherType';

import { Cipher } from '../domain/cipher';

import { AttachmentView } from './attachmentView';
import { CardView } from './cardView';
import { FieldView } from './fieldView';
import { IdentityView } from './identityView';
import { LoginView } from './loginView';
import { SecureNoteView } from './secureNoteView';
import { View } from './view';

export class CipherView implements View {
    id: string;
    organizationId: string;
    folderId: string;
    name: string;
    notes: string;
    type: CipherType;
    favorite: boolean;
    localData: any;
    login: LoginView;
    identity: IdentityView;
    card: CardView;
    secureNote: SecureNoteView;
    attachments: AttachmentView[];
    fields: FieldView[];
    collectionIds: string[];

    constructor(c?: Cipher) {
        if (!c) {
            return;
        }

        this.id = c.id;
        this.organizationId = c.organizationId;
        this.folderId = c.folderId;
        this.favorite = c.favorite;
        this.type = c.type;
        this.localData = c.localData;
        this.collectionIds = c.collectionIds;
    }

    get subTitle(): string {
        switch (this.type) {
            case CipherType.Login:
                return this.login.subTitle;
            case CipherType.SecureNote:
                return this.secureNote.subTitle;
            case CipherType.Card:
                return this.card.subTitle;
            case CipherType.Identity:
                return this.identity.subTitle;
            default:
                break;
        }

        return null;
    }

    get hasAttachments(): boolean {
        return this.attachments && this.attachments.length > 0;
    }

    get hasFields(): boolean {
        return this.fields && this.fields.length > 0;
    }
}
