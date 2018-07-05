import { BaseImporter } from './baseImporter';
import { Importer } from './importer';

import { ImportResult } from '../models/domain/importResult';

import { CipherView } from '../models/view/cipherView';
import { LoginView } from '../models/view/loginView';

import { CipherType } from '../enums/cipherType';

export class AviraCsvImporter extends BaseImporter implements Importer {
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
            cipher.name = this.getValueOrDefault(value.name,
                this.getValueOrDefault(this.nameFromUrl(value.website), '--'));
            cipher.login = new LoginView();
            cipher.login.uris = this.makeUriArray(value.website);
            cipher.login.password = this.getValueOrDefault(value.password);

            if (this.isNullOrWhitespace(value.username) && !this.isNullOrWhitespace(value.secondary_username)) {
                cipher.login.username = value.secondary_username;
            } else {
                cipher.login.username = this.getValueOrDefault(value.username);
                cipher.notes = this.getValueOrDefault(value.secondary_username);
            }

            result.ciphers.push(cipher);
        });

        result.success = true;
        return result;
    }
}
