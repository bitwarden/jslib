import {
    Directive,
    EventEmitter,
    OnInit,
    Output,
} from '@angular/core';
import { FormBuilder } from '@angular/forms';

import { ApiService } from 'jslib-common/abstractions/api.service';
import { CryptoService } from 'jslib-common/abstractions/crypto.service';
import { EventService } from 'jslib-common/abstractions/event.service';
import { ExportService } from 'jslib-common/abstractions/export.service';
import { I18nService } from 'jslib-common/abstractions/i18n.service';
import { LogService } from 'jslib-common/abstractions/log.service';
import { PlatformUtilsService } from 'jslib-common/abstractions/platformUtils.service';
import { PolicyService } from 'jslib-common/abstractions/policy.service';

import { EventType } from 'jslib-common/enums/eventType';
import { PolicyType } from 'jslib-common/enums/policyType';
import { VerificationType } from 'jslib-common/enums/verificationType';

import { VerifyOtpRequest } from 'jslib-common/models/request/account/verifyOtpRequest';

import { Verification } from './verify-master-password.component';

@Directive()
export class ExportComponent implements OnInit {
    @Output() onSaved = new EventEmitter();

    formPromise: Promise<string>;
    disabledByPolicy: boolean = false;

    exportForm = this.fb.group({
        format: ['json'],
        secret: [''],
    })

    formatOptions = [
        { name: '.json', value: 'json' },
        { name: '.csv', value: 'csv' },
        { name: '.json (Encrypted)', value: 'encrypted_json' },
    ];

    constructor(protected cryptoService: CryptoService, protected i18nService: I18nService,
        protected platformUtilsService: PlatformUtilsService, protected exportService: ExportService,
        protected eventService: EventService, private policyService: PolicyService, protected win: Window,
        private logService: LogService, private apiService: ApiService, private fb: FormBuilder) { }

    async ngOnInit() {
        await this.checkExportDisabled();
    }

    async checkExportDisabled() {
        this.disabledByPolicy = await this.policyService.policyAppliesToUser(PolicyType.DisablePersonalVaultExport);
        if (this.disabledByPolicy) {
            this.exportForm.disable();
        }
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

        if (!await this.verifySecret()) {
            return;
        }

        try {
            this.formPromise = this.getExportData();
            const data = await this.formPromise;
            this.downloadFile(data);
            this.saved();
            await this.collectEvent();
            this.exportForm.get('secret').setValue('');
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

    protected async verifySecret(): Promise<boolean> {
        const verification: Verification = this.exportForm.get('secret').value;
        if (verification?.secret == null || verification.secret === '') {
            return false;
        }

        if (verification.type === VerificationType.OTP) {
            const request = new VerifyOtpRequest(verification.secret);
            try {
                await this.apiService.postAccountVerifyOtp(request);
            } catch {
                this.platformUtilsService.showToast('error', this.i18nService.t('errorOccurred'),
                    this.i18nService.t('invalidVerificationCode'));
                return false;
            }
        } else {
            const passwordValid = await this.cryptoService.compareAndUpdateKeyHash(verification.secret, null);
            if (!passwordValid) {
                this.platformUtilsService.showToast('error', this.i18nService.t('errorOccurred'),
                    this.i18nService.t('invalidMasterPassword'));
                return false;
            }
        }
        return true;
    }

    get format() {
        return this.exportForm.get('format').value;
    }

    private downloadFile(csv: string): void {
        const fileName = this.getFileName();
        this.platformUtilsService.saveFile(this.win, csv, { type: 'text/plain' }, fileName);
    }
}
