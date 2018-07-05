import { BaseImporter } from './baseImporter';
import { Importer } from './importer';

import { ImportResult } from '../models/domain/importResult';

import { CipherView } from '../models/view/cipherView';
import { FolderView } from '../models/view/folderView';
import { LoginView } from '../models/view/loginView';

import { CipherType } from '../enums/cipherType';

export class KeePassXCsvImporter extends BaseImporter implements Importer {
    parse(data: string): ImportResult {
        const result = new ImportResult();
        const results = this.parseCsv(data, true);
        if (results == null) {
            result.success = false;
            return result;
        }

        results.forEach((value) => {
            if (this.isNullOrWhitespace(value.Title)) {
                return;
            }

            value.Group = !this.isNullOrWhitespace(value.Group) && value.Group.startsWith('Root/') ?
                value.Group.replace('Root/', '') : value.Group;
            const groupName = !this.isNullOrWhitespace(value.Group) ? value.Group.split('/').join(' > ') : null;

            let folderIndex = result.folders.length;
            const hasFolder = groupName != null;
            let addFolder = hasFolder;

            if (hasFolder) {
                for (let i = 0; i < result.folders.length; i++) {
                    if (result.folders[i].name === groupName) {
                        addFolder = false;
                        folderIndex = i;
                        break;
                    }
                }
            }

            if (addFolder) {
                const f = new FolderView();
                f.name = groupName;
                result.folders.push(f);
            }
            if (hasFolder) {
                result.folderRelationships.set(result.ciphers.length, folderIndex);
            }

            const cipher = new CipherView();
            cipher.type = CipherType.Login;
            cipher.favorite = false;
            cipher.notes = this.getValueOrDefault(value.Notes);
            cipher.name = this.getValueOrDefault(value.Title, '--');
            cipher.login = new LoginView();
            cipher.login.username = this.getValueOrDefault(value.Username);
            cipher.login.password = this.getValueOrDefault(value.Password);
            cipher.login.uris = this.makeUriArray(value.URL);
            result.ciphers.push(cipher);
        });

        result.success = true;
        return result;
    }
}
