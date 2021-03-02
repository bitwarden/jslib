import { DatePipe } from '@angular/common';

import {
    EventEmitter,
    Input,
    OnInit,
    Output,
} from '@angular/core';

import { OrganizationUserStatusType } from '../../../enums/organizationUserStatusType';
import { PolicyType } from '../../../enums/policyType';
import { SendType } from '../../../enums/sendType';

import { EnvironmentService } from '../../../abstractions/environment.service';
import { I18nService } from '../../../abstractions/i18n.service';
import { MessagingService } from '../../../abstractions/messaging.service';
import { PlatformUtilsService } from '../../../abstractions/platformUtils.service';
import { PolicyService } from '../../../abstractions/policy.service';
import { SendService } from '../../../abstractions/send.service';
import { UserService } from '../../../abstractions/user.service';

import { SendFileView } from '../../../models/view/sendFileView';
import { SendTextView } from '../../../models/view/sendTextView';
import { SendView } from '../../../models/view/sendView';

import { Send } from '../../../models/domain/send';

export class AddEditComponent implements OnInit {
    @Input() sendId: string;
    @Input() type: SendType;

    @Output() onSavedSend = new EventEmitter<SendView>();
    @Output() onDeletedSend = new EventEmitter<SendView>();
    @Output() onCancelled = new EventEmitter<SendView>();

    copyLink = false;
    disableSend = false;
    send: SendView;
    deletionDate: string;
    deletionDateFallback: string;
    deletionTimeFallback: string;
    expirationDate: string = null;
    expirationDateFallback: string;
    expirationTimeFallback: string;
    hasPassword: boolean;
    password: string;
    showPassword = false;
    formPromise: Promise<any>;
    deletePromise: Promise<any>;
    sendType = SendType;
    typeOptions: any[];
    deletionDateOptions: any[];
    expirationDateOptions: any[];
    deletionDateSelect = 168;
    expirationDateSelect: number = null;
    canAccessPremium = true;
    premiumRequiredAlertShown = false;
    showOptions = false;

    private webVaultUrl: string;

    constructor(protected i18nService: I18nService, protected platformUtilsService: PlatformUtilsService,
        protected environmentService: EnvironmentService, protected datePipe: DatePipe,
        protected sendService: SendService, protected userService: UserService,
        protected messagingService: MessagingService, protected policyService: PolicyService) {
        this.typeOptions = [
            { name: i18nService.t('sendTypeFile'), value: SendType.File },
            { name: i18nService.t('sendTypeText'), value: SendType.Text },
        ];
        this.deletionDateOptions = this.expirationDateOptions = [
            { name: i18nService.t('oneHour'), value: 1 },
            { name: i18nService.t('oneDay'), value: 24 },
            { name: i18nService.t('days', '2'), value: 48 },
            { name: i18nService.t('days', '3'), value: 72 },
            { name: i18nService.t('days', '7'), value: 168 },
            { name: i18nService.t('days', '30'), value: 720 },
            { name: i18nService.t('custom'), value: 0 },
        ];
        this.expirationDateOptions = [
            { name: i18nService.t('never'), value: null },
        ].concat([...this.deletionDateOptions]);

        this.webVaultUrl = this.environmentService.getWebVaultUrl();
        if (this.webVaultUrl == null) {
            this.webVaultUrl = 'https://vault.bitwarden.com';
        }
    }

    get link(): string {
        if (this.send.id != null && this.send.accessId != null) {
            return this.webVaultUrl + '/#/send/' + this.send.accessId + '/' + this.send.urlB64Key;
        }
        return null;
    }

    get isDateTimeLocalSupported(): boolean {
        return !(this.platformUtilsService.isFirefox() || this.platformUtilsService.isSafari());
    }

    async ngOnInit() {
        await this.load();
    }

    get editMode(): boolean {
        return this.sendId != null;
    }

    get title(): string {
        return this.i18nService.t(
            this.editMode ?
                'editSend' :
                'createSend'
        );
    }

    get expirationDateTimeFallback() {
        return `${this.expirationDateFallback}T${this.expirationTimeFallback}`;
    }

    get deletionDateTimeFallback() {
        return `${this.deletionDateFallback}T${this.deletionTimeFallback}`;
    }

    async load() {
        const policies = await this.policyService.getAll(PolicyType.DisableSend);
        const organizations = await this.userService.getAllOrganizations();
        this.disableSend = organizations.some(o => {
            return o.enabled &&
                o.status === OrganizationUserStatusType.Confirmed &&
                o.usePolicies &&
                !o.canManagePolicies &&
                policies.some(p => p.organizationId === o.id && p.enabled);
        });

        this.canAccessPremium = await this.userService.canAccessPremium();
        if (!this.canAccessPremium) {
            this.type = SendType.Text;
        }

        if (this.send == null) {
            if (this.editMode) {
                const send = await this.loadSend();
                this.send = await send.decrypt();
            } else {
                this.send = new SendView();
                this.send.type = this.type == null ? SendType.File : this.type;
                this.send.file = new SendFileView();
                this.send.text = new SendTextView();
                this.send.deletionDate = new Date();
                this.send.deletionDate.setDate(this.send.deletionDate.getDate() + 7);
            }
        }

        this.hasPassword = this.send.password != null && this.send.password.trim() !== '';

        // Parse dates
        if (!this.isDateTimeLocalSupported) {
            const deletionDateParts = this.dateToSplitString(this.send.deletionDate);
            if (deletionDateParts !== undefined && deletionDateParts.length > 0) {
                this.deletionDateFallback = deletionDateParts[0];
                this.deletionTimeFallback = deletionDateParts[1];
            }

            const expirationDateParts = this.dateToSplitString(this.send.expirationDate);
            if (expirationDateParts !== undefined && expirationDateParts.length > 0) {
                this.expirationDateFallback = expirationDateParts[0];
                this.expirationTimeFallback = expirationDateParts[1];
            }
        } else {
            this.deletionDate = this.dateToString(this.send.deletionDate);
            this.expirationDate = this.dateToString(this.send.expirationDate);
        }
    }

    async submit(): Promise<boolean> {
        if (!this.isDateTimeLocalSupported && (this.editMode || this.expirationDateSelect === 0)) {
            this.deletionDate = this.deletionDateTimeFallback;
            if ((this.editMode && this.expirationDateFallback != null) || this.expirationDateSelect === 0) {
                this.expirationDate = this.expirationDateTimeFallback;
            }
        }

        if (this.disableSend) {
            this.platformUtilsService.showToast('error', this.i18nService.t('errorOccurred'),
                this.i18nService.t('sendDisabledWarning'));
            return false;
        }

        if (this.send.name == null || this.send.name === '') {
            this.platformUtilsService.showToast('error', this.i18nService.t('errorOccurred'),
                this.i18nService.t('nameRequired'));
            return false;
        }

        let file: File = null;
        if (this.send.type === SendType.File && !this.editMode) {
            const fileEl = document.getElementById('file') as HTMLInputElement;
            const files = fileEl.files;
            if (files == null || files.length === 0) {
                this.platformUtilsService.showToast('error', this.i18nService.t('errorOccurred'),
                    this.i18nService.t('selectFile'));
                return;
            }

            file = files[0];
            if (file.size > 104857600) { // 100 MB
                this.platformUtilsService.showToast('error', this.i18nService.t('errorOccurred'),
                    this.i18nService.t('maxFileSize'));
                return;
            }
        }

        if (!this.editMode) {
            const now = new Date();
            if (this.deletionDateSelect > 0) {
                const d = new Date();
                d.setHours(now.getHours() + this.deletionDateSelect);
                this.deletionDate = this.dateToString(d);
            }
            if (this.expirationDateSelect != null && this.expirationDateSelect > 0) {
                const d = new Date();
                d.setHours(now.getHours() + this.expirationDateSelect);
                this.expirationDate = this.dateToString(d);
            }
        }

        if (this.password != null && this.password.trim() === '') {
            this.password = null;
        }

        const encSend = await this.encryptSend(file);
        try {
            this.formPromise = this.sendService.saveWithServer(encSend);
            await this.formPromise;
            if (this.send.id == null) {
                this.send.id = encSend[0].id;
            }
            if (this.send.accessId == null) {
                this.send.accessId = encSend[0].accessId;
            }
            this.platformUtilsService.showToast('success', null,
                this.i18nService.t(this.editMode ? 'editedSend' : 'createdSend'));
            this.onSavedSend.emit(this.send);
            if (this.copyLink) {
                this.copyLinkToClipboard(this.link);
            }
            return true;
        } catch { }

        return false;
    }

    clearExpiration() {
        this.expirationDate = null;
    }

    copyLinkToClipboard(link: string) {
        if (link != null) {
            this.platformUtilsService.copyToClipboard(link);
        }
    }

    async delete(): Promise<boolean> {
        if (this.deletePromise != null) {
            return false;
        }
        const confirmed = await this.platformUtilsService.showDialog(
            this.i18nService.t('deleteSendConfirmation'),
            this.i18nService.t('deleteSend'),
            this.i18nService.t('yes'), this.i18nService.t('no'), 'warning');
        if (!confirmed) {
            return false;
        }

        try {
            this.deletePromise = this.sendService.deleteWithServer(this.send.id);
            await this.deletePromise;
            this.platformUtilsService.showToast('success', null, this.i18nService.t('deletedSend'));
            await this.load();
            this.onDeletedSend.emit(this.send);
            return true;
        } catch { }

        return false;
    }

    typeChanged() {
        if (!this.canAccessPremium && this.send.type === SendType.File && !this.premiumRequiredAlertShown) {
            this.premiumRequiredAlertShown = true;
            this.messagingService.send('premiumRequired');
        }
    }

    toggleOptions() {
        this.showOptions = !this.showOptions;
    }

    protected async loadSend(): Promise<Send> {
        return this.sendService.get(this.sendId);
    }

    protected async encryptSend(file: File): Promise<[Send, ArrayBuffer]> {
        const sendData = await this.sendService.encrypt(this.send, file, this.password, null);

        // Parse dates
        try {
            sendData[0].deletionDate = this.deletionDate == null ? null : new Date(this.deletionDate);
        } catch {
            sendData[0].deletionDate = null;
        }
        try {
            sendData[0].expirationDate = this.expirationDate == null ? null : new Date(this.expirationDate);
        } catch {
            sendData[0].expirationDate = null;
        }

        return sendData;
    }

    protected dateToString(d: Date) {
        return d == null ? null : this.datePipe.transform(d, 'yyyy-MM-ddTHH:mm');
    }

    protected dateToSplitString(d: Date) {
        if (d != null) {
            const date = this.datePipe.transform(d, 'yyyy-MM-dd');
            const time = this.datePipe.transform(d, 'HH:mm');
            return [date, time];
        }
    }

    protected togglePasswordVisible() {
        this.showPassword = !this.showPassword;
        document.getElementById('password').focus();
    }
}
