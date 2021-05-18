import { ApiKeyService as ApiKeyServiceAbstraction } from '../abstractions/apiKey.service';
import { StorageService } from '../abstractions/storage.service';
import { TokenService } from '../abstractions/token.service';

import { Utils } from '../misc/utils';

const Keys = {
    clientId: 'clientId',
    entityType: 'entityType',
    entityId: 'entityId',
};


export class ApiKeyService implements ApiKeyServiceAbstraction {
    private clientId: string;
    private entityType: string;
    private entityId: string;

    constructor(private tokenService: TokenService, private storageService: StorageService) { }

    setInformation(clientId: string) {
        this.clientId = clientId;
        const idParts = clientId.split('.');

        if (idParts.length !== 2 || !Utils.isGuid(idParts[1])) {
            throw Error('Invalid clientId');
        }
        this.entityType = idParts[0];
        this.entityId = idParts[1];

        return this.storageService.save(Keys.clientId, this.clientId)
            .then(async v => await this.storageService.save(Keys.entityId, this.entityId))
            .then(async v => await this.storageService.save(Keys.entityType, this.entityType));
    }

    async getEntityType(): Promise<string> {
        if (this.entityType == null) {
            this.entityType = await this.storageService.get<string>(Keys.entityType);
        }
        return this.entityType;
    }

    async getEntityId(): Promise<string> {
        if (this.entityId == null) {
            this.entityId = await this.storageService.get<string>(Keys.entityId);
        }
        return this.entityId;
    }

    async clear(): Promise<any> {
        await this.storageService.remove(Keys.clientId)
            .then(async v => await this.storageService.remove(Keys.entityId))
            .then(async v => await this.storageService.remove(Keys.entityType));

        this.clientId = this.entityId = this.entityType = null;
    }

    async isAuthenticated(): Promise<boolean> {
        const token = await this.tokenService.getToken();
        if (token == null) {
            return false;
        }

        const entityId = await this.getEntityId();
        return entityId != null;
    }
}
