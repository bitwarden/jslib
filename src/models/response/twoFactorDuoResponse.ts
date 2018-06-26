export class TwoFactorDuoResponse {
    enabled: boolean;
    host: string;
    secretKey: string;
    integrationKey: string;

    constructor(response: any) {
        this.enabled = response.Enabled;
        this.host = response.Host;
        this.secretKey = response.SecretKey;
        this.integrationKey = response.IntegrationKey;
    }
}
