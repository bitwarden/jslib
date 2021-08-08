import { StorageService } from '../abstractions/storage.service';
import { TokenService } from '../abstractions/token.service';
import { UserService as UserServiceAbstraction } from '../abstractions/user.service';

import { OrganizationData } from '../models/data/organizationData';
import { Organization } from '../models/domain/organization';

import { KdfType } from '../enums/kdfType';
import { ProviderData } from '../models/data/providerData';
import { Provider } from '../models/domain/provider';

const Keys = {
    userId: 'userId',
    userEmail: 'userEmail',
    stamp: 'securityStamp',
    kdf: 'kdf',
    kdfIterations: 'kdfIterations',
    organizationsPrefix: 'organizations_',
    providersPrefix: 'providers_',
    emailVerified: 'emailVerified',
};

export class UserService implements UserServiceAbstraction {
    private userId: string;
    private email: string;
    private stamp: string;
    private kdf: KdfType;
    private kdfIterations: number;
    private emailVerified: boolean;

    constructor(private tokenService: TokenService, private storageService: StorageService) { }

    async setInformation(userId: string, email: string, kdf: KdfType, kdfIterations: number): Promise<any> {
        this.email = email;
        this.userId = userId;
        this.kdf = kdf;
        this.kdfIterations = kdfIterations;

        await this.storageService.save(Keys.userEmail, email);
        await this.storageService.save(Keys.userId, userId);
        await this.storageService.save(Keys.kdf, kdf);
        await this.storageService.save(Keys.kdfIterations, kdfIterations);
    }

    setSecurityStamp(stamp: string): Promise<any> {
        this.stamp = stamp;
        return this.storageService.save(Keys.stamp, stamp);
    }

    setEmailVerified(emailVerified: boolean) {
        this.emailVerified = emailVerified;
        return this.storageService.save(Keys.emailVerified, emailVerified);
    }

    async getUserId(): Promise<string> {
        if (this.userId == null) {
            this.userId = await this.storageService.get<string>(Keys.userId);
        }
        return this.userId;
    }

    async getEmail(): Promise<string> {
        if (this.email == null) {
            this.email = await this.storageService.get<string>(Keys.userEmail);
        }
        return this.email;
    }

    async getSecurityStamp(): Promise<string> {
        if (this.stamp == null) {
            this.stamp = await this.storageService.get<string>(Keys.stamp);
        }
        return this.stamp;
    }

    async getKdf(): Promise<KdfType> {
        if (this.kdf == null) {
            this.kdf = await this.storageService.get<KdfType>(Keys.kdf);
        }
        return this.kdf;
    }

    async getKdfIterations(): Promise<number> {
        if (this.kdfIterations == null) {
            this.kdfIterations = await this.storageService.get<number>(Keys.kdfIterations);
        }
        return this.kdfIterations;
    }

    async getEmailVerified(): Promise<boolean> {
        if (this.emailVerified == null) {
            this.emailVerified = await this.storageService.get<boolean>(Keys.emailVerified);
        }
        return this.emailVerified;
    }

    async clear(): Promise<any> {
        const userId = await this.getUserId();

        await this.storageService.remove(Keys.userId);
        await this.storageService.remove(Keys.userEmail);
        await this.storageService.remove(Keys.stamp);
        await this.storageService.remove(Keys.kdf);
        await this.storageService.remove(Keys.kdfIterations);
        await this.clearOrganizations(userId);
        await this.clearProviders(userId);

        this.userId = this.email = this.stamp = null;
        this.kdf = null;
        this.kdfIterations = null;
    }

    async isAuthenticated(): Promise<boolean> {
        const token = await this.tokenService.getToken();
        if (token == null) {
            return false;
        }

        const userId = await this.getUserId();
        return userId != null;
    }

    async canAccessPremium(): Promise<boolean> {
        const authed = await this.isAuthenticated();
        if (!authed) {
            return false;
        }

        const tokenPremium = this.tokenService.getPremium();
        if (tokenPremium) {
            return true;
        }

        const orgs = await this.getAllOrganizations();
        for (let i = 0; i < orgs.length; i++) {
            if (orgs[i].usersGetPremium && orgs[i].enabled) {
                return true;
            }
        }
        return false;
    }

    async getOrganization(id: string): Promise<Organization> {
        const userId = await this.getUserId();
        const organizations = await this.storageService.get<{ [id: string]: OrganizationData; }>(
            Keys.organizationsPrefix + userId);
        if (organizations == null || !organizations.hasOwnProperty(id)) {
            return null;
        }

        return new Organization(organizations[id]);
    }

    async getAllOrganizations(): Promise<Organization[]> {
        const userId = await this.getUserId();
        const organizations = await this.storageService.get<{ [id: string]: OrganizationData; }>(
            Keys.organizationsPrefix + userId);
        const response: Organization[] = [];
        for (const id in organizations) {
            if (organizations.hasOwnProperty(id) && !organizations[id].isProviderUser) {
                response.push(new Organization(organizations[id]));
            }
        }
        return response;
    }

    async replaceOrganizations(organizations: { [id: string]: OrganizationData; }): Promise<any> {
        const userId = await this.getUserId();
        await this.storageService.save(Keys.organizationsPrefix + userId, organizations);
    }

    async clearOrganizations(userId: string): Promise<any> {
        await this.storageService.remove(Keys.organizationsPrefix + userId);
    }

    async getProvider(id: string): Promise<Provider> {
        const userId = await this.getUserId();
        const providers = await this.storageService.get<{ [id: string]: ProviderData; }>(
            Keys.providersPrefix + userId);
        if (providers == null || !providers.hasOwnProperty(id)) {
            return null;
        }

        return new Provider(providers[id]);
    }

    async getAllProviders(): Promise<Provider[]> {
        const userId = await this.getUserId();
        const providers = await this.storageService.get<{ [id: string]: ProviderData; }>(
            Keys.providersPrefix + userId);
        const response: Provider[] = [];
        for (const id in providers) {
            if (providers.hasOwnProperty(id)) {
                response.push(new Provider(providers[id]));
            }
        }
        return response;
    }

    async replaceProviders(providers: { [id: string]: ProviderData; }): Promise<any> {
        const userId = await this.getUserId();
        await this.storageService.save(Keys.providersPrefix + userId, providers);
    }

    async clearProviders(userId: string): Promise<any> {
        await this.storageService.remove(Keys.providersPrefix + userId);
    }
}
