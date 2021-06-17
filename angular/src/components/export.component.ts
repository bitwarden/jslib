import {
    Directive,
    EventEmitter,
    Output,
} from '@angular/core';

import { CryptoService } from 'jslib-common/abstractions/crypto.service';
import { EventService } from 'jslib-common/abstractions/event.service';
import { ExportService } from 'jslib-common/abstractions/export.service';
import { I18nService } from 'jslib-common/abstractions/i18n.service';
import { PlatformUtilsService } from 'jslib-common/abstractions/platformUtils.service';

import { EventType } from 'jslib-common/enums/eventType';
import { HashPurpose } from 'jslib-common/enums/hashPurpose';

@Directive()
export class ExportComponent {
    @Output() onSaved = new EventEmitter();

    formPromise: Promise<string>;
    masterPassword: string;
    format: 'json' | 'encrypted_json' | 'csv' = 'json';
    showPassword = false;

    constructor(protected cryptoService: CryptoService, protected i18nService: I18nService,
        protected platformUtilsService: PlatformUtilsService, protected exportService: ExportService,
        protected eventService: EventService, protected win: Window) { }

    get encryptedFormat() {
        return this.format === 'encrypted_json';
    }

    async submit() {
        if (this.masterPassword == null || this.masterPassword === '') {
            this.platformUtilsService.showToast('error', this.i18nService.t('errorOccurred'),
                this.i18nService.t('invalidMasterPassword'));
            return;
        }

        const acceptedWarning = await this.warningDialog();
        if (!acceptedWarning) {
            return;
        }

        const passwordValid = await this.cryptoService.compareAndUpdateKeyHash(this.masterPassword, null);
        if (passwordValid) {
            try {
                this.formPromise = this.getExportData();
                const data = await this.formPromise;
                this.downloadFile(data);
                this.saved();
                await this.collectEvent();
            } catch { }
        } else {
            this.platformUtilsService.showToast('error', this.i18nService.t('errorOccurred'),
                this.i18nService.t('invalidMasterPassword'));
        }
    }

    async warningDialog() {
        if (this.encryptedFormat) {
            return await this.platformUtilsService.showDialog(
                '<p>' + this.i18nService.t('encExportKeyWarningDesc') +
                '<p>' + this.i18nService.t('encExportAccountWarningDesc'),
                this.i18nService.t('confirmVaultExport'), this.i18nService.t('exportVault'),
                this.i18nService.t('cancel'), 'warning',
                true);
        } else {
            return await this.platformUtilsService.showDialog(
                this.i18nService.t('exportWarningDesc'),
                this.i18nService.t('confirmVaultExport'), this.i18nService.t('exportVault'),
                this.i18nService.t('cancel'), 'warning');
        }
    }

    togglePassword() {
        this.showPassword = !this.showPassword;
        document.getElementById('masterPassword').focus();
    }

    protected saved() {
        this.onSaved.emit();
    }

    protected getExportData() {
        return this.exportService.getExport(this.format);
    }

    protected getFileName(prefix?: string) {
        let extension = this.format;
        if (this.format === 'encrypted_json') {
            if (prefix == null) {
                prefix = 'encrypted';
            } else {
                prefix = 'encrypted_' + prefix;
            }
            extension = 'json';
        }
        return this.exportService.getFileName(prefix, extension);
    }

    protected async collectEvent(): Promise<any> {
        await this.eventService.collect(EventType.User_ClientExportedVault);
    }

    private downloadFile(csv: string): void {
        const fileName = this.getFileName();
        this.platformUtilsService.saveFile(this.win, csv, { type: 'text/plain' }, fileName);
    }
}
