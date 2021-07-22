import { Observable, Subject } from 'rxjs';

import { EnvironmentUrls } from '../models/domain/environmentUrls';

import { ConstantsService } from './constants.service';

import { EnvironmentService as EnvironmentServiceAbstraction, Urls } from '../abstractions/environment.service';
import { StorageService } from '../abstractions/storage.service';

export class EnvironmentService implements EnvironmentServiceAbstraction {

    private readonly urlsSubject = new Subject<Urls>();
    urls: Observable<Urls> = this.urlsSubject; // tslint:disable-line

    private baseUrl: string;
    private webVaultUrl: string;
    private apiUrl: string;
    private identityUrl: string;
    private iconsUrl: string;
    private notificationsUrl: string;
    private eventsUrl: string;
    private enterpriseUrl: string;

    constructor(private storageService: StorageService) {}

    hasBaseUrl() {
        return this.baseUrl != null;
    }

    getNotificationsUrl() {
        if (this.notificationsUrl != null) {
            return this.notificationsUrl;
        }

        if (this.baseUrl != null) {
            return this.baseUrl + '/notifications';
        }

        return 'https://notifications.bitwarden.com';
    }

    getEnterpriseUrl() {
        if (this.enterpriseUrl != null) {
            return this.enterpriseUrl;
        }

        if (this.baseUrl != null) {
            return this.baseUrl + '/portal';
        }

        return 'https://portal.bitwarden.com';
    }

    getWebVaultUrl() {
        if (this.webVaultUrl != null) {
            return this.webVaultUrl;
        }

        if (this.baseUrl) {
            return this.baseUrl;
        }
        return 'https://vault.bitwarden.com';
    }

    getSendUrl() {
        return this.getWebVaultUrl() === 'https://vault.bitwarden.com'
            ? 'https://send.bitwarden.com/#'
            : this.getWebVaultUrl() + '/#/send/';
    }

    getIconsUrl() {
        if (this.iconsUrl != null) {
            return this.iconsUrl;
        }

        if (this.baseUrl) {
            return this.baseUrl + '/icons';
        }

        return 'https://icons.bitwarden.net';
    }

    getApiUrl() {
        if (this.apiUrl != null) {
            return this.apiUrl;
        }

        if (this.baseUrl) {
            return this.baseUrl + '/api';
        }

        return 'https://api.bitwarden.com';
    }

    getIdentityUrl() {
        if (this.identityUrl != null) {
            return this.identityUrl;
        }

        if (this.baseUrl) {
            return this.baseUrl + '/identity';
        }

        return 'https://identity.bitwarden.com';
    }

    getEventsUrl() {
        if (this.eventsUrl != null) {
            return this.eventsUrl;
        }

        if (this.baseUrl) {
            return this.baseUrl + '/events';
        }

        return 'https://events.bitwarden.com';
    }

    async setUrlsFromStorage(): Promise<void> {
        const urlsObj: any = await this.storageService.get(ConstantsService.environmentUrlsKey);
        const urls = urlsObj || {
            base: null,
            api: null,
            identity: null,
            icons: null,
            notifications: null,
            events: null,
            webVault: null,
            enterprise: null,
        };

        const envUrls = new EnvironmentUrls();

        if (urls.base) {
            this.baseUrl = envUrls.base = urls.base;
            return;
        }

        this.webVaultUrl = urls.webVault;
        this.apiUrl = envUrls.api = urls.api;
        this.identityUrl = envUrls.identity = urls.identity;
        this.iconsUrl = urls.icons;
        this.notificationsUrl = urls.notifications;
        this.eventsUrl = envUrls.events = urls.events;
        this.enterpriseUrl = urls.enterprise;
    }

    async setUrls(urls: Urls, saveSettings: boolean = true): Promise<any> {
        urls.base = this.formatUrl(urls.base);
        urls.webVault = this.formatUrl(urls.webVault);
        urls.api = this.formatUrl(urls.api);
        urls.identity = this.formatUrl(urls.identity);
        urls.icons = this.formatUrl(urls.icons);
        urls.notifications = this.formatUrl(urls.notifications);
        urls.events = this.formatUrl(urls.events);
        urls.enterprise = this.formatUrl(urls.enterprise);

        if (saveSettings) {
            await this.storageService.save(ConstantsService.environmentUrlsKey, {
                base: urls.base,
                api: urls.api,
                identity: urls.identity,
                webVault: urls.webVault,
                icons: urls.icons,
                notifications: urls.notifications,
                events: urls.events,
                enterprise: urls.enterprise,
            });
        }

        this.baseUrl = urls.base;
        this.webVaultUrl = urls.webVault;
        this.apiUrl = urls.api;
        this.identityUrl = urls.identity;
        this.iconsUrl = urls.icons;
        this.notificationsUrl = urls.notifications;
        this.eventsUrl = urls.events;
        this.enterpriseUrl = urls.enterprise;

        this.urlsSubject.next(urls);

        return urls;
    }

    getUrls() {
        return {
            base: this.baseUrl,
            webVault: this.webVaultUrl,
            api: this.apiUrl,
            identity: this.identityUrl,
            icons: this.iconsUrl,
            notifications: this.notificationsUrl,
            events: this.eventsUrl,
            enterprise: this.enterpriseUrl,
        };
    }

    private formatUrl(url: string): string {
        if (url == null || url === '') {
            return null;
        }

        url = url.replace(/\/+$/g, '');
        if (!url.startsWith('http://') && !url.startsWith('https://')) {
            url = 'https://' + url;
        }

        return url.trim();
    }
}
