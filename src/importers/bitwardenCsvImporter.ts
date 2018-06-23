import { BaseImporter } from './baseImporter';
import { Importer } from './importer';

import { ImportResult } from '../models/domain/importResult';

import { CipherView } from '../models/view/cipherView';
import { FieldView } from '../models/view/fieldView';
import { FolderView } from '../models/view/folderView';
import { LoginView } from '../models/view/loginView';
import { SecureNoteView } from '../models/view/secureNoteView';

import { CipherType } from '../enums/cipherType';
import { FieldType } from '../enums/fieldType';
import { SecureNoteType } from '../enums/secureNoteType';

export class BitwardenCsvImporter extends BaseImporter implements Importer {
    import(data: string): ImportResult {
        const result = new ImportResult();
        const results = this.parseCsv(data, true);
        if (results == null) {
            result.success = false;
            return result;
        }

        results.forEach((value) => {
            let folderIndex = result.folders.length;
            const cipherIndex = result.ciphers.length;
            const hasFolder = !this.isNullOrWhitespace(value.folder);
            let addFolder = hasFolder;

            if (hasFolder) {
                for (let i = 0; i < result.folders.length; i++) {
                    if (result.folders[i].name === value.folder) {
                        addFolder = false;
                        folderIndex = i;
                        break;
                    }
                }
            }

            const cipher = new CipherView();
            cipher.type = CipherType.Login;
            cipher.favorite = this.getValueOrDefault(value.favorite, '0') !== '0' ? true : false;
            cipher.notes = this.getValueOrDefault(value.notes);
            cipher.name = this.getValueOrDefault(value.name, '--');

            if (!this.isNullOrWhitespace(value.fields)) {
                const fields = this.splitNewLine(value.fields);
                for (let i = 0; i < fields.length; i++) {
                    if (this.isNullOrWhitespace(fields[i])) {
                        continue;
                    }

                    const delimPosition = fields[i].lastIndexOf(': ');
                    if (delimPosition === -1) {
                        continue;
                    }

                    if (cipher.fields == null) {
                        cipher.fields = [];
                    }

                    const field = new FieldView();
                    field.name = fields[i].substr(0, delimPosition);
                    field.value = null;
                    field.type = FieldType.Text;
                    if (fields[i].length > (delimPosition + 2)) {
                        field.value = fields[i].substr(delimPosition + 2);
                    }
                    cipher.fields.push(field);
                }
            }

            const valueType = value.type != null ? value.type.toLowerCase() : null;
            switch (valueType) {
                case 'login':
                case null:
                    cipher.type = CipherType.Login;
                    cipher.login = new LoginView();
                    cipher.login.totp = this.getValueOrDefault(value.login_totp || value.totp);
                    cipher.login.username = this.getValueOrDefault(value.login_username || value.username);
                    cipher.login.password = this.getValueOrDefault(value.login_password || value.password);
                    const uris = this.parseSingleRowCsv(value.login_uri || value.uri);
                    cipher.login.uris = this.makeUriArray(uris);
                    break;
                case 'note':
                    cipher.type = CipherType.SecureNote;
                    cipher.secureNote = new SecureNoteView();
                    cipher.secureNote.type = SecureNoteType.Generic;
                    break;
                default:
                    break;
            }

            result.ciphers.push(cipher);

            if (addFolder) {
                const f = new FolderView();
                f.name = value.folder;
                result.folders.push(f);
            }
            if (hasFolder) {
                result.folderRelationships.set(cipherIndex, folderIndex);
            }
        });

        return result;
    }
}
