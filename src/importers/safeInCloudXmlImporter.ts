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

export class SafeInCloudXmlImporter extends BaseImporter implements Importer {
    parse(data: string): ImportResult {
        const result = new ImportResult();
        const doc = this.parseXml(data);
        if (doc == null) {
            result.success = false;
            return result;
        }

        const db = doc.querySelector('database');
        if (db == null) {
            result.errorMessage = 'Missing `database` node.';
            result.success = false;
            return result;
        }

        const foldersMap = new Map<string, number>();

        Array.from(doc.querySelectorAll('database > label')).forEach((labelEl) => {
            const name = labelEl.getAttribute('name');
            const id = labelEl.getAttribute('id');
            if (!this.isNullOrWhitespace(name) && !this.isNullOrWhitespace(id)) {
                foldersMap.set(id, result.folders.length);
                const folder = new FolderView();
                folder.name = name;
                result.folders.push(folder);
            }
        });

        Array.from(doc.querySelectorAll('database > card')).forEach((cardEl) => {
            if (cardEl.getAttribute('template') === 'true') {
                return;
            }

            const labelIdEl = this.querySelectorDirectChild(cardEl, 'label_id');
            if (labelIdEl != null) {
                const labelId = labelIdEl.textContent;
                if (!this.isNullOrWhitespace(labelId) && foldersMap.has(labelId)) {
                    result.folderRelationships.push([result.ciphers.length, foldersMap.get(labelId)]);
                }
            }

            const cipher = new CipherView();
            cipher.favorite = false;
            cipher.notes = '';
            cipher.name = this.getValueOrDefault(cardEl.getAttribute('title'), '--');
            cipher.fields = null;

            const cardType = cardEl.getAttribute('type');
            if (cardType === 'note') {
                cipher.type = CipherType.SecureNote;
                cipher.secureNote = new SecureNoteView();
                cipher.secureNote.type = SecureNoteType.Generic;
            } else {
                cipher.type = CipherType.Login;
                cipher.login = new LoginView();
                Array.from(this.querySelectorAllDirectChild(cardEl, 'field')).forEach((fieldEl) => {
                    const text = fieldEl.textContent;
                    if (this.isNullOrWhitespace(text)) {
                        return;
                    }
                    const name = fieldEl.getAttribute('name');
                    const fieldType = this.getValueOrDefault(fieldEl.getAttribute('type'), '').toLowerCase();
                    if (fieldType === 'login') {
                        cipher.login.username = text;
                    } else if (fieldType === 'password') {
                        cipher.login.password = text;
                    } else if (fieldType === 'notes') {
                        cipher.notes += (text + '\n');
                    } else if (fieldType === 'weblogin' || fieldType === 'website') {
                        cipher.login.uris = this.makeUriArray(text);
                    } else if (text.length > 200) {
                        cipher.notes += (name + ': ' + text + '\n');
                    } else {
                        if (cipher.fields == null) {
                            cipher.fields = [];
                        }
                        const field = new FieldView();
                        field.name = name;
                        field.value = text;
                        field.type = FieldType.Text;
                        cipher.fields.push(field);
                    }
                });
            }

            Array.from(this.querySelectorAllDirectChild(cardEl, 'notes')).forEach((notesEl) => {
                cipher.notes += (notesEl.textContent + '\n');
            });

            cipher.notes = cipher.notes.trim();
            if (cipher.notes === '') {
                cipher.notes = null;
            }

            result.ciphers.push(cipher);
        });

        if (this.organization) {
            this.moveFoldersToCollections(result);
        }

        result.success = true;
        return result;
    }
}
