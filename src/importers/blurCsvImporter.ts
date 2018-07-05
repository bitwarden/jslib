import { BaseImporter } from './baseImporter';
import { Importer } from './importer';

import { ImportResult } from '../models/domain/importResult';

import { CipherView } from '../models/view/cipherView';
import { LoginView } from '../models/view/loginView';

import { CipherType } from '../enums/cipherType';

export class BlurCsvImporter extends BaseImporter implements Importer {
    parse(data: string): ImportResult {
        if (this.organization) {
            throw new Error('Organization import not supported.');
        }

        const result = new ImportResult();
        const results = this.parseCsv(data, true);
        if (results == null) {
            result.success = false;
            return result;
        }

        results.forEach((value) => {
            const cipher = new CipherView();
            cipher.type = CipherType.Login;
            if (value.label === 'null') {
                value.label = null;
            }
            cipher.name = this.getValueOrDefault(value.label,
                this.getValueOrDefault(this.nameFromUrl(value.domain), '--'));
            cipher.login = new LoginView();
            cipher.login.uris = this.makeUriArray(value.domain);
            cipher.login.password = this.getValueOrDefault(value.password);

            if (this.isNullOrWhitespace(value.email) && !this.isNullOrWhitespace(value.username)) {
                cipher.login.username = value.username;
            } else {
                cipher.login.username = this.getValueOrDefault(value.email);
                cipher.notes = this.getValueOrDefault(value.username);
            }

            result.ciphers.push(cipher);
        });

        result.success = true;
        return result;
    }
}
