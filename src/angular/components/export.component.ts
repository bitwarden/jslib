import * as papa from 'papaparse';

import { ToasterService } from 'angular2-toaster';
import { Angulartics2 } from 'angulartics2';

import {
    EventEmitter,
    Output,
} from '@angular/core';

import { CipherType } from '../../enums/cipherType';

import { CipherView } from '../../models/view/cipherView';
import { FolderView } from '../../models/view/folderView';

import { CipherService } from '../../abstractions/cipher.service';
import { CryptoService } from '../../abstractions/crypto.service';
import { FolderService } from '../../abstractions/folder.service';
import { I18nService } from '../../abstractions/i18n.service';
import { PlatformUtilsService } from '../../abstractions/platformUtils.service';
import { UserService } from '../../abstractions/user.service';

export class ExportComponent {
    @Output() onSaved = new EventEmitter();

    masterPassword: string;
    showPassword = false;

    constructor(protected analytics: Angulartics2, protected toasterService: ToasterService,
        protected cipherService: CipherService, protected folderService: FolderService,
        protected cryptoService: CryptoService, protected userService: UserService,
        protected i18nService: I18nService, protected platformUtilsService: PlatformUtilsService,
        protected win: Window) { }

    async submit() {
        if (this.masterPassword == null || this.masterPassword === '') {
            this.toasterService.popAsync('error', this.i18nService.t('errorOccurred'),
                this.i18nService.t('invalidMasterPassword'));
            return;
        }

        const email = await this.userService.getEmail();
        const key = this.cryptoService.makeKey(this.masterPassword, email);
        const keyHash = await this.cryptoService.hashPassword(this.masterPassword, key);
        const storedKeyHash = await this.cryptoService.getKeyHash();

        if (storedKeyHash != null && keyHash != null && storedKeyHash === keyHash) {
            const csv = await this.getCsv();
            this.analytics.eventTrack.next({ action: 'Exported Data' });
            this.downloadFile(csv);
            this.saved();
        } else {
            this.toasterService.popAsync('error', this.i18nService.t('errorOccurred'),
                this.i18nService.t('invalidMasterPassword'));
        }
    }

    togglePassword() {
        this.analytics.eventTrack.next({ action: 'Toggled Master Password on Export' });
        this.showPassword = !this.showPassword;
        document.getElementById('masterPassword').focus();
    }

    protected saved() {
        this.onSaved.emit();
    }

    private async checkPassword() {
        const email = await this.userService.getEmail();
        const key = this.cryptoService.makeKey(this.masterPassword, email);
        const keyHash = await this.cryptoService.hashPassword(this.masterPassword, key);
        const storedKeyHash = await this.cryptoService.getKeyHash();
        if (storedKeyHash == null || keyHash == null || storedKeyHash !== keyHash) {
            throw new Error('Invalid password.');
        }
    }

    private async getCsv(): Promise<string> {
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

    private downloadFile(csv: string): void {
        const fileName = this.makeFileName();
        this.platformUtilsService.saveFile(this.win, csv, { type: 'text/plain' }, fileName);
    }

    private makeFileName(): string {
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
