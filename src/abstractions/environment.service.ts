export abstract class EnvironmentService {
    baseUrl: string;
    webVaultUrl: string;
    apiUrl: string;
    identityUrl: string;
    iconsUrl: string;
    notificationsUrl: string;
    eventsUrl: string;

    getWebVaultUrl: () => string;
    setUrlsFromStorage: () => Promise<void>;
    setUrls: (urls: any) => Promise<any>;
}
