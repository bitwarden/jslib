import { TwoFactorProviderType } from '../../enums';

export class IdentityTwoFactorResponse {
    twoFactorProviders: TwoFactorProviderType[];
    twoFactorProviders2 = new Map<TwoFactorProviderType, { [key: string]: string; }>();

    constructor(response: any) {
        this.twoFactorProviders = response.TwoFactorProviders;
        if (response.TwoFactorProviders2 != null) {
            for (const prop in response.TwoFactorProviders2) {
                if (response.TwoFactorProviders2.hasOwnProperty(prop)) {
                    this.twoFactorProviders2.set(parseInt(prop, null), response.TwoFactorProviders2[prop]);
                }
            }
        }
    }
}
