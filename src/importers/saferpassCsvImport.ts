import { BaseImporter } from './baseImporter';
import { Importer } from './importer';

import { ImportResult } from '../models/domain/importResult';

export class SaferPassCsvImporter extends BaseImporter implements Importer {
    parse(data: string): ImportResult {
        const result = new ImportResult();
        const results = this.parseCsv(data, true);
        if (results == null) {
            result.success = false;
            return result;
        }

        results.forEach((value) => {
            const cipher = this.initLoginCipher();
            cipher.name = this.getValueOrDefault(this.nameFromUrl(value.url), '--');
            cipher.notes = this.getValueOrDefault(value.notes);
            cipher.login.username = this.getValueOrDefault(value.username);
            cipher.login.password = this.getValueOrDefault(value.password);
            cipher.login.uris = this.makeUriArray(value.url);
            this.cleanupCipher(cipher);
            result.ciphers.push(cipher);
        });

        result.success = true;
        return result;
    }
}
