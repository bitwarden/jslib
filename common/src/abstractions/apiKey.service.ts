export abstract class ApiKeyService {
    setInformation: (clientId: string, clientSecret: string) => Promise<any>;
    clear: () => Promise<any>;
    getClientId: () => Promise<string>;
    getClientSecret: () => Promise<string>;
    getEntityType: () => Promise<string>;
    getEntityId: () => Promise<string>;
    isAuthenticated: () => Promise<boolean>;
}
