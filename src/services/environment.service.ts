import { EnvironmentUrls } from '../models/domain/environmentUrls';

import { ConstantsService } from './constants.service';

import { ApiService } from '../abstractions/api.service';
import { EnvironmentService as EnvironmentServiceAbstraction } from '../abstractions/environment.service';
import { NotificationsService } from '../abstractions/notifications.service';
import { StorageService } from '../abstractions/storage.service';

export class EnvironmentService implements EnvironmentServiceAbstraction {
    baseUrl: string;
    webVaultUrl: string;
    apiUrl: string;
    identityUrl: string;
    iconsUrl: string;
    notificationsUrl: string;
    eventsUrl: string;

    constructor(private apiService: ApiService, private storageService: StorageService,
        private notificationsService: NotificationsService) { }

    getWebVaultUrl(): string {
        if (this.webVaultUrl != null) {
            return this.webVaultUrl;
        } else if (this.baseUrl) {
            return this.baseUrl;
        }
        return null;
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
        };

        const envUrls = new EnvironmentUrls();

        if (urls.base) {
            this.baseUrl = envUrls.base = urls.base;
            this.apiService.setUrls(envUrls);
            return;
        }

        this.webVaultUrl = urls.webVault;
        this.apiUrl = envUrls.api = urls.api;
        this.identityUrl = envUrls.identity = urls.identity;
        this.iconsUrl = urls.icons;
        this.notificationsUrl = urls.notifications;
        this.eventsUrl = envUrls.events = urls.events;
        this.apiService.setUrls(envUrls);
    }

    async setUrls(urls: any): Promise<any> {
        urls.base = this.formatUrl(urls.base);
        urls.webVault = this.formatUrl(urls.webVault);
        urls.api = this.formatUrl(urls.api);
        urls.identity = this.formatUrl(urls.identity);
        urls.icons = this.formatUrl(urls.icons);
        urls.notifications = this.formatUrl(urls.notifications);
        urls.events = this.formatUrl(urls.events);

        await this.storageService.save(ConstantsService.environmentUrlsKey, {
            base: urls.base,
            api: urls.api,
            identity: urls.identity,
            webVault: urls.webVault,
            icons: urls.icons,
            notifications: urls.notifications,
            events: urls.events,
        });

        this.baseUrl = urls.base;
        this.webVaultUrl = urls.webVault;
        this.apiUrl = urls.api;
        this.identityUrl = urls.identity;
        this.iconsUrl = urls.icons;
        this.notificationsUrl = urls.notifications;
        this.eventsUrl = urls.events;

        const envUrls = new EnvironmentUrls();
        if (this.baseUrl) {
            envUrls.base = this.baseUrl;
        } else {
            envUrls.api = this.apiUrl;
            envUrls.identity = this.identityUrl;
            envUrls.events = this.eventsUrl;
        }

        this.apiService.setUrls(envUrls);
        if (this.notificationsService != null) {
            this.notificationsService.init(this);
        }
        return urls;
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
