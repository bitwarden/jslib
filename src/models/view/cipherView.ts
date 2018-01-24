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

    // tslint:disable-next-line
    private _subTitle: string;

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
        if (this._subTitle == null) {
            switch (this.type) {
                case CipherType.Login:
                    this._subTitle = this.login.username;
                    break;
                case CipherType.SecureNote:
                    this._subTitle = null;
                    break;
                case CipherType.Card:
                    this._subTitle = this.card.brand;
                    if (this.card.number != null && this.card.number.length >= 4) {
                        if (this._subTitle !== '') {
                            this._subTitle += ', ';
                        }
                        this._subTitle += ('*' + this.card.number.substr(this.card.number.length - 4));
                    }
                    break;
                case CipherType.Identity:
                    this._subTitle = '';
                    if (this.identity.firstName != null) {
                        this._subTitle = this.identity.firstName;
                    }
                    if (this.identity.lastName != null) {
                        if (this._subTitle !== '') {
                            this._subTitle += ' ';
                        }
                        this._subTitle += this.identity.lastName;
                    }
                    break;
                default:
                    break;
            }
        }

        return this._subTitle;
    }
}
