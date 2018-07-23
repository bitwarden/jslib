import { BaseImporter } from './baseImporter';
import { Importer } from './importer';

import { ImportResult } from '../models/domain/importResult';

export class PassKeepCsvImporter extends BaseImporter implements Importer {
    parse(data: string): ImportResult {
        const result = new ImportResult();
        const results = this.parseCsv(data, true);
        if (results == null) {
            result.success = false;
            return result;
        }

        results.forEach((value) => {
            this.processFolder(result, this.getValue('category', value));
            const cipher = this.initLoginCipher();
            cipher.notes = this.getValue('description', value);
            cipher.name = this.getValueOrDefault(this.getValue('title', value), '--');
            cipher.login.username = this.getValue('username', value);
            cipher.login.password = this.getValue('password', value);
            cipher.login.uris = this.makeUriArray(this.getValue('site', value));
            this.processKvp(cipher, 'Password 2', this.getValue('password2', value));
            this.cleanupCipher(cipher);
            result.ciphers.push(cipher);
        });

        if (this.organization) {
            this.moveFoldersToCollections(result);
        }

        result.success = true;
        return result;
    }

    private getValue(key: string, value: any) {
        return this.getValueOrDefault(value[key], this.getValueOrDefault(value[(' ' + key)]));
    }
}
