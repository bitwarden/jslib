import { BaseImporter } from './baseImporter';
import { Importer } from './importer';

import { ImportResult } from '../models/domain/importResult';

import { CardView } from '../models/view/cardView';
import { CipherView } from '../models/view/cipherView';

import { CipherType } from '../enums/cipherType';

export class EnpassJsonImporter extends BaseImporter implements Importer {
    parse(data: string): ImportResult {
        const result = new ImportResult();
        const results = JSON.parse(data);
        if (results == null || results.items == null || results.items.length === 0) {
            result.success = false;
            return result;
        }

        results.items.forEach((item: any) => {
            const cipher = this.initLoginCipher();
            cipher.name = this.getValueOrDefault(item.title);
            cipher.favorite = item.favorite > 0;

            if (item.template_type != null && item.fields != null && item.fields.length > 0) {
                if (item.template_type.indexOf('login.') === 0 || item.template_type.indexOf('password.') === 0) {
                    this.processLogin(cipher, item.fields);
                } else if (item.template_type.indexOf('creditcard.') === 0) {
                    this.processCard(cipher, item.fields);
                } else if (item.template_type.indexOf('identity.') < 0 &&
                    item.fields.find((f: any) => f.type === 'password' && !this.isNullOrWhitespace(f.value)) != null) {
                    this.processLogin(cipher, item.fields);
                } else {
                    this.processNote(cipher, item.fields);
                }
            }

            cipher.notes += ('\n' + this.getValueOrDefault(item.note, ''));
            this.convertToNoteIfNeeded(cipher);
            this.cleanupCipher(cipher);
            result.ciphers.push(cipher);
        });

        result.success = true;
        return result;
    }

    private processLogin(cipher: CipherView, fields: any[]) {
        const urls: string[] = [];
        fields.forEach((field: any) => {
            if (this.isNullOrWhitespace(field.value) || field.type === 'section') {
                return;
            }

            if ((field.type === 'username' || field.type === 'email') &&
                this.isNullOrWhitespace(cipher.login.username)) {
                cipher.login.username = field.value;
            } else if (field.type === 'password' && this.isNullOrWhitespace(cipher.login.password)) {
                cipher.login.password = field.value;
            } else if (field.type === 'totp' && this.isNullOrWhitespace(cipher.login.totp)) {
                cipher.login.totp = field.value;
            } else if (field.type === 'url') {
                urls.push(field.value);
            } else {
                this.processKvp(cipher, field.label, field.value);
            }
        });
        cipher.login.uris = this.makeUriArray(urls);
    }

    private processCard(cipher: CipherView, fields: any[]) {
        cipher.card = new CardView();
        cipher.type = CipherType.Card;
        fields.forEach((field: any) => {
            if (this.isNullOrWhitespace(field.value) || field.type === 'section' || field.type === 'ccType') {
                return;
            }

            if (field.type === 'ccName' && this.isNullOrWhitespace(cipher.card.cardholderName)) {
                cipher.card.cardholderName = field.value;
            } else if (field.type === 'ccNumber' && this.isNullOrWhitespace(cipher.card.number)) {
                cipher.card.number = field.value;
                cipher.card.brand = this.getCardBrand(cipher.card.number);
            } else if (field.type === 'ccCvc' && this.isNullOrWhitespace(cipher.card.code)) {
                cipher.card.code = field.value;
            } else if (field.type === 'ccExpiry' && this.isNullOrWhitespace(cipher.card.expYear)) {
                if (!this.setCardExpiration(cipher, field.value)) {
                    this.processKvp(cipher, field.label, field.value);
                }
            } else {
                this.processKvp(cipher, field.label, field.value);
            }
        });
    }

    private processNote(cipher: CipherView, fields: any[]) {
        fields.forEach((field: any) => {
            if (this.isNullOrWhitespace(field.value) || field.type === 'section') {
                return;
            }
            this.processKvp(cipher, field.label, field.value);
        });
    }
}
