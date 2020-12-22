import {
    Directive,
    EventEmitter,
    Output,
} from '@angular/core';

import { CryptoService } from '../../abstractions/crypto.service';
import { EventService } from '../../abstractions/event.service';
import { ExportService } from '../../abstractions/export.service';
import { I18nService } from '../../abstractions/i18n.service';
import { PlatformUtilsService } from '../../abstractions/platformUtils.service';
import { EventType } from '../../enums/eventType';

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

        const acceptedWarning = await this.platformUtilsService.showDialog(
            this.i18nService.t(this.encryptedFormat ? 'encExportWarningDesc' : 'exportWarningDesc'),
            this.i18nService.t('confirmVaultExport'), this.i18nService.t('exportVault'),
            this.i18nService.t('cancel'), 'warning');

        if (!acceptedWarning) {
            return;
        }

        const keyHash = await this.cryptoService.hashPassword(this.masterPassword, null);
        const storedKeyHash = await this.cryptoService.getKeyHash();
        if (storedKeyHash != null && keyHash != null && storedKeyHash === keyHash) {
            try {
                this.formPromise = this.getExportData();
                const data = await this.formPromise;
                this.platformUtilsService.eventTrack('Exported Data');
                this.downloadFile(data);
                this.saved();
                await this.collectEvent();
            } catch { }
        } else {
            this.platformUtilsService.showToast('error', this.i18nService.t('errorOccurred'),
                this.i18nService.t('invalidMasterPassword'));
        }
    }

    togglePassword() {
        this.platformUtilsService.eventTrack('Toggled Master Password on Export');
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
