import { BaseImporter } from './baseImporter';
import { Importer } from './importer';

import { ImportResult } from '../models/domain/importResult';

import { CardView } from '../models/view/cardView';
import { CipherView } from '../models/view/cipherView';
import { SecureNoteView } from '../models/view/secureNoteView';

import { CipherType } from '../enums/cipherType';
import { SecureNoteType } from '../enums/secureNoteType';

export class OnePassword1PifImporter extends BaseImporter implements Importer {
    result = new ImportResult();

    parse(data: string): ImportResult {
        data.split(this.newLineRegex).forEach((line) => {
            if (this.isNullOrWhitespace(line) || line[0] !== '{') {
                return;
            }
            const item = JSON.parse(line);
            const cipher = this.initLoginCipher();
            cipher.favorite = item.openContents && item.openContents.faveIndex ? true : false;
            cipher.name = this.getValueOrDefault(item.title, '--');

            if (item.typeName === 'securenotes.SecureNote') {
                cipher.type = CipherType.SecureNote;
                cipher.secureNote = new SecureNoteView();
                cipher.secureNote.type = SecureNoteType.Generic;
            } else if (item.typeName === 'wallet.financial.CreditCard') {
                cipher.type = CipherType.Card;
                cipher.card = new CardView();
            } else {
                cipher.login.uris = this.makeUriArray(item.location);
            }

            if (item.secureContents != null) {
                if (!this.isNullOrWhitespace(item.secureContents.notesPlain)) {
                    cipher.notes = item.secureContents.notesPlain.split(this.newLineRegex).join('\n') + '\n';
                }
                if (item.secureContents.fields != null) {
                    this.parseFields(item.secureContents.fields, cipher, 'designation', 'value', 'name');
                }
                if (item.secureContents.sections != null) {
                    item.secureContents.sections.forEach((section) => {
                        if (section.fields != null) {
                            this.parseFields(section.fields, cipher, 'n', 'v', 't');
                        }
                    });
                }
            }

            this.cleanupCipher(cipher);
            this.result.ciphers.push(cipher);
        });

        this.result.success = true;
        return this.result;
    }

    private parseFields(fields: any[], cipher: CipherView, designationKey: string, valueKey: string, nameKey: string) {
        fields.forEach((field: any) => {
            if (field[valueKey] == null || field[valueKey].toString().trim() === '') {
                return;
            }

            const fieldValue = field[valueKey].toString();
            const fieldDesignation = field[designationKey] != null ? field[designationKey].toString() : null;

            if (cipher.type === CipherType.Login) {
                if (this.isNullOrWhitespace(cipher.login.username) && fieldDesignation === 'username') {
                    cipher.login.username = fieldValue;
                    return;
                } else if (this.isNullOrWhitespace(cipher.login.password) && fieldDesignation === 'password') {
                    cipher.login.password = fieldValue;
                    return;
                } else if (this.isNullOrWhitespace(cipher.login.totp) && fieldDesignation != null &&
                    fieldDesignation.startsWith('TOTP_')) {
                    cipher.login.totp = fieldValue;
                    return;
                }
            } else if (cipher.type === CipherType.Card) {
                if (this.isNullOrWhitespace(cipher.card.number) && fieldDesignation === 'ccnum') {
                    cipher.card.number = fieldValue;
                    cipher.card.brand = this.getCardBrand(fieldValue);
                    return;
                } else if (this.isNullOrWhitespace(cipher.card.code) && fieldDesignation === 'cvv') {
                    cipher.card.code = fieldValue;
                    return;
                } else if (this.isNullOrWhitespace(cipher.card.cardholderName) && fieldDesignation === 'cardholder') {
                    cipher.card.cardholderName = fieldValue;
                    return;
                } else if (this.isNullOrWhitespace(cipher.card.expiration) && fieldDesignation === 'expiry' &&
                    fieldValue.length === 6) {
                    cipher.card.expMonth = (fieldValue as string).substr(4, 2);
                    if (cipher.card.expMonth[0] === '0') {
                        cipher.card.expMonth = cipher.card.expMonth.substr(1, 1);
                    }
                    cipher.card.expYear = (fieldValue as string).substr(0, 4);
                    return;
                } else if (fieldDesignation === 'type') {
                    // Skip since brand was determined from number above
                    return;
                }
            }

            const fieldName = this.isNullOrWhitespace(field[nameKey]) ? 'no_name' : field[nameKey];
            this.processKvp(cipher, fieldName, fieldValue);
        });
    }
}
