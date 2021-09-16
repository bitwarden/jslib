import { Observable } from 'rxjs';

export type Urls = {
    base?: string;
    webVault?: string;
    api?: string;
    identity?: string;
    icons?: string;
    notifications?: string;
    events?: string;
    enterprise?: string;
};

export type PayPalConfig = {
    businessId?: string;
    buttonAction?: string;
};

export abstract class EnvironmentService {
    urls: Observable<Urls>;

    hasBaseUrl: () => boolean;
    getNotificationsUrl: () => string;
    getEnterpriseUrl: () => string;
    getWebVaultUrl: () => string;
    getSendUrl: () => string;
    getIconsUrl: () => string;
    getApiUrl: () => string;
    getIdentityUrl: () => string;
    getEventsUrl: () => string;
    setUrlsFromStorage: () => Promise<void>;
    setUrls: (urls: any, saveSettings?: boolean) => Promise<Urls>;
    getUrls: () => Urls;
}
