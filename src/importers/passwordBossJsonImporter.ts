import { BaseImporter } from './baseImporter';
import { Importer } from './importer';

import { ImportResult } from '../models/domain/importResult';

import { CardView } from '../models/view/cardView';

import { CipherType } from '../enums/cipherType';

export class PasswordBossJsonImporter extends BaseImporter implements Importer {
    parse(data: string): ImportResult {
        const result = new ImportResult();
        const results = JSON.parse(data);
        if (results == null) {
            result.success = false;
            return result;
        }

        results.forEach((value: any) => {
            const cipher = this.initLoginCipher();
            cipher.name = this.getValueOrDefault(value.name, '--');
            cipher.login.uris = this.makeUriArray(value.login_url);

            if (value.identifiers == null) {
                return;
            }

            if (!this.isNullOrWhitespace(value.identifiers.notes)) {
                cipher.notes = value.identifiers.notes.split('\\r\\n').join('\n').split('\\n').join('\n');
            }

            if (value.type === 'CreditCard') {
                cipher.card = new CardView();
                cipher.type = CipherType.Card;
            }

            for (const property in value.identifiers) {
                if (!value.identifiers.hasOwnProperty(property)) {
                    continue;
                }
                const valObj = value.identifiers[property];
                const val = valObj != null ? valObj.toString() : null;
                if (this.isNullOrWhitespace(val) || property === 'notes' || property === 'ignoreItemInSecurityScore') {
                    continue;
                }

                if (cipher.type === CipherType.Card) {
                    if (property === 'cardNumber') {
                        cipher.card.number = val;
                        cipher.card.brand = this.getCardBrand(val);
                        continue;
                    } else if (property === 'nameOnCard') {
                        cipher.card.cardholderName = val;
                        continue;
                    } else if (property === 'security_code') {
                        cipher.card.code = val;
                        continue;
                    } else if (property === 'expires') {
                        try {
                            const expDate = new Date(val);
                            cipher.card.expYear = expDate.getFullYear().toString();
                            cipher.card.expMonth = (expDate.getMonth() + 1).toString();
                        } catch { }
                        continue;
                    } else if (property === 'cardType') {
                        continue;
                    }
                } else {
                    if (property === 'username') {
                        cipher.login.username = val;
                        continue;
                    } else if (property === 'password') {
                        cipher.login.password = val;
                        continue;
                    } else if ((cipher.login.uris == null || cipher.login.uris.length === 0) &&
                        this.uriFieldNames.indexOf(property) > -1) {
                        cipher.login.uris = this.makeUriArray(val);
                        continue;
                    }
                }

                this.processKvp(cipher, property, val);
            }

            this.convertToNoteIfNeeded(cipher);
            this.cleanupCipher(cipher);
            result.ciphers.push(cipher);
        });

        result.success = true;
        return result;
    }
}
