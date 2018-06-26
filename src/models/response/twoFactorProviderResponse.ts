import { TwoFactorProviderType } from '../../enums/twoFactorProviderType';

export class TwoFactorProviderResponse {
    enabled: boolean;
    type: TwoFactorProviderType;

    constructor(response: any) {
        this.enabled = response.Enabled;
        this.type = response.Type;
    }
}
