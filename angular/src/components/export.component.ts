import {
    Directive,
    EventEmitter,
    OnInit,
    Output,
    ViewChild,
} from '@angular/core';

import { CryptoService } from 'jslib-common/abstractions/crypto.service';
import { EventService } from 'jslib-common/abstractions/event.service';
import { ExportService } from 'jslib-common/abstractions/export.service';
import { I18nService } from 'jslib-common/abstractions/i18n.service';
import { LogService } from 'jslib-common/abstractions/log.service';
import { PlatformUtilsService } from 'jslib-common/abstractions/platformUtils.service';
import { PolicyService } from 'jslib-common/abstractions/policy.service';

import { EventType } from 'jslib-common/enums/eventType';
import { PolicyType } from 'jslib-common/enums/policyType';

import { VerifyMasterPasswordComponent } from './verify-master-password.component';

@Directive()
export class ExportComponent implements OnInit {
    @Output() onSaved = new EventEmitter();
    @ViewChild('verifyMasterPassword') verifyMasterPassword: VerifyMasterPasswordComponent;

    formPromise: Promise<string>;
    format: 'json' | 'encrypted_json' | 'csv' = 'json';
    showPassword = false;
    disabledByPolicy: boolean = false;

    constructor(protected cryptoService: CryptoService, protected i18nService: I18nService,
        protected platformUtilsService: PlatformUtilsService, protected exportService: ExportService,
        protected eventService: EventService, private policyService: PolicyService, protected win: Window,
        private logService: LogService) { }

    async ngOnInit() {
        await this.checkExportDisabled();
    }

    async checkExportDisabled() {
        this.disabledByPolicy = await this.policyService.policyAppliesToUser(PolicyType.DisablePersonalVaultExport);
    }

    get encryptedFormat() {
        return this.format === 'encrypted_json';
    }

    async submit() {
        if (this.disabledByPolicy) {
            this.platformUtilsService.showToast('error', null, this.i18nService.t('personalVaultExportPolicyInEffect'));
            return;
        }

        const acceptedWarning = await this.warningDialog();
        if (!acceptedWarning) {
            return;
        }

        if (!await this.verifyMasterPassword.verifySecret()) {
            return;
        }

        try {
            this.formPromise = this.getExportData();
            const data = await this.formPromise;
            this.downloadFile(data);
            this.saved();
            await this.collectEvent();
        } catch (e) {
            this.logService.error(e);
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
