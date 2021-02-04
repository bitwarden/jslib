import {
    NgZone,
    OnInit,
} from '@angular/core';

import { SendType } from '../../../enums/sendType';
import { PolicyType } from '../../../enums/policyType';
import { OrganizationUserStatusType } from '../../../enums/organizationUserStatusType';

import { SendView } from '../../../models/view/sendView';

import { EnvironmentService } from '../../../abstractions/environment.service';
import { I18nService } from '../../../abstractions/i18n.service';
import { PlatformUtilsService } from '../../../abstractions/platformUtils.service';
import { SearchService } from '../../../abstractions/search.service';
import { SendService } from '../../../abstractions/send.service';
import { PolicyService } from '../../../abstractions/policy.service';
import { UserService } from '../../../abstractions/user.service';

import { BroadcasterService } from '../../../angular/services/broadcaster.service';

const BroadcasterSubscriptionId = 'SendComponent';

export class SendComponent implements OnInit {

    disableSend = false;
    sendType = SendType;
    loaded = false;
    loading = true;
    refreshing = false;
    expired: boolean = false;
    type: SendType = null;
    sends: SendView[] = [];
    filteredSends: SendView[] = [];
    searchText: string;
    selectedType: SendType;
    selectedAll: boolean;
    searchPlaceholder: string;
    filter: (cipher: SendView) => boolean;
    searchPending = false;

    actionPromise: any;
    onSuccessfulRemovePassword: () => Promise<any>;
    onSuccessfulDelete: () => Promise<any>;

    private searchTimeout: any;

    constructor(protected sendService: SendService, protected i18nService: I18nService,
        protected platformUtilsService: PlatformUtilsService, protected environmentService: EnvironmentService,
        protected broadcasterService: BroadcasterService, protected ngZone: NgZone,
        protected searchService: SearchService, protected policyService: PolicyService,
        protected userService: UserService) { }

    async ngOnInit() {
        const policies = await this.policyService.getAll(PolicyType.DisableSend);
        const organizations = await this.userService.getAllOrganizations();
        this.disableSend = organizations.some(o => {
            return o.enabled &&
                o.status == OrganizationUserStatusType.Confirmed &&
                o.usePolicies &&
                !o.canManagePolicies &&
                policies.some(p => p.organizationId == o.id && p.enabled);
        });

        this.broadcasterService.subscribe(BroadcasterSubscriptionId, (message: any) => {
            this.ngZone.run(async () => {
                switch (message.command) {
                    case 'syncCompleted':
                        if (message.successfully) {
                            await this.load();
                        }
                        break;
                }
            });
        });

        await this.load();
    }

    ngOnDestroy() {
        this.broadcasterService.unsubscribe(BroadcasterSubscriptionId);
    }

    async load(filter: (send: SendView) => boolean = null) {
        this.loading = true;
        const sends = await this.sendService.getAllDecrypted();
        this.sends = sends;
        this.selectAll();
        this.loading = false;
        this.loaded = true;
    }

    async reload(filter: (send: SendView) => boolean = null) {
        this.loaded = false;
        this.sends = [];
        await this.load(filter);
    }

    async refresh() {
        try {
            this.refreshing = true;
            await this.reload(this.filter);
        } finally {
            this.refreshing = false;
        }
    }

    async applyFilter(filter: (send: SendView) => boolean = null) {
        this.filter = filter;
        await this.search(null);
    }

    async search(timeout: number = null) {
        this.searchPending = false;
        if (this.searchTimeout != null) {
            clearTimeout(this.searchTimeout);
        }
        if (timeout == null) {
            this.filteredSends = this.sends.filter(s => this.filter == null || this.filter(s));
            this.applyTextSearch();
            return;
        }
        this.searchPending = true;
        this.searchTimeout = setTimeout(async () => {
            this.filteredSends = this.sends.filter(s => this.filter == null || this.filter(s));
            this.applyTextSearch();
            this.searchPending = false;
        }, timeout);
    }

    async removePassword(s: SendView): Promise<boolean> {
        if (this.actionPromise != null || s.password == null) {
            return;
        }
        const confirmed = await this.platformUtilsService.showDialog(this.i18nService.t('removePasswordConfirmation'),
            this.i18nService.t('removePassword'),
            this.i18nService.t('yes'), this.i18nService.t('no'), 'warning');
        if (!confirmed) {
            return false;
        }

        try {
            this.actionPromise = this.sendService.removePasswordWithServer(s.id);
            await this.actionPromise;
            if (this.onSuccessfulRemovePassword() != null) {
                this.onSuccessfulRemovePassword();
            } else {
                // Default actions
                this.platformUtilsService.showToast('success', null, this.i18nService.t('removedPassword'));
                await this.load();
            }
        } catch { }
        this.actionPromise = null;
    }

    async delete(s: SendView): Promise<boolean> {
        if (this.actionPromise != null) {
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
            this.actionPromise = this.sendService.deleteWithServer(s.id);
            await this.actionPromise;

            if (this.onSuccessfulDelete() != null) {
                this.onSuccessfulDelete();
            } else {
                // Default actions
                this.platformUtilsService.showToast('success', null, this.i18nService.t('deletedSend'));
                await this.load();
            }
        } catch { }
        this.actionPromise = null;
        return true;
    }

    copy(s: SendView) {
        let webVaultUrl = this.environmentService.getWebVaultUrl();
        if (webVaultUrl == null) {
            webVaultUrl = 'https://vault.bitwarden.com';
        }
        const link = webVaultUrl + '/#/send/' + s.accessId + '/' + s.urlB64Key;
        this.platformUtilsService.copyToClipboard(link);
        this.platformUtilsService.showToast('success', null,
            this.i18nService.t('valueCopied', this.i18nService.t('sendLink')));
    }

    searchTextChanged() {
        this.search(200);
    }

    selectAll() {
        this.clearSelections();
        this.selectedAll = true;
        this.applyFilter(null);
    }

    selectType(type: SendType) {
        this.clearSelections();
        this.selectedType = type;
        this.applyFilter(s => s.type === type);
    }

    clearSelections() {
        this.selectedAll = false;
        this.selectedType = null;
    }

    private applyTextSearch() {
        if (this.searchText != null) {
            this.filteredSends = this.searchService.searchSends(this.filteredSends, this.searchText);
        }
    }
}
