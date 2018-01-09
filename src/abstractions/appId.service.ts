export interface AppIdService {
    getAppId(): Promise<string>;
    getAnonymousAppId(): Promise<string>;
}
