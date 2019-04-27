import { BaseImporter } from './baseImporter';
import { Importer } from './importer';

import { ImportResult } from '../models/domain/importResult';

export class PasswordWalletTxtImporter extends BaseImporter implements Importer {
    parse(data: string): ImportResult {
        const result = new ImportResult();
        const results = this.parseCsv(data, false);
        if (results == null) {
            result.success = false;
            return result;
        }

        results.forEach((value) => {
            if (value.length < 6) {
                return;
            }

            this.processFolder(result, value[5]);
            const cipher = this.initLoginCipher();
            cipher.name = this.getValueOrDefault(value[0], '--');
            cipher.notes = this.getValueOrDefault(value[4]);
            cipher.login.username = this.getValueOrDefault(value[2]);
            cipher.login.password = this.getValueOrDefault(value[3]);
            cipher.login.uris = this.makeUriArray(value[1]);
            this.cleanupCipher(cipher);
            result.ciphers.push(cipher);
        });

        if (this.organization) {
            this.moveFoldersToCollections(result);
        }

        result.success = true;
        return result;
    }
}
