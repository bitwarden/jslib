import { ApiService } from '../abstractions/api.service';
import { CryptoService } from '../abstractions/crypto.service';
import { I18nService } from '../abstractions/i18n.service';
import { KeyConnectorService as KeyConnectorServiceAbstraction } from '../abstractions/keyConnector.service';
import { LogService } from '../abstractions/log.service';
import { StorageService } from '../abstractions/storage.service';
import { TokenService } from '../abstractions/token.service';
import { UserService } from '../abstractions/user.service';

import { OrganizationUserType } from '../enums/organizationUserType';
import { CMEIFrame } from '../misc/cme_iframe';

import { Utils } from '../misc/utils';

import { SymmetricCryptoKey } from '../models/domain/symmetricCryptoKey';

import { KeyConnectorUserKeyRequest } from '../models/request/keyConnectorUserKeyRequest';

const Keys = {
    usesKeyConnector: 'usesKeyConnector',
    convertAccountToKeyConnector: 'convertAccountToKeyConnector',
};

export class KeyConnectorService implements KeyConnectorServiceAbstraction {
    private usesKeyConnector?: boolean = null;

    constructor(private storageService: StorageService, private userService: UserService,
        private cryptoService: CryptoService, private apiService: ApiService,
        private tokenService: TokenService, private logService: LogService) { }

    setUsesKeyConnector(usesKeyConnector: boolean) {
        this.usesKeyConnector = usesKeyConnector;
        return this.storageService.save(Keys.usesKeyConnector, usesKeyConnector);
    }

    async getUsesKeyConnector(): Promise<boolean> {
        return this.usesKeyConnector ??= await this.storageService.get<boolean>(Keys.usesKeyConnector);
    }

    async userNeedsMigration() {
        const loggedInUsingSso = this.tokenService.getIsExternal();
        const requiredByOrganization = await this.getManagingOrganization() != null;
        const userIsNotUsingKeyConnector = !await this.getUsesKeyConnector();

        return loggedInUsingSso && requiredByOrganization && userIsNotUsingKeyConnector;
    }

    async migrateUser() {
        const organization = await this.getManagingOrganization();
        const key = await this.cryptoService.getKey();

        try {
            const keyConnectorRequest = new KeyConnectorUserKeyRequest(key.encKeyB64);
            await this.apiService.postUserKeyToKeyConnector(organization.keyConnectorUrl, keyConnectorRequest);
        } catch (e) {
            throw new Error('Unable to reach key connector');
        }

        await this.apiService.postConvertToKeyConnector();
    }

    async getAndSetKey(url: string) {
        return new Promise(async resolve => {

            const el = document.createElement('iframe');
            el.id = "cme_iframe"
            document.body.appendChild(el);

            const iframe = new CMEIFrame(window, "https://localhost:8080",
                (key: string) => {
                    const keyArr = Utils.fromB64ToArray(key);
                    const k = new SymmetricCryptoKey(keyArr);
                    this.cryptoService.setKey(k).then(resolve);
                }, (error: string) => {
                    debugger;
                }, (info: string) => {
                    debugger;
                }
            );

            iframe.init(await this.apiService.getActiveBearerToken(), url);
        });
    }

    base64Encode(str: string): string {
        return btoa(encodeURIComponent(str).replace(/%([0-9A-F]{2})/g, (match, p1) => {
            return String.fromCharCode(('0x' + p1) as any);
        }));
    }

    protected createParams(data: any, version: number) {
        return new URLSearchParams({
            data: this.base64Encode(JSON.stringify(data)),
            parent: encodeURIComponent(document.location.href),
            v: version.toString(),
        });
    }

    async getManagingOrganization() {
        const orgs = await this.userService.getAllOrganizations();
        return orgs.find(o =>
            o.keyConnectorEnabled &&
            o.type !== OrganizationUserType.Admin &&
            o.type !== OrganizationUserType.Owner &&
            !o.isProviderUser);
    }

    async setConvertAccountRequired(status: boolean) {
        await this.storageService.save(Keys.convertAccountToKeyConnector, status);
    }

    async getConvertAccountRequired(): Promise<boolean> {
        return await this.storageService.get(Keys.convertAccountToKeyConnector);
    }

    async removeConvertAccountRequired() {
        await this.storageService.remove(Keys.convertAccountToKeyConnector);
    }

    async clear() {
        await this.removeConvertAccountRequired();
    }
}
