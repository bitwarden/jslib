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

import { Send } from '../../../models/domain/send';
import { SendFileView } from '../../../models/view/sendFileView';
import { SendTextView } from '../../../models/view/sendTextView';
import { SendView } from '../../../models/view/sendView';

// TimeOption is used for the dropdown implementation of custom times
// Standard = displayed time; Military = stored time
interface TimeOption {
    standard: string;
    military: string;
}

enum DateField {
    DeletionDate = 'deletion',
    ExpriationDate = 'expiration',
}

export class AddEditComponent implements OnInit {
    @Input() sendId: string;
    @Input() type: SendType;

    @Output() onSavedSend = new EventEmitter<SendView>();
    @Output() onDeletedSend = new EventEmitter<SendView>();
    @Output() onCancelled = new EventEmitter<SendView>();

    copyLink = false;
    disableSendPolicy = false;
    disableHideEmailPolicy = false;
    disableThisSend = false;
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


    safariDeletionTime: string;
    safariExpirationTime: string;
    safariDeletionTimeOptions: TimeOption[];
    safariExpirationTimeOptions: TimeOption[];

    private sendLinkBaseUrl: string;

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

        const webVaultUrl = this.environmentService.getWebVaultUrl();
        if (webVaultUrl == null) {
            this.sendLinkBaseUrl = 'https://send.bitwarden.com/#';
        } else {
            this.sendLinkBaseUrl = webVaultUrl + '/#/send/';
        }
    }

    get link(): string {
        if (this.send.id != null && this.send.accessId != null) {
            return this.sendLinkBaseUrl + this.send.accessId + '/' + this.send.urlB64Key;
        }
        return null;
    }

    get isSafari() {
        return this.platformUtilsService.isSafari();
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
        return this.nullOrWhiteSpaceCount([this.expirationDateFallback, this.expirationTimeFallback]) > 0 ?
            null :
            `${this.formatDateFallbacks(this.expirationDateFallback)}T${this.expirationTimeFallback}`;
    }

    get deletionDateTimeFallback() {
        return this.nullOrWhiteSpaceCount([this.deletionDateFallback, this.deletionTimeFallback]) > 0 ?
            null :
            `${this.formatDateFallbacks(this.deletionDateFallback)}T${this.deletionTimeFallback}`;
    }

    async load() {
        const disableSendPolicies = await this.policyService.getAll(PolicyType.DisableSend);
        const organizations = await this.userService.getAllOrganizations();
        this.disableSendPolicy = organizations.some(o => {
            return o.enabled &&
                o.status === OrganizationUserStatusType.Confirmed &&
                o.usePolicies &&
                !o.canManagePolicies &&
                disableSendPolicies.some(p => p.organizationId === o.id && p.enabled);
        });

        const sendOptionsPolicies = await this.policyService.getAll(PolicyType.SendOptions);
        this.disableHideEmailPolicy = await organizations.some(o => {
            return o.enabled &&
                o.status === OrganizationUserStatusType.Confirmed &&
                o.usePolicies &&
                !o.canManagePolicies &&
                sendOptionsPolicies.some(p => p.organizationId === o.id && p.enabled && p.data.disableHideEmail);
        })

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
        this.disableThisSend = this.disableThisSend ||
            (this.disableHideEmailPolicy && this.editMode && this.send.hideEmail);

        // Parse dates
        if (!this.isDateTimeLocalSupported) {
            const deletionDateParts = this.dateToSplitString(this.send.deletionDate);
            if (deletionDateParts !== undefined && deletionDateParts.length > 0) {
                this.deletionDateFallback = deletionDateParts[0];
                this.deletionTimeFallback = deletionDateParts[1];
                if (this.isSafari) {
                    this.safariDeletionTime = this.deletionTimeFallback;
                }
            }

            const expirationDateParts = this.dateToSplitString(this.send.expirationDate);
            if (expirationDateParts !== undefined && expirationDateParts.length > 0) {
                this.expirationDateFallback = expirationDateParts[0];
                this.expirationTimeFallback = expirationDateParts[1];
                if (this.isSafari) {
                    this.safariExpirationTime = this.expirationTimeFallback;
                }
            }
        } else {
            this.deletionDate = this.dateToString(this.send.deletionDate);
            this.expirationDate = this.dateToString(this.send.expirationDate);
        }

        if (this.isSafari) {
            this.safariDeletionTimeOptions = this.safariTimeOptions(DateField.DeletionDate);
            this.safariExpirationTimeOptions = this.safariTimeOptions(DateField.ExpriationDate);
        }
    }

    async submit(): Promise<boolean> {
        if (!this.isDateTimeLocalSupported) {
            if (this.isSafari) {
                this.expirationTimeFallback = this.safariExpirationTime ?? this.expirationTimeFallback;
                this.deletionTimeFallback = this.safariDeletionTime ?? this.deletionTimeFallback;
            }
            this.deletionDate = this.deletionDateTimeFallback;
            if (this.expirationDateTimeFallback != null && isNaN(Date.parse(this.expirationDateTimeFallback))) {
                this.platformUtilsService.showToast('error', this.i18nService.t('errorOccurred'),
                    this.i18nService.t('expirationDateIsInvalid'));
                return;
            }
            if (isNaN(Date.parse(this.deletionDateTimeFallback))) {
                this.platformUtilsService.showToast('error', this.i18nService.t('errorOccurred'),
                    this.i18nService.t('deletionDateIsInvalid'));
                return;
            }
            if (this.nullOrWhiteSpaceCount([this.expirationDateFallback, this.expirationTimeFallback]) === 1) {
                this.platformUtilsService.showToast('error', this.i18nService.t('errorOccurred'),
                    this.i18nService.t('expirationDateAndTimeRequired'));
                return;
            }
            if (this.editMode || this.expirationDateSelect === 0) {
                this.expirationDate = this.expirationDateTimeFallback;
            }
        }

        if (this.disableSendPolicy) {
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
        this.expirationDateFallback = null;
        this.expirationTimeFallback = null;
        this.safariExpirationTime = null;
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

    expirationDateFallbackChanged() {
        this.isSafari ?
            this.safariExpirationTime = this.safariExpirationTime ?? '00:00' :
            this.expirationTimeFallback = this.expirationTimeFallback ?? this.datePipe.transform(new Date(), 'HH:mm');
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

    protected formatDateFallbacks(dateString: string) {
        try {
            // The Firefox date picker doesn't supply a time, safari's polyfill does.
            // Unknown if Safari's native date picker will or not when it releases.
            if (!this.isSafari) {
                dateString += ' 00:00';
            }
            return this.datePipe.transform(new Date(dateString), 'yyyy-MM-dd');
        } catch {
            // this should never happen
            this.platformUtilsService.showToast('error', this.i18nService.t('errorOccurred'),
                this.i18nService.t('dateParsingError'));
        }
    }

    protected dateToSplitString(d: Date) {
        if (d != null) {
            const date = !this.isSafari ?
                this.datePipe.transform(d, 'yyyy-MM-dd') :
                this.datePipe.transform(d, 'MM/dd/yyyy');
            const time = this.datePipe.transform(d, 'HH:mm');
            return [date, time];
        }
    }

    protected togglePasswordVisible() {
        this.showPassword = !this.showPassword;
        document.getElementById('password').focus();
    }

    protected nullOrWhiteSpaceCount(strarray: string[]): number {
        return strarray.filter(str => str == null || str.trim() === '').length;
    }

    protected safariTimeOptions(field: DateField): TimeOption[] {
        // init individual arrays for major sort groups
        const noon: TimeOption[] = [];
        const midnight: TimeOption[] = [];
        const ams: TimeOption[] = [];
        const pms: TimeOption[] = [];

        // determine minute skip (5 min, 10 min, 15 min, etc.)
        const minuteIncrementer = 15;

        // loop through each hour on a 12 hour system
        for (let h = 1; h <= 12; h++) {
            // loop through each minute in the hour using the skip to incriment
            for (let m = 0; m < 60; m += minuteIncrementer) {
                // init the final strings that will be added to the lists
                let hour = h.toString();
                let minutes = m.toString();

                // add prepending 0s to single digit hours/minutes
                if (h < 10) {
                    hour = '0' + hour;
                }
                if (m < 10) {
                    minutes = '0' + minutes;
                }

                // build time strings and push to relevant sort groups
                if (h === 12) {
                    const midnightOption: TimeOption = {
                        standard: `${hour}:${minutes} AM`,
                        military: `00:${minutes}`,
                    };
                    midnight.push(midnightOption);

                    const noonOption: TimeOption = {
                        standard: `${hour}:${minutes} PM`,
                        military: `${hour}:${minutes}`,
                    };
                    noon.push(noonOption);
                } else {
                    const amOption: TimeOption = {
                        standard: `${hour}:${minutes} AM`,
                        military: `${hour}:${minutes}`,
                    };
                    ams.push(amOption);

                    const pmOption: TimeOption = {
                        standard: `${hour}:${minutes} PM`,
                        military: `${h + 12}:${minutes}`,
                    };
                    pms.push(pmOption);
                }
            }
        }

        // bring all the arrays together in the right order
        const validTimes = [...midnight, ...ams, ...noon, ...pms];

        // determine if an unsupported value already exists on the send & add that to the top of the option list
        // example: if the Send was created with a different client
        if (field === DateField.ExpriationDate && this.expirationDateTimeFallback != null && this.editMode) {
            const previousValue: TimeOption = {
                standard: this.datePipe.transform(this.expirationDateTimeFallback, 'hh:mm a'),
                military: this.datePipe.transform(this.expirationDateTimeFallback, 'HH:mm'),
            };
            return [previousValue, { standard: null, military: null }, ...validTimes];
        } else if (field === DateField.DeletionDate && this.deletionDateTimeFallback != null && this.editMode) {
            const previousValue: TimeOption = {
                standard: this.datePipe.transform(this.deletionDateTimeFallback, 'hh:mm a'),
                military: this.datePipe.transform(this.deletionDateTimeFallback, 'HH:mm'),
            };
            return [previousValue, ...validTimes];
        } else {
            return [{ standard: null, military: null }, ...validTimes];
        }
    }
}
