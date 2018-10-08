import { BaseImporter } from './baseImporter';
import { Importer } from './importer';

import { ImportResult } from '../models/domain/importResult';

export class PassmanJsonImporter extends BaseImporter implements Importer {
    parse(data: string): ImportResult {
        const result = new ImportResult();
        const results = JSON.parse(data);
        if (results == null || results.length === 0) {
            result.success = false;
            return result;
        }

        results.forEach((credential: any) => {
            if (credential.tags.length > 0) {
                const folderName = credential.tags[0].text;
                this.processFolder(result, folderName);
            }

            const cipher = this.initLoginCipher();
            cipher.name = credential.label;
            if (cipher.name.length > 30) {
                cipher.name = cipher.name.substring(0, 30);
            }
            cipher.login.username = this.getValueOrDefault(credential.username, credential.email);
            cipher.login.password = this.getValueOrDefault(credential.password);
            cipher.login.uris = this.makeUriArray(credential.url);
            cipher.notes = this.getValueOrDefault(credential.description);

            if (credential.otp) {
                  cipher.login.totp = credential.otp.secret;
            }

            credential.custom_fields.forEach((customField: any) => {
                switch (customField.field_type) {
                    case 'text':
                    case 'password':
                        this.processKvp(cipher, customField.label, customField.value);
                        break;
                }
            });

            this.convertToNoteIfNeeded(cipher);
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
