import { BaseImporter } from './baseImporter';
import { Importer } from './importer';

import { ImportResult } from '../models/domain/importResult';

import { CipherType } from '../enums/cipherType';
import { CardView, IdentityView } from '../models/view';

const IgnoredProperties = ['ainfo', 'autosubmit', 'notesplain', 'ps', 'scope', 'tags', 'title', 'uuid', 'notes'];

export class OnePasswordWinCsvImporter extends BaseImporter implements Importer {
    parse(data: string): Promise<ImportResult> {
        const result = new ImportResult();
        const results = this.parseCsv(data, true, {
            quoteChar: '"',
            escapeChar: '\\',
        });
        if (results == null) {
            result.success = false;
            return Promise.resolve(result);
        }

        results.forEach((value) => {
            if (this.isNullOrWhitespace(this.getProp(value, 'title'))) {
                return;
            }

            const cipher = this.initLoginCipher();
            cipher.name = this.getValueOrDefault(this.getProp(value, 'title'), '--');

            cipher.notes = this.getValueOrDefault(this.getProp(value, 'notesPlain'), '') + '\n' +
                this.getValueOrDefault(this.getProp(value, 'notes'), '') + '\n';
            cipher.notes.trim();

            const onePassType = this.getValueOrDefault(this.getProp(value, 'type'), 'Login')
            switch (onePassType) {
                case 'Credit Card':
                    cipher.type = CipherType.Card;
                    cipher.card = new CardView();
                    IgnoredProperties.push('type');
                    break;
                case 'Identity':
                    cipher.type = CipherType.Identity;
                    cipher.identity = new IdentityView();
                    IgnoredProperties.push('type');
                    break;
                case 'Login':
                case 'Secure Note':
                    IgnoredProperties.push('type');
                default:
                    break;
            }

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
                    } else if ((lowerProp === 'url')) {
                        if (cipher.login.uris == null) {
                            cipher.login.uris = [];
                        }
                        cipher.login.uris.concat(this.makeUriArray(value[property]));
                        continue;
                    }
                } else if (cipher.type === CipherType.Card) {
                    if (this.isNullOrWhitespace(cipher.card.number) && lowerProp.includes('number')) {
                        cipher.card.number = value[property];
                        cipher.card.brand = this.getCardBrand(this.getProp(value, 'number'));
                        continue;
                    } else if (this.isNullOrWhitespace(cipher.card.code) && lowerProp.includes('verification number')) {
                        cipher.card.code = value[property];
                        continue;
                    } else if (this.isNullOrWhitespace(cipher.card.cardholderName) && lowerProp.includes('cardholder name')) {
                        cipher.card.cardholderName = value[property];
                        continue;
                    } else if (this.isNullOrWhitespace(cipher.card.expiration) && lowerProp.includes('expiry date') &&
                        value[property].length === 7) {
                        cipher.card.expMonth = (value[property] as string).substr(0, 2);
                        if (cipher.card.expMonth[0] === '0') {
                            cipher.card.expMonth = cipher.card.expMonth.substr(1, 1);
                        }
                        cipher.card.expYear = (value[property] as string).substr(3, 4);
                        continue;
                    } else if (lowerProp === 'type' || lowerProp === 'type(type)') {
                        // Skip since brand was determined from number above
                        continue;
                    }
                } else if (cipher.type === CipherType.Identity) {
                    if (this.isNullOrWhitespace(cipher.identity.firstName) && lowerProp.includes('first name')) {
                        cipher.identity.firstName = value[property];
                        continue;
                    } else if (this.isNullOrWhitespace(cipher.identity.middleName) && lowerProp.includes('initial')) {
                        cipher.identity.middleName = value[property];
                        continue;
                    } else if (this.isNullOrWhitespace(cipher.identity.lastName) && lowerProp.includes('last name')) {
                        cipher.identity.lastName = value[property];
                        continue;
                    } else if (this.isNullOrWhitespace(cipher.identity.username) && lowerProp.includes('username')) {
                        cipher.identity.username = value[property];
                        continue;
                    } else if (this.isNullOrWhitespace(cipher.identity.company) && lowerProp.includes('company')) {
                        cipher.identity.company = value[property];
                        continue;
                    } else if (this.isNullOrWhitespace(cipher.identity.phone) && lowerProp.includes('default phone')) {
                        cipher.identity.phone = value[property];
                        continue;
                    } else if (this.isNullOrWhitespace(cipher.identity.email) && lowerProp.includes('email')) {
                        cipher.identity.email = value[property];
                        continue;
                    }
                }

                if (IgnoredProperties.indexOf(lowerProp) === -1 && !lowerProp.startsWith('section:') &&
                    !lowerProp.startsWith('section ')) {
                    if (altUsername == null && lowerProp === 'email') {
                        altUsername = value[property];
                    }
                    else if (lowerProp === 'created date' || lowerProp === 'modified date') {
                        const readableDate = new Date(parseInt(value[property], 10) * 1000).toUTCString();
                        this.processKvp(cipher, '1Password ' + property, readableDate);
                        continue;
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
        return Promise.resolve(result);
    }

    private getProp(obj: any, name: string): any {
        const lowerObj = Object.entries(obj).reduce((agg: any, entry: [string, any]) => {
            agg[entry[0].toLowerCase()] = entry[1];
            return agg;
        }, {});
        return lowerObj[name.toLowerCase()];
    }
}
