import { BaseImporter } from './baseImporter';
import { Importer } from './importer';

import { ImportResult } from '../models/domain/importResult';

import { CardView } from '../models/view/cardView';
import { CipherView } from '../models/view/cipherView';
import { FolderView } from '../models/view/folderView';
import { IdentityView } from '../models/view/identityView';
import { LoginView } from '../models/view/loginView';
import { SecureNoteView } from '../models/view/secureNoteView';

import { CipherType } from '../enums/cipherType';
import { SecureNoteType } from '../enums/secureNoteType';

export class LastPassCsvImporter extends BaseImporter implements Importer {
    import(data: string): ImportResult {
        const result = new ImportResult();
        const results = this.parseCsv(data, true);
        if (results == null) {
            result.success = false;
            return result;
        }

        results.forEach((value) => {
            let folderIndex = result.folders.length;
            const cipherIndex = result.ciphers.length;
            const hasFolder = this.getValueOrDefault(value.grouping, '(none)') !== '(none)';
            let addFolder = hasFolder;

            if (hasFolder) {
                for (let i = 0; i < result.folders.length; i++) {
                    if (result.folders[i].name === value.grouping) {
                        addFolder = false;
                        folderIndex = i;
                        break;
                    }
                }
            }

            const cipher = this.buildBaseCipher(value);
            if (cipher.type === CipherType.Login) {
                cipher.notes = this.getValueOrDefault(value.extra);
                cipher.login = new LoginView();
                cipher.login.uris = this.makeUriArray(value.url);
                cipher.login.username = this.getValueOrDefault(value.username);
                cipher.login.password = this.getValueOrDefault(value.password);
            } else if (cipher.type === CipherType.SecureNote) {
                this.parseSecureNote(value, cipher);
            } else if (cipher.type === CipherType.Card) {
                cipher.card = this.parseCard(value);
                cipher.notes = this.getValueOrDefault(value.notes);
            } else if (cipher.type === CipherType.Identity) {
                cipher.identity = this.parseIdentity(value);
                cipher.notes = this.getValueOrDefault(value.notes);
                if (!this.isNullOrWhitespace(value.ccnum)) {
                    // there is a card on this identity too
                    const cardCipher = this.buildBaseCipher(value);
                    cardCipher.identity = null;
                    cardCipher.type = CipherType.Card;
                    cardCipher.card = this.parseCard(value);
                    result.ciphers.push(cardCipher);
                }
            }

            result.ciphers.push(cipher);

            if (addFolder) {
                const f = new FolderView();
                f.name = value.grouping;
                result.folders.push(f);
            }
            if (hasFolder) {
                result.folderRelationships.set(cipherIndex, folderIndex);
            }
        });

        return result;
    }

    private buildBaseCipher(value: any) {
        const cipher = new CipherView();
        if (value.hasOwnProperty('profilename') && value.hasOwnProperty('profilelanguage')) {
            // form fill
            cipher.favorite = false;
            cipher.name = this.getValueOrDefault(value.profilename, '--');
            cipher.type = CipherType.Card;

            if (!this.isNullOrWhitespace(value.title) || !this.isNullOrWhitespace(value.firstname) ||
                !this.isNullOrWhitespace(value.lastname) || !this.isNullOrWhitespace(value.address1) ||
                !this.isNullOrWhitespace(value.phone) || !this.isNullOrWhitespace(value.username) ||
                !this.isNullOrWhitespace(value.email)) {
                cipher.type = CipherType.Identity;
            }
        } else {
            // site or secure note
            cipher.favorite = this.getValueOrDefault(value.fav, '0') === '1'; // TODO: if org, always false
            cipher.name = this.getValueOrDefault(value.name, '--');
            cipher.type = value.url === 'http://sn' ? CipherType.SecureNote : CipherType.Login;
        }
        return cipher;
    }

    private parseCard(value: any): CardView {
        const card = new CardView();
        card.cardholderName = this.getValueOrDefault(value.ccname);
        card.number = this.getValueOrDefault(value.ccnum);
        card.code = this.getValueOrDefault(value.cccsc);
        card.brand = this.getCardBrand(value.ccnum);

        if (!this.isNullOrWhitespace(value.ccexp) && value.ccexp.indexOf('-') > -1) {
            const ccexpParts = (value.ccexp as string).split('-');
            if (ccexpParts.length > 1) {
                card.expYear = ccexpParts[0];
                card.expMonth = ccexpParts[1];
                if (card.expMonth.length === 2 && card.expMonth[0] === '0') {
                    card.expMonth = card.expMonth[1];
                }
            }
        }

        return card;
    }

    private parseIdentity(value: any): IdentityView {
        const identity = new IdentityView();
        identity.title = this.getValueOrDefault(value.title);
        identity.firstName = this.getValueOrDefault(value.firstname);
        identity.middleName = this.getValueOrDefault(value.middlename);
        identity.lastName = this.getValueOrDefault(value.lastname);
        identity.username = this.getValueOrDefault(value.username);
        identity.company = this.getValueOrDefault(value.company);
        identity.ssn = this.getValueOrDefault(value.ssn);
        identity.address1 = this.getValueOrDefault(value.address1);
        identity.address2 = this.getValueOrDefault(value.address2);
        identity.address3 = this.getValueOrDefault(value.address3);
        identity.city = this.getValueOrDefault(value.city);
        identity.state = this.getValueOrDefault(value.state);
        identity.postalCode = this.getValueOrDefault(value.zip);
        identity.country = this.getValueOrDefault(value.country);
        identity.email = this.getValueOrDefault(value.email);
        identity.phone = this.getValueOrDefault(value.phone);

        if (!this.isNullOrWhitespace(identity.title)) {
            identity.title = identity.title.charAt(0).toUpperCase() + identity.title.slice(1);
        }

        return identity;
    }

    private parseSecureNote(value: any, cipher: CipherView) {
        const extraParts = this.splitNewLine(value.extra);
        let processedNote = false;

        if (extraParts.length) {
            const typeParts = extraParts[0].split(':');
            if (typeParts.length > 1 && typeParts[0] === 'NoteType' &&
                (typeParts[1] === 'Credit Card' || typeParts[1] === 'Address')) {
                if (typeParts[1] === 'Credit Card') {
                    const mappedData = this.parseSecureNoteMapping<CardView>(extraParts, {
                        'Number': 'number',
                        'Name on Card': 'cardholderName',
                        'Security Code': 'code',
                    });
                    cipher.type = CipherType.Card;
                    cipher.card = mappedData[0];
                    cipher.notes = mappedData[1];
                } else if (typeParts[1] === 'Address') {
                    const mappedData = this.parseSecureNoteMapping<IdentityView>(extraParts, {
                        'Title': 'title',
                        'First Name': 'firstName',
                        'Last Name': 'lastName',
                        'Middle Name': 'middleName',
                        'Company': 'company',
                        'Address 1': 'address1',
                        'Address 2': 'address2',
                        'Address 3': 'address3',
                        'City / Town': 'city',
                        'State': 'state',
                        'Zip / Postal Code': 'postalCode',
                        'Country': 'country',
                        'Email Address': 'email',
                        'Username': 'username',
                    });
                    cipher.type = CipherType.Identity;
                    cipher.identity = mappedData[0];
                    cipher.notes = mappedData[1];
                }
                processedNote = true;
            }
        }

        if (!processedNote) {
            cipher.secureNote = new SecureNoteView();
            cipher.secureNote.type = SecureNoteType.Generic;
            cipher.notes = this.getValueOrDefault(value.extra);
        }
    }

    private parseSecureNoteMapping<T>(extraParts: string[], map: any): [T, string] {
        let notes: string = null;
        const dataObj: any = {};

        extraParts.forEach((extraPart) => {
            const fieldParts = extraPart.split(':');
            if (fieldParts.length < 1 || this.isNullOrWhitespace(fieldParts[0]) ||
                this.isNullOrWhitespace(fieldParts[1]) || fieldParts[0] === 'NoteType') {
                return;
            }

            if (fieldParts[0] === 'Notes') {
                if (!this.isNullOrWhitespace(notes)) {
                    notes += ('\n' + fieldParts[1]);
                } else {
                    notes = fieldParts[1];
                }
            } else if (map.hasOwnProperty(fieldParts[0])) {
                dataObj[map[fieldParts[0]]] = fieldParts[1];
            } else {
                if (!this.isNullOrWhitespace(notes)) {
                    notes += '\n';
                } else {
                    notes = '';
                }

                notes += (fieldParts[0] + ': ' + fieldParts[1]);
            }
        });

        return [dataObj as T, notes];
    }
}
