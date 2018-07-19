import { BaseImporter } from './baseImporter';
import { Importer } from './importer';

import { ImportResult } from '../models/domain/importResult';

import { CipherType } from '../enums/cipherType';
import { CardView } from '../models/view';

const IgnoredProperties = ['ainfo', 'autosubmit', 'notesPlain', 'ps', 'scope', 'tags', 'title', 'uuid'];

export class OnePasswordWinCsvImporter extends BaseImporter implements Importer {
    parse(data: string): ImportResult {
        const result = new ImportResult();
        const results = this.parseCsv(data, true);
        if (results == null) {
            result.success = false;
            return result;
        }

        results.forEach((value) => {
            if (this.isNullOrWhitespace(value.title)) {
                return;
            }

            const cipher = this.initLoginCipher();
            cipher.name = this.getValueOrDefault(value.title, '--');
            cipher.notes = this.getValueOrDefault(value.notesPlain, '') + '\n';

            if (!this.isNullOrWhitespace(value.number) && !this.isNullOrWhitespace(value['expiry date'])) {
                cipher.type = CipherType.Card;
                cipher.card = new CardView();
            }

            let altUsername: string = null;
            for (const property in value) {
                if (!value.hasOwnProperty(property) || this.isNullOrWhitespace(value[property])) {
                    continue;
                }

                if (cipher.type === CipherType.Login) {
                    if (this.isNullOrWhitespace(cipher.login.password) && property === 'password') {
                        cipher.login.password = value[property];
                        continue;
                    } else if (this.isNullOrWhitespace(cipher.login.username) && property === 'username') {
                        cipher.login.username = value[property];
                        continue;
                    } else if ((cipher.login.uris == null || cipher.login.uri.length === 0) && property === 'urls') {
                        const urls = value[property].split(this.newLineRegex);
                        cipher.login.uris = this.makeUriArray(urls);
                        continue;
                    }
                } else if (cipher.type === CipherType.Card) {
                    if (this.isNullOrWhitespace(cipher.card.number) && property === 'number') {
                        cipher.card.number = value[property];
                        cipher.card.brand = this.getCardBrand(value.number);
                        continue;
                    } else if (this.isNullOrWhitespace(cipher.card.code) && property === 'verification number') {
                        cipher.card.code = value[property];
                        continue;
                    } else if (this.isNullOrWhitespace(cipher.card.cardholderName) && property === 'cardholder name') {
                        cipher.card.cardholderName = value[property];
                        continue;
                    } else if (this.isNullOrWhitespace(cipher.card.expiration) && property === 'expiry date' &&
                        value[property].length === 6) {
                        cipher.card.expMonth = (value[property] as string).substr(4, 2);
                        if (cipher.card.expMonth[0] === '0') {
                            cipher.card.expMonth = cipher.card.expMonth.substr(1, 1);
                        }
                        cipher.card.expYear = (value[property] as string).substr(0, 4);
                        continue;
                    } else if (property === 'type') {
                        // Skip since brand was determined from number above
                        continue;
                    }
                }

                if (IgnoredProperties.indexOf(property) === -1 && !property.startsWith('section:')) {
                    if (altUsername == null && property === 'email') {
                        altUsername = value[property];
                    }
                    this.processKvp(cipher, property, value[property]);
                }
            }

            if (cipher.type === CipherType.Login && !this.isNullOrWhitespace(altUsername) &&
                this.isNullOrWhitespace(cipher.login.username) && altUsername.indexOf('://') === -1) {
                cipher.login.username = altUsername;
            }

            this.convertToNoteIfNeeded(cipher);
            this.cleanupCipher(cipher);
            result.ciphers.push(cipher);
        });

        result.success = true;
        return result;
    }
}
