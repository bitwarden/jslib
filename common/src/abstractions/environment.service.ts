export abstract class EnvironmentService {
    getNotificationsUrl: () => string;
    getEnterpriseUrl: () => string;
    getWebVaultUrl: () => string;
    getSendUrl: () => string;
    getIconsUrl: () => string;
    getApiUrl: () => string;
    getIdentityUrl: () => string;
    getEventsUrl: () => string;
    setUrlsFromStorage: () => Promise<void>;
    setUrls: (urls: any) => Promise<any>;
}
