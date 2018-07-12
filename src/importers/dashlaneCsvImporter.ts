import { BaseImporter } from './baseImporter';
import { Importer } from './importer';

import { ImportResult } from '../models/domain/importResult';

export class DashlaneCsvImporter extends BaseImporter implements Importer {
    parse(data: string): ImportResult {
        const result = new ImportResult();
        const results = this.parseCsv(data, false);
        if (results == null) {
            result.success = false;
            return result;
        }

        results.forEach((value) => {
            let skip = false;
            if (value.length < 2) {
                return;
            }

            const cipher = this.initLoginCipher();
            cipher.name = this.getValueOrDefault(value[0], '--');

            if (value.length === 2) {
                cipher.login.uris = this.makeUriArray(value[1]);
            } else if (value.length === 3) {
                cipher.login.uris = this.makeUriArray(value[1]);
                cipher.login.username = this.getValueOrDefault(value[2]);
            } else if (value.length === 4) {
                if (this.isNullOrWhitespace(value[2]) && this.isNullOrWhitespace(value[3])) {
                    cipher.login.username = value[1];
                    cipher.notes = value[2] + '\n' + value[3];
                } else {
                    cipher.login.username = value[2];
                    cipher.notes = value[1] + '\n' + value[3];
                }
            } else if (value.length === 5) {
                cipher.login.uris = this.makeUriArray(value[1]);
                cipher.login.username = this.getValueOrDefault(value[2]);
                cipher.login.password = this.getValueOrDefault(value[3]);
                cipher.notes = this.getValueOrDefault(value[4]);
            } else if (value.length === 6) {
                if (this.isNullOrWhitespace(value[2])) {
                    cipher.login.username = this.getValueOrDefault(value[3]);
                    cipher.login.password = this.getValueOrDefault(value[4]);
                    cipher.notes = this.getValueOrDefault(value[5]);
                } else {
                    cipher.login.username = this.getValueOrDefault(value[2]);
                    cipher.login.password = this.getValueOrDefault(value[3]);
                    cipher.notes = this.getValueOrDefault(value[4], '') + '\n' + this.getValueOrDefault(value[5], '');
                }
                cipher.login.uris = this.makeUriArray(value[1]);
            } else if (value.length === 7) {
                if (this.isNullOrWhitespace(value[2])) {
                    cipher.login.username = this.getValueOrDefault(value[3]);
                    cipher.notes = this.getValueOrDefault(value[4], '') + '\n' + this.getValueOrDefault(value[6], '');
                } else {
                    cipher.login.username = this.getValueOrDefault(value[2]);
                    cipher.notes = this.getValueOrDefault(value[3], '') + '\n' +
                        this.getValueOrDefault(value[4], '') + '\n' + this.getValueOrDefault(value[6], '');
                }
                cipher.login.uris = this.makeUriArray(value[1]);
                cipher.login.password = this.getValueOrDefault(value[5]);
            } else {
                for (let i = 1; i < value.length; i++) {
                    cipher.notes += (value[i] + '\n');
                    if (value[i] === 'NO_TYPE') {
                        skip = true;
                        break;
                    }
                }
            }

            if (skip) {
                return;
            }
            if (this.isNullOrWhitespace(cipher.login.username)) {
                cipher.login.username = null;
            }
            if (this.isNullOrWhitespace(cipher.login.password)) {
                cipher.login.password = null;
            }
            this.cleanupCipher(cipher);
            result.ciphers.push(cipher);
        });

        result.success = true;
        return result;
    }
}
