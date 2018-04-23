import { Utils } from '../misc/utils';

import { AppIdService as AppIdServiceAbstraction } from '../abstractions/appId.service';
import { StorageService } from '../abstractions/storage.service';

export class AppIdService implements AppIdServiceAbstraction {
    constructor(private storageService: StorageService) {
    }

    getAppId(): Promise<string> {
        return this.makeAndGetAppId('appId');
    }

    getAnonymousAppId(): Promise<string> {
        return this.makeAndGetAppId('anonymousAppId');
    }

    private async makeAndGetAppId(key: string) {
        const existingId = await this.storageService.get<string>(key);
        if (existingId != null) {
            return existingId;
        }

        const guid = Utils.newGuid();
        await this.storageService.save(key, guid);
        return guid;
    }
}
