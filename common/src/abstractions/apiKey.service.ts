export abstract class ApiKeyService {
    setInformation: (clientId: string) => Promise<any>;
    clear: () => Promise<any>;
    getEntityType: () => Promise<string>;
    getEntityId: () => Promise<string>;
    isAuthenticated: () => Promise<boolean>;
}
