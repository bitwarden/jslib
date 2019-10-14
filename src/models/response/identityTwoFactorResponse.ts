import { BaseResponse } from './baseResponse';

import { TwoFactorProviderType } from '../../enums/twoFactorProviderType';

export class IdentityTwoFactorResponse extends BaseResponse {
    twoFactorProviders: TwoFactorProviderType[];
    twoFactorProviders2 = new Map<TwoFactorProviderType, { [key: string]: string; }>();

    constructor(response: any) {
        super(response);
        this.twoFactorProviders = this.getResponseProperty('TwoFactorProviders');
        const twoFactorProviders2 = this.getResponseProperty('TwoFactorProviders2');
        if (twoFactorProviders2 != null) {
            for (const prop in twoFactorProviders2) {
                if (twoFactorProviders2.hasOwnProperty(prop)) {
                    this.twoFactorProviders2.set(parseInt(prop, null), twoFactorProviders2[prop]);
                }
            }
        }
    }
}
