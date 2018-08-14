import { ToasterService } from 'angular2-toaster';
import { Angulartics2 } from 'angulartics2';

import {
    EventEmitter,
    Output,
} from '@angular/core';

import { CryptoService } from '../../abstractions/crypto.service';
import { ExportService } from '../../abstractions/export.service';
import { I18nService } from '../../abstractions/i18n.service';
import { PlatformUtilsService } from '../../abstractions/platformUtils.service';

export class ExportComponent {
    @Output() onSaved = new EventEmitter();

    formPromise: Promise<string>;
    masterPassword: string;
    showPassword = false;

    constructor(protected analytics: Angulartics2, protected toasterService: ToasterService,
        protected cryptoService: CryptoService, protected i18nService: I18nService,
        protected platformUtilsService: PlatformUtilsService, protected exportService: ExportService,
        protected win: Window) { }

    async submit() {
        if (this.masterPassword == null || this.masterPassword === '') {
            this.toasterService.popAsync('error', this.i18nService.t('errorOccurred'),
                this.i18nService.t('invalidMasterPassword'));
            return;
        }

        const keyHash = await this.cryptoService.hashPassword(this.masterPassword, null);
        const storedKeyHash = await this.cryptoService.getKeyHash();
        if (storedKeyHash != null && keyHash != null && storedKeyHash === keyHash) {
            try {
                this.formPromise = this.getExportData();
                const data = await this.formPromise;
                this.analytics.eventTrack.next({ action: 'Exported Data' });
                this.downloadFile(data);
                this.saved();
            } catch { }
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

    protected getExportData() {
        return this.exportService.getExport('csv');
    }

    protected getFileName(prefix?: string) {
        return this.exportService.getFileName(prefix);
    }

    private downloadFile(csv: string): void {
        const fileName = this.getFileName();
        this.platformUtilsService.saveFile(this.win, csv, { type: 'text/plain' }, fileName);
    }
}
