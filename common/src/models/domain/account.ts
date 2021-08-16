import { OrganizationData } from '../data/organizationData';

import { KdfType } from '../../enums/kdfType';
import { StorageKey } from '../../enums/storageKey';

export class Account {
    userId: string;
    email: string;
    settings: Map<string, any> = new Map<string, any>();

    constructor(userId: string, userEmail: string,
        kdfType: KdfType, kdfIterations: number,
        clientId: string, clientSecret: string,
        accessToken: string, refreshToken: string) {
        this.userId = userId;
        this.email = userEmail;
        this.settings.set(StorageKey.KdfType, kdfType);
        this.settings.set(StorageKey.KdfIterations, kdfIterations);
        this.settings.set(StorageKey.ClientId, clientId);
        this.settings.set(StorageKey.ClientSecret, clientSecret);
        this.settings.set(StorageKey.AccessToken, accessToken);
        this.settings.set(StorageKey.RefreshToken, refreshToken);
    }

    get isAuthenticated(): boolean {
        if (!this.settings.has(StorageKey.AccessToken)) {
            return false;
        }

        return this.userId != null || this.settings.has(StorageKey.EntityId);
    }

    get canAccessPremium(): boolean {
        if (!this.isAuthenticated) {
            return false;
        }

        return this.hasPremiumPersonally || this.hasPremiumThroughOrganization;
    }

    private get hasPremiumPersonally(): boolean {
        const token = this.settings.get(StorageKey.AccessToken);
        if (token.premium) {
           return true;
        }
    }

    private get hasPremiumThroughOrganization(): boolean {
        const organizations = this.settings.get(StorageKey.Organizations) as {
            [id: string]: OrganizationData;
        };

        if (organizations == null) {
            return false;
        }

        for (const id  of Object.keys(organizations)) {
            const o = organizations[id];
            if (o.enabled && o.usersGetPremium && !o.isProviderUser) {
                return true;
            }
        }

        return false;
    }
}

