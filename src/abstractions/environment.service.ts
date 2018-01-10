export interface EnvironmentService {
    baseUrl: string;
    webVaultUrl: string;
    apiUrl: string;
    identityUrl: string;
    iconsUrl: string;

    setUrlsFromStorage(): Promise<void>;
    setUrls(urls: any): Promise<any>;
}
