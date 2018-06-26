export class TwoFactorAuthenticatorResponse {
    enabled: boolean;
    key: string;

    constructor(response: any) {
        this.enabled = response.Enabled;
        this.key = response.Key;
    }
}
