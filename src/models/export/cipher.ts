import { CipherType } from '../../enums/cipherType';

import { CipherView } from '../view/cipherView';

import { Cipher as CipherDomain } from '../domain/cipher';
import { CipherString } from '../domain/cipherString';

import { Card } from './card';
import { Field } from './field';
import { Identity } from './identity';
import { Login } from './login';
import { SecureNote } from './secureNote';

export class Cipher {
    static template(): Cipher {
        const req = new Cipher();
        req.organizationId = null;
        req.folderId = null;
        req.type = CipherType.Login;
        req.name = 'Item name';
        req.notes = 'Some notes about this item.';
        req.favorite = false;
        req.fields = [];
        req.login = null;
        req.secureNote = null;
        req.card = null;
        req.identity = null;
        return req;
    }

    static toView(req: Cipher, view = new CipherView()) {
        view.type = req.type;
        view.folderId = req.folderId;
        if (view.organizationId == null) {
            view.organizationId = req.organizationId;
        }
        view.name = req.name;
        view.notes = req.notes;
        view.favorite = req.favorite;

        if (req.fields != null) {
            view.fields = req.fields.map((f) => Field.toView(f));
        }

        switch (req.type) {
            case CipherType.Login:
                view.login = Login.toView(req.login);
                break;
            case CipherType.SecureNote:
                view.secureNote = SecureNote.toView(req.secureNote);
                break;
            case CipherType.Card:
                view.card = Card.toView(req.card);
                break;
            case CipherType.Identity:
                view.identity = Identity.toView(req.identity);
                break;
        }

        return view;
    }

    static toDomain(req: Cipher, domain = new CipherDomain()) {
        domain.type = req.type;
        domain.folderId = req.folderId;
        if (domain.organizationId == null) {
            domain.organizationId = req.organizationId;
        }
        domain.name = req.name != null ? new CipherString(req.name) : null;
        domain.notes = req.notes != null ? new CipherString(req.notes) : null;
        domain.favorite = req.favorite;

        if (req.fields != null) {
            domain.fields = req.fields.map((f) => Field.toDomain(f));
        }

        switch (req.type) {
            case CipherType.Login:
                domain.login = Login.toDomain(req.login);
                break;
            case CipherType.SecureNote:
                domain.secureNote = SecureNote.toDomain(req.secureNote);
                break;
            case CipherType.Card:
                domain.card = Card.toDomain(req.card);
                break;
            case CipherType.Identity:
                domain.identity = Identity.toDomain(req.identity);
                break;
        }

        return domain;
    }

    type: CipherType;
    folderId: string;
    organizationId: string;
    name: string;
    notes: string;
    favorite: boolean;
    fields: Field[];
    login: Login;
    secureNote: SecureNote;
    card: Card;
    identity: Identity;

    // Use build method instead of ctor so that we can control order of JSON stringify for pretty print
    build(o: CipherView | CipherDomain) {
        this.organizationId = o.organizationId;
        this.folderId = o.folderId;
        this.type = o.type;

        if (o instanceof CipherView) {
            this.name = o.name;
            this.notes = o.notes;
        } else {
            this.name = o.name?.encryptedString;
            this.notes = o.notes?.encryptedString;
        }

        this.favorite = o.favorite;

        if (o.fields != null) {
            if (o instanceof CipherView) {
                this.fields = o.fields.map((f) => new Field(f));
            } else {
                this.fields = o.fields.map((f) => new Field(f));
            }
        }

        switch (o.type) {
            case CipherType.Login:
                this.login = new Login(o.login);
                break;
            case CipherType.SecureNote:
                this.secureNote = new SecureNote(o.secureNote);
                break;
            case CipherType.Card:
                this.card = new Card(o.card);
                break;
            case CipherType.Identity:
                this.identity = new Identity(o.identity);
                break;
        }
    }
}
