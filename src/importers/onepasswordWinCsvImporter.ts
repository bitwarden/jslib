import { BaseImporter } from './baseImporter';
import { Importer } from './importer';

import { ImportResult } from '../models/domain/importResult';

import { CipherType } from '../enums/cipherType';
import { CardView } from '../models/view';

const IgnoredProperties = ['ainfo', 'autosubmit', 'notesplain', 'ps', 'scope', 'tags', 'title', 'uuid'];

export class OnePasswordWinCsvImporter extends BaseImporter implements Importer {
    parse(data: string): ImportResult {
        const result = new ImportResult();
        const results = this.parseCsv(data, true);
        if (results == null) {
            result.success = false;
            return result;
        }

        results.forEach((value) => {
            if (this.isNullOrWhitespace(this.getProp(value, 'title'))) {
                return;
            }

            const cipher = this.initLoginCipher();
            cipher.name = this.getValueOrDefault(this.getProp(value, 'title'), '--');
            cipher.notes = this.getValueOrDefault(this.getProp(value, 'notesPlain'), '') + '\n';

            if (!this.isNullOrWhitespace(this.getProp(value, 'number')) &&
                !this.isNullOrWhitespace(this.getProp(value, 'expiry date'))) {
                cipher.type = CipherType.Card;
                cipher.card = new CardView();
            }

            let altUsername: string = null;
            for (const property in value) {
                if (!value.hasOwnProperty(property) || this.isNullOrWhitespace(value[property])) {
                    continue;
                }

                const lowerProp = property.toLowerCase();
                if (cipher.type === CipherType.Login) {
                    if (this.isNullOrWhitespace(cipher.login.password) && lowerProp === 'password') {
                        cipher.login.password = value[property];
                        continue;
                    } else if (this.isNullOrWhitespace(cipher.login.username) && lowerProp === 'username') {
                        cipher.login.username = value[property];
                        continue;
                    } else if ((cipher.login.uris == null || cipher.login.uri.length === 0) && lowerProp === 'urls') {
                        const urls = value[property].split(this.newLineRegex);
                        cipher.login.uris = this.makeUriArray(urls);
                        continue;
                    }
                } else if (cipher.type === CipherType.Card) {
                    if (this.isNullOrWhitespace(cipher.card.number) && lowerProp === 'number') {
                        cipher.card.number = value[property];
                        cipher.card.brand = this.getCardBrand(this.getProp(value, 'number'));
                        continue;
                    } else if (this.isNullOrWhitespace(cipher.card.code) && lowerProp === 'verification number') {
                        cipher.card.code = value[property];
                        continue;
                    } else if (this.isNullOrWhitespace(cipher.card.cardholderName) && lowerProp === 'cardholder name') {
                        cipher.card.cardholderName = value[property];
                        continue;
                    } else if (this.isNullOrWhitespace(cipher.card.expiration) && lowerProp === 'expiry date' &&
                        value[property].length === 6) {
                        cipher.card.expMonth = (value[property] as string).substr(4, 2);
                        if (cipher.card.expMonth[0] === '0') {
                            cipher.card.expMonth = cipher.card.expMonth.substr(1, 1);
                        }
                        cipher.card.expYear = (value[property] as string).substr(0, 4);
                        continue;
                    } else if (lowerProp === 'type') {
                        // Skip since brand was determined from number above
                        continue;
                    }
                }

                if (IgnoredProperties.indexOf(lowerProp) === -1 && !lowerProp.startsWith('section:') &&
                    !lowerProp.startsWith('section ')) {
                    if (altUsername == null && lowerProp === 'email') {
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

    private getProp(obj: any, name: string): any {
        return obj[name] || obj[name.toUpperCase()];
    }
}
