import { BaseImporter } from './baseImporter';
import { Importer } from './importer';

import { ImportResult } from '../models/domain/importResult';

import { FolderView } from '../models/view/folderView';

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
                result.folderRelationships.push([result.ciphers.length, folderIndex]);
            }

            const cipher = this.initLoginCipher();
            cipher.notes = this.getValueOrDefault(value.Notes);
            cipher.name = this.getValueOrDefault(value.Title, '--');
            cipher.login.username = this.getValueOrDefault(value.Username);
            cipher.login.password = this.getValueOrDefault(value.Password);
            cipher.login.uris = this.makeUriArray(value.URL);
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
