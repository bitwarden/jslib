export class TwoFactorYubiKeyResponse {
    enabled: boolean;
    key1: string;
    key2: string;
    key3: string;
    key4: string;
    key5: string;
    nfc: boolean;

    constructor(response: any) {
        this.enabled = response.Enabled;
        this.key1 = response.Key1;
        this.key2 = response.Key2;
        this.key3 = response.Key3;
        this.key4 = response.Key4;
        this.key5 = response.Key5;
        this.nfc = response.Nfc;
    }
}
