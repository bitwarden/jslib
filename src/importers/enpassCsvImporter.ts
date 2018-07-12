import { BaseImporter } from './baseImporter';
import { Importer } from './importer';

import { ImportResult } from '../models/domain/importResult';

import { CipherType } from '../enums/cipherType';
import { SecureNoteType } from '../enums/secureNoteType';

import { CardView } from '../models/view/cardView';
import { SecureNoteView } from '../models/view/secureNoteView';

export class EnpassCsvImporter extends BaseImporter implements Importer {
    parse(data: string): ImportResult {
        const result = new ImportResult();
        const results = this.parseCsv(data, false);
        if (results == null) {
            result.success = false;
            return result;
        }

        let firstRow = true;
        results.forEach((value) => {
            if (value.length < 2 || (firstRow && value[0] === 'Title')) {
                firstRow = false;
                return;
            }

            const cipher = this.initLoginCipher();
            cipher.notes = this.getValueOrDefault(value[value.length - 1]);
            cipher.name = this.getValueOrDefault(value[0], '--');

            if (value.length === 2 || (value.indexOf('Username') < 0 && value.indexOf('Password') < 0 &&
                value.indexOf('Email') && value.indexOf('URL') < 0)) {
                cipher.type = CipherType.SecureNote;
                cipher.secureNote = new SecureNoteView();
                cipher.secureNote.type = SecureNoteType.Generic;
            }

            if (value.indexOf('Cardholder') > -1 && value.indexOf('Number') > -1 && value.indexOf('Expiry date') > -1) {
                cipher.type = CipherType.Card;
                cipher.card = new CardView();
            }

            if (value.length > 2 && (value.length % 2) === 0) {
                for (let i = 0; i < value.length - 2; i += 2) {
                    const fieldValue: string = value[i + 2];
                    if (this.isNullOrWhitespace(fieldValue)) {
                        continue;
                    }

                    const fieldName: string = value[i + 1];
                    const fieldNameLower = fieldName.toLowerCase();

                    if (cipher.type === CipherType.Login) {
                        if (fieldNameLower === 'url' && (cipher.login.uris == null || cipher.login.uris.length === 0)) {
                            cipher.login.uris = this.makeUriArray(fieldValue);
                            continue;
                        } else if ((fieldNameLower === 'username' || fieldNameLower === 'email') &&
                            this.isNullOrWhitespace(cipher.login.username)) {
                            cipher.login.username = fieldValue;
                            continue;
                        } else if (fieldNameLower === 'password' && this.isNullOrWhitespace(cipher.login.password)) {
                            cipher.login.password = fieldValue;
                            continue;
                        } else if (fieldNameLower === 'totp' && this.isNullOrWhitespace(cipher.login.totp)) {
                            cipher.login.totp = fieldValue;
                            continue;
                        }
                    } else if (cipher.type === CipherType.Card) {
                        if (fieldNameLower === 'cardholder' && this.isNullOrWhitespace(cipher.card.cardholderName)) {
                            cipher.card.cardholderName = fieldValue;
                            continue;
                        } else if (fieldNameLower === 'number' && this.isNullOrWhitespace(cipher.card.number)) {
                            cipher.card.number = fieldValue;
                            cipher.card.brand = this.getCardBrand(fieldValue);
                            continue;
                        } else if (fieldNameLower === 'cvc' && this.isNullOrWhitespace(cipher.card.code)) {
                            cipher.card.code = fieldValue;
                            continue;
                        } else if (fieldNameLower === 'expiry date' && this.isNullOrWhitespace(cipher.card.expMonth) &&
                            this.isNullOrWhitespace(cipher.card.expYear)) {
                            const parts = fieldValue.split('/');
                            if (parts.length === 2) {
                                let month: string = null;
                                let year: string = null;
                                if (parts[0].length === 1 || parts[0].length === 2) {
                                    month = parts[0];
                                    if (month.length === 2 && month[0] === '0') {
                                        month = month.substr(1, 1);
                                    }
                                }
                                if (parts[1].length === 2 || parts[1].length === 4) {
                                    year = month.length === 2 ? '20' + parts[1] : parts[1];
                                }
                                if (month != null && year != null) {
                                    cipher.card.expMonth = month;
                                    cipher.card.expYear = year;
                                    continue;
                                }
                            }
                        } else if (fieldNameLower === 'type') {
                            // Skip since brand was determined from number above
                            continue;
                        }
                    }

                    this.processKvp(cipher, fieldName, fieldValue);
                }
            }

            this.cleanupCipher(cipher);
            result.ciphers.push(cipher);
        });

        result.success = true;
        return result;
    }
}
