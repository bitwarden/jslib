import { BaseImporter } from './baseImporter';
import { Importer } from './importer';

import { ImportResult } from '../models/domain/importResult';

export class RoboFormCsvImporter extends BaseImporter implements Importer {
    parse(data: string): ImportResult {
        const result = new ImportResult();
        const results = this.parseCsv(data, true);
        if (results == null) {
            result.success = false;
            return result;
        }

        let i = 1;
        results.forEach((value) => {
            const folder = !this.isNullOrWhitespace(value.Folder) && value.Folder.startsWith('/') ?
                value.Folder.replace('/', '') : value.Folder;
            const folderName = !this.isNullOrWhitespace(folder) ? folder : null;
            this.processFolder(result, folderName);

            const cipher = this.initLoginCipher();
            cipher.notes = this.getValueOrDefault(value.Note);
            cipher.name = this.getValueOrDefault(value.Name, '--');
            cipher.login.username = this.getValueOrDefault(value.Login);
            cipher.login.password = this.getValueOrDefault(value.Pwd);
            cipher.login.uris = this.makeUriArray(value.Url);
            this.cleanupCipher(cipher);

            if (i === results.length && cipher.name === '--' && this.isNullOrWhitespace(cipher.login.password)) {
                return;
            }
            result.ciphers.push(cipher);
            i++;
        });

        if (this.organization) {
            this.moveFoldersToCollections(result);
        }

        result.success = true;
        return result;
    }
}
