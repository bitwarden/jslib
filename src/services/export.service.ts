import * as papa from 'papaparse';

import { CipherType } from '../enums/cipherType';

import { CipherService } from '../abstractions/cipher.service';
import { ExportService as ExportServiceAbstraction } from '../abstractions/export.service';
import { FolderService } from '../abstractions/folder.service';

import { CipherView } from '../models/view/cipherView';
import { FolderView } from '../models/view/folderView';

import { Utils } from '../misc/utils';

export class ExportService implements ExportServiceAbstraction {
    constructor(private folderService: FolderService, private cipherService: CipherService) { }

    async getCsv(): Promise<string> {
        let decFolders: FolderView[] = [];
        let decCiphers: CipherView[] = [];
        const promises = [];

        promises.push(this.folderService.getAllDecrypted().then((folders) => {
            decFolders = folders;
        }));

        promises.push(this.cipherService.getAllDecrypted().then((ciphers) => {
            decCiphers = ciphers;
        }));

        await Promise.all(promises);

        const foldersMap = new Map<string, FolderView>();
        decFolders.forEach((f) => {
            foldersMap.set(f.id, f);
        });

        const exportCiphers: any[] = [];
        decCiphers.forEach((c) => {
            // only export logins and secure notes
            if (c.type !== CipherType.Login && c.type !== CipherType.SecureNote) {
                return;
            }

            const cipher: any = {
                folder: c.folderId && foldersMap.has(c.folderId) ? foldersMap.get(c.folderId).name : null,
                favorite: c.favorite ? 1 : null,
                type: null,
                name: c.name,
                notes: c.notes,
                fields: null,
                // Login props
                login_uri: null,
                login_username: null,
                login_password: null,
                login_totp: null,
            };

            if (c.fields) {
                c.fields.forEach((f: any) => {
                    if (!cipher.fields) {
                        cipher.fields = '';
                    } else {
                        cipher.fields += '\n';
                    }

                    cipher.fields += ((f.name || '') + ': ' + f.value);
                });
            }

            switch (c.type) {
                case CipherType.Login:
                    cipher.type = 'login';
                    cipher.login_username = c.login.username;
                    cipher.login_password = c.login.password;
                    cipher.login_totp = c.login.totp;

                    if (c.login.uris) {
                        cipher.login_uri = [];
                        c.login.uris.forEach((u) => {
                            cipher.login_uri.push(u.uri);
                        });
                    }
                    break;
                case CipherType.SecureNote:
                    cipher.type = 'note';
                    break;
                default:
                    return;
            }

            exportCiphers.push(cipher);
        });

        return papa.unparse(exportCiphers);
    }

    getFileName(): string {
        const now = new Date();
        const dateString =
            now.getFullYear() + '' + this.padNumber(now.getMonth() + 1, 2) + '' + this.padNumber(now.getDate(), 2) +
            this.padNumber(now.getHours(), 2) + '' + this.padNumber(now.getMinutes(), 2) +
            this.padNumber(now.getSeconds(), 2);

        return 'bitwarden_export_' + dateString + '.csv';
    }

    private padNumber(num: number, width: number, padCharacter: string = '0'): string {
        const numString = num.toString();
        return numString.length >= width ? numString :
            new Array(width - numString.length + 1).join(padCharacter) + numString;
    }
}
