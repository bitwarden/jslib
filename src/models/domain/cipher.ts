import { CipherType } from '../../enums/cipherType';

import { CipherData } from '../data/cipherData';

import { CipherView } from '../view/cipherView';

import { Attachment } from './attachment';
import { Card } from './card';
import { CipherString } from './cipherString';
import Domain from './domainBase';
import { Field } from './field';
import { Identity } from './identity';
import { Login } from './login';
import { Password } from './password';
import { SecureNote } from './secureNote';

export class Cipher extends Domain {
    id: string;
    organizationId: string;
    folderId: string;
    name: CipherString;
    notes: CipherString;
    type: CipherType;
    favorite: boolean;
    organizationUseTotp: boolean;
    edit: boolean;
    revisionDate: Date;
    localData: any;
    login: Login;
    identity: Identity;
    card: Card;
    secureNote: SecureNote;
    attachments: Attachment[];
    fields: Field[];
    passwordHistory: Password[];
    collectionIds: string[];

    constructor(obj?: CipherData, alreadyEncrypted: boolean = false, localData: any = null) {
        super();
        if (obj == null) {
            return;
        }

        this.buildDomainModel(this, obj, {
            id: null,
            userId: null,
            organizationId: null,
            folderId: null,
            name: null,
            notes: null,
        }, alreadyEncrypted, ['id', 'userId', 'organizationId', 'folderId']);

        this.type = obj.type;
        this.favorite = obj.favorite;
        this.organizationUseTotp = obj.organizationUseTotp;
        this.edit = obj.edit;
        this.revisionDate = obj.revisionDate != null ? new Date(obj.revisionDate) : null;
        this.collectionIds = obj.collectionIds;
        this.localData = localData;

        switch (this.type) {
            case CipherType.Login:
                this.login = new Login(obj.login, alreadyEncrypted);
                break;
            case CipherType.SecureNote:
                this.secureNote = new SecureNote(obj.secureNote, alreadyEncrypted);
                break;
            case CipherType.Card:
                this.card = new Card(obj.card, alreadyEncrypted);
                break;
            case CipherType.Identity:
                this.identity = new Identity(obj.identity, alreadyEncrypted);
                break;
            default:
                break;
        }

        if (obj.attachments != null) {
            this.attachments = obj.attachments.map((a) => new Attachment(a, alreadyEncrypted));
        } else {
            this.attachments = null;
        }

        if (obj.fields != null) {
            this.fields = obj.fields.map((f) => new Field(f, alreadyEncrypted));
        } else {
            this.fields = null;
        }

        if (obj.passwordHistory != null) {
            this.passwordHistory = obj.passwordHistory.map((ph) => new Password(ph, alreadyEncrypted));
        } else {
            this.passwordHistory = null;
        }
    }

    async decrypt(): Promise<CipherView> {
        const model = new CipherView(this);

        await this.decryptObj(model, {
            name: null,
            notes: null,
        }, this.organizationId);

        switch (this.type) {
            case CipherType.Login:
                model.login = await this.login.decrypt(this.organizationId);
                break;
            case CipherType.SecureNote:
                model.secureNote = await this.secureNote.decrypt(this.organizationId);
                break;
            case CipherType.Card:
                model.card = await this.card.decrypt(this.organizationId);
                break;
            case CipherType.Identity:
                model.identity = await this.identity.decrypt(this.organizationId);
                break;
            default:
                break;
        }

        const orgId = this.organizationId;

        if (this.attachments != null && this.attachments.length > 0) {
            const attachments: any[] = [];
            await this.attachments.reduce((promise, attachment) => {
                return promise.then(() => {
                    return attachment.decrypt(orgId);
                }).then((decAttachment) => {
                    attachments.push(decAttachment);
                });
            }, Promise.resolve());
            model.attachments = attachments;
        }

        if (this.fields != null && this.fields.length > 0) {
            const fields: any[] = [];
            await this.fields.reduce((promise, field) => {
                return promise.then(() => {
                    return field.decrypt(orgId);
                }).then((decField) => {
                    fields.push(decField);
                });
            }, Promise.resolve());
            model.fields = fields;
        }

        if (this.passwordHistory != null && this.passwordHistory.length > 0) {
            const passwordHistory: any[] = [];
            await this.passwordHistory.reduce((promise, ph) => {
                return promise.then(() => {
                    return ph.decrypt(orgId);
                }).then((decPh) => {
                    passwordHistory.push(decPh);
                });
            }, Promise.resolve());
            model.passwordHistory = passwordHistory;
        }

        return model;
    }

    toCipherData(userId: string): CipherData {
        const c = new CipherData();
        c.id = this.id;
        c.organizationId = this.organizationId;
        c.folderId = this.folderId;
        c.userId = this.organizationId != null ? userId : null;
        c.edit = this.edit;
        c.organizationUseTotp = this.organizationUseTotp;
        c.favorite = this.favorite;
        c.revisionDate = this.revisionDate != null ? this.revisionDate.toISOString() : null;
        c.type = this.type;
        c.collectionIds = this.collectionIds;

        this.buildDataModel(this, c, {
            name: null,
            notes: null,
        });

        switch (c.type) {
            case CipherType.Login:
                c.login = this.login.toLoginData();
                break;
            case CipherType.SecureNote:
                c.secureNote = this.secureNote.toSecureNoteData();
                break;
            case CipherType.Card:
                c.card = this.card.toCardData();
                break;
            case CipherType.Identity:
                c.identity = this.identity.toIdentityData();
                break;
            default:
                break;
        }

        if (this.fields != null) {
            c.fields = this.fields.map((f) => f.toFieldData());
        }
        if (this.attachments != null) {
            c.attachments = this.attachments.map((a) => a.toAttachmentData());
        }
        if (this.passwordHistory != null) {
            c.passwordHistory = this.passwordHistory.map((ph) => ph.toPasswordHistoryData());
        }
        return c;
    }
}
