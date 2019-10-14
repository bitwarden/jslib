import { BaseImporter } from './baseImporter';
import { Importer } from './importer';

import { ImportResult } from '../models/domain/importResult';

import { FolderView } from '../models/view/folderView';
import { SecureNoteView } from '../models/view/secureNoteView';

import { CipherType } from '../enums/cipherType';
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

            const cipher = this.initLoginCipher();
            cipher.name = this.getValueOrDefault(cardEl.getAttribute('title'), '--');

            const cardType = cardEl.getAttribute('type');
            if (cardType === 'note') {
                cipher.type = CipherType.SecureNote;
                cipher.secureNote = new SecureNoteView();
                cipher.secureNote.type = SecureNoteType.Generic;
            } else {
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
                    } else if (fieldType === 'one_time_password') {
                        cipher.login.totp = text;
                    } else if (fieldType === 'notes') {
                        cipher.notes += (text + '\n');
                    } else if (fieldType === 'weblogin' || fieldType === 'website') {
                        cipher.login.uris = this.makeUriArray(text);
                    } else {
                        this.processKvp(cipher, name, text);
                    }
                });
            }

            Array.from(this.querySelectorAllDirectChild(cardEl, 'notes')).forEach((notesEl) => {
                cipher.notes += (notesEl.textContent + '\n');
            });

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
