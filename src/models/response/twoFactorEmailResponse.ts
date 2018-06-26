export class TwoFactorEmailResponse {
    enabled: boolean;
    email: string;

    constructor(response: any) {
        this.enabled = response.Enabled;
        this.email = response.Email;
    }
}
