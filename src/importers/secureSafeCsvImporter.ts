import { BaseImporter } from './baseImporter';
import { Importer } from './importer';

import { ImportResult } from '../models/domain/importResult';

export class SecureSafeCsvImporter extends BaseImporter implements Importer {
    parse(data: string): ImportResult {
        const result = new ImportResult();
        const results = this.parseCsv(data, true);
        if (results == null) {
            result.success = false;
            return result;
        }

        results.forEach((value) => {
            const cipher = this.initLoginCipher();
            cipher.name = this.getValueOrDefault(value.Title);
            cipher.notes = this.getValueOrDefault(value.Comment);
            cipher.login.uris = this.makeUriArray(value.Url);
            cipher.login.password = this.getValueOrDefault(value.Password);
            cipher.login.username = this.getValueOrDefault(value.Username);
            this.cleanupCipher(cipher);
            result.ciphers.push(cipher);
        });

        result.success = true;
        return result;
    }
}
