export interface SettingsService {
    clearCache(): void;
    getEquivalentDomains(): Promise<any>;
    setEquivalentDomains(equivalentDomains: string[][]): Promise<any>;
    clear(userId: string): Promise<void>;
}
