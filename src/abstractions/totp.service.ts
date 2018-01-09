export interface TotpService {
    getCode(keyb32: string): Promise<string>;
    isAutoCopyEnabled(): Promise<boolean>;
}
