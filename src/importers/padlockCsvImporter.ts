import { BaseImporter } from './baseImporter';
import { Importer } from './importer';

import { ImportResult } from '../models/domain/importResult';

import { CipherView } from '../models/view/cipherView';
import { CollectionView } from '../models/view/collectionView';
import { FieldView } from '../models/view/fieldView';
import { FolderView } from '../models/view/folderView';
import { LoginView } from '../models/view/loginView';

import { CipherType } from '../enums/cipherType';
import { FieldType } from '../enums/fieldType';

export class PadlockCsvImporter extends BaseImporter implements Importer {
    parse(data: string): ImportResult {
        const result = new ImportResult();
        const results = this.parseCsv(data, false);
        if (results == null) {
            result.success = false;
            return result;
        }

        let headers: string[] = null;
        results.forEach((value) => {
            if (headers == null) {
                headers = value.map((v: string) => v);
                return;
            }

            if (value.length < 2 || value.length !== headers.length) {
                return;
            }

            if (!this.isNullOrWhitespace(value[1])) {
                if (this.organization) {
                    const tags = (value[1] as string).split(',');
                    tags.forEach((tag) => {
                        tag = tag.trim();
                        let addCollection = true;
                        let collectionIndex = result.collections.length;

                        for (let i = 0; i < result.collections.length; i++) {
                            if (result.collections[i].name === tag) {
                                addCollection = false;
                                collectionIndex = i;
                                break;
                            }
                        }

                        if (addCollection) {
                            const collection = new CollectionView();
                            collection.name = tag;
                            result.collections.push(collection);
                        }

                        result.collectionRelationships.push([result.ciphers.length, collectionIndex]);
                    });
                } else {
                    const tags = (value[1] as string).split(',');
                    let folderIndex = result.folders.length;
                    const hasFolder = tags.length > 0 && !this.isNullOrWhitespace(tags[0].trim());
                    let addFolder = hasFolder;
                    const tag = tags[0].trim();

                    if (hasFolder) {
                        for (let i = 0; i < result.folders.length; i++) {
                            if (result.folders[i].name === tag) {
                                addFolder = false;
                                folderIndex = i;
                                break;
                            }
                        }
                    }

                    if (addFolder) {
                        const f = new FolderView();
                        f.name = tag;
                        result.folders.push(f);
                    }
                    if (hasFolder) {
                        result.folderRelationships.push([result.ciphers.length, folderIndex]);
                    }
                }
            }

            const cipher = new CipherView();
            cipher.type = CipherType.Login;
            cipher.favorite = false;
            cipher.notes = '';
            cipher.fields = [];
            cipher.name = this.getValueOrDefault(value[0], '--');
            cipher.login = new LoginView();

            for (let i = 2; i < value.length; i++) {
                const header = headers[i].trim().toLowerCase();
                if (this.isNullOrWhitespace(value[i]) || this.isNullOrWhitespace(header)) {
                    continue;
                }

                if (this.usernameFieldNames.indexOf(header) > -1) {
                    cipher.login.username = value[i];
                } else if (this.passwordFieldNames.indexOf(header) > -1) {
                    cipher.login.password = value[i];
                } else if (this.uriFieldNames.indexOf(header) > -1) {
                    cipher.login.uris = this.makeUriArray(value[i]);
                } else {
                    if (value[i].length > 200 || value[i].search(this.newLineRegex) > -1) {
                        cipher.notes += (headers[i] + ': ' + value[i] + '\n');
                    } else {
                        const field = new FieldView();
                        field.type = FieldType.Text;
                        field.name = headers[i];
                        field.value = value[i];
                        cipher.fields.push(field);
                    }
                }
            }

            if (this.isNullOrWhitespace(cipher.notes)) {
                cipher.notes = null;
            } else {
                cipher.notes = cipher.notes.trim();
            }
            if (cipher.fields.length === 0) {
                cipher.fields = null;
            }

            result.ciphers.push(cipher);
        });

        result.success = true;
        return result;
    }
}
