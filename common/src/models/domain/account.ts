import { AccountStorageKey } from "../../enums/accountStorageKey";
import { KdfType } from "../../enums/kdfType";

export class Account {
    settings: Map<string, any> = new Map<string, any>();
    selected: boolean;

    constructor(userId: string, userEmail: string,
        kdfType: KdfType, kdfIterations: number,
        clientId: string, clientSecret: string)
    {
        this.settings.set(AccountStorageKey.UserId, userId);
        this.settings.set(AccountStorageKey.UserEmail, userEmail);
        this.settings.set(AccountStorageKey.KdfType, kdfType);
        this.settings.set(AccountStorageKey.KdfIterations, kdfIterations);
        this.settings.set(AccountStorageKey.ClientId, clientId);
        this.settings.set(AccountStorageKey.ClientSecret, clientSecret);
    }

    get isAuthenticated(): boolean {
        if (!this.settings.has(AccountStorageKey.AccessToken)) {
            return false;
        }

        if (!this.settings.has(AccountStorageKey.UserId)) {
            return false;
        }

        return true;
    }

}

