import { StorageService } from '../abstractions/storage.service';
import { TokenService } from '../abstractions/token.service';
import { UserService as UserServiceAbstraction } from '../abstractions/user.service';

import { OrganizationData } from '../models/data/organizationData';
import { Organization } from '../models/domain/organization';

import { KdfType } from '../enums/kdfType';

const Keys = {
    userId: 'userId',
    userEmail: 'userEmail',
    stamp: 'securityStamp',
    kdf: 'kdf',
    kdfIterations: 'kdfIterations',
    organizationsPrefix: 'organizations_',
};

export class UserService implements UserServiceAbstraction {
    private userId: string;
    private email: string;
    private stamp: string;
    private kdf: KdfType;
    private kdfIterations: number;

    constructor(private tokenService: TokenService, private storageService: StorageService) { }

    setInformation(userId: string, email: string, kdf: KdfType, kdfIterations: number): Promise<any> {
        this.email = email;
        this.userId = userId;
        this.kdf = kdf;
        this.kdfIterations = kdfIterations;

        return Promise.all([
            this.storageService.save(Keys.userEmail, email),
            this.storageService.save(Keys.userId, userId),
            this.storageService.save(Keys.kdf, kdf),
            this.storageService.save(Keys.kdfIterations, kdfIterations),
        ]);
    }

    setSecurityStamp(stamp: string): Promise<any> {
        this.stamp = stamp;
        return this.storageService.save(Keys.stamp, stamp);
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

    async clear(): Promise<any> {
        const userId = await this.getUserId();

        await Promise.all([
            this.storageService.remove(Keys.userId),
            this.storageService.remove(Keys.userEmail),
            this.storageService.remove(Keys.stamp),
            this.storageService.remove(Keys.kdf),
            this.storageService.remove(Keys.kdfIterations),
            this.clearOrganizations(userId),
        ]);

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
            if (organizations.hasOwnProperty(id)) {
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
}
