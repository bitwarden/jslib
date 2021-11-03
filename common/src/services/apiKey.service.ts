import { ApiKeyService as ApiKeyServiceAbstraction } from '../abstractions/apiKey.service';
import { StorageService } from '../abstractions/storage.service';
import { TokenService } from '../abstractions/token.service';

import { Utils } from '../misc/utils';

const Keys = {
    clientIdOld: 'clientId', // TODO: remove this migration when we are confident existing api keys are all migrated. Probably 1-2 releases.
    clientId: 'apikey_clientId',
    clientSecretOld: 'clientSecret', // TODO: remove this migration when we are confident existing api keys are all migrated. Probably 1-2 releases.
    clientSecret: 'apikey_clientSecret',
    entityType: 'entityType',
    entityId: 'entityId',
};


export class ApiKeyService implements ApiKeyServiceAbstraction {
    private clientId: string;
    private clientSecret: string;
    private entityType: string;
    private entityId: string;

    constructor(private tokenService: TokenService, private storageService: StorageService) { }

    // TODO: remove this migration when we are confident existing api keys are all migrated. Probably 1-2 releases.
    async migrateApiKeyStorage() {
        const oldClientId = await this.storageService.get<string>(Keys.clientIdOld);
        const oldClientSecret = await this.storageService.get<string>(Keys.clientSecretOld);

        if (oldClientId != null) {
            await this.storageService.save(Keys.clientId, oldClientId);
            await this.storageService.remove(Keys.clientIdOld);
        }

        if (oldClientSecret != null) {
            await this.storageService.save(Keys.clientSecret, oldClientSecret);
            await this.storageService.remove(Keys.clientSecretOld);
        }
    }

    async setInformation(clientId: string, clientSecret: string) {
        this.clientId = clientId;
        this.clientSecret = clientSecret;
        const idParts = clientId.split('.');

        if (idParts.length !== 2 || !Utils.isGuid(idParts[1])) {
            throw Error('Invalid clientId');
        }
        this.entityType = idParts[0];
        this.entityId = idParts[1];

        await this.storageService.save(Keys.clientId, this.clientId);
        await this.storageService.save(Keys.entityId, this.entityId);
        await this.storageService.save(Keys.entityType, this.entityType);
        await this.storageService.save(Keys.clientSecret, this.clientSecret);
    }

    async getClientId(): Promise<string> {
        if (this.clientId == null) {
            this.clientId = await this.storageService.get<string>(Keys.clientId);
        }
        return this.clientId;
    }

    async getClientSecret(): Promise<string> {
        if (this.clientSecret == null) {
            this.clientSecret = await this.storageService.get<string>(Keys.clientSecret);
        }
        return this.clientSecret;
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
        await this.storageService.remove(Keys.clientId);
        await this.storageService.remove(Keys.clientSecret);
        await this.storageService.remove(Keys.entityId);
        await this.storageService.remove(Keys.entityType);

        this.clientId = this.clientSecret = this.entityId = this.entityType = null;
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
