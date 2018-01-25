export abstract class TotpService {
    getCode: (keyb32: string) => Promise<string>;
    isAutoCopyEnabled: () => Promise<boolean>;
}
