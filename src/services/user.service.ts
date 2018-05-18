import { StorageService } from '../abstractions/storage.service';
import { TokenService } from '../abstractions/token.service';
import { UserService as UserServiceAbstraction } from '../abstractions/user.service';

import { OrganizationData } from '../models/data/organizationData';
import { Organization } from '../models/domain/organization';

const Keys = {
    userId: 'userId',
    userEmail: 'userEmail',
    stamp: 'securityStamp',
    organizationsPrefix: 'organizations_',
};

export class UserService implements UserServiceAbstraction {
    userId: string;
    email: string;
    stamp: string;

    constructor(private tokenService: TokenService, private storageService: StorageService) {
    }

    setUserIdAndEmail(userId: string, email: string): Promise<any> {
        this.email = email;
        this.userId = userId;

        return Promise.all([
            this.storageService.save(Keys.userEmail, email),
            this.storageService.save(Keys.userId, userId),
        ]);
    }

    setSecurityStamp(stamp: string): Promise<any> {
        this.stamp = stamp;
        return this.storageService.save(Keys.stamp, stamp);
    }

    async getUserId(): Promise<string> {
        if (this.userId != null) {
            return this.userId;
        }

        this.userId = await this.storageService.get<string>(Keys.userId);
        return this.userId;
    }

    async getEmail(): Promise<string> {
        if (this.email != null) {
            return this.email;
        }

        this.email = await this.storageService.get<string>(Keys.userEmail);
        return this.email;
    }

    async getSecurityStamp(): Promise<string> {
        if (this.stamp != null) {
            return this.stamp;
        }

        this.stamp = await this.storageService.get<string>(Keys.stamp);
        return this.stamp;
    }

    async clear(): Promise<any> {
        const userId = await this.getUserId();

        await Promise.all([
            this.storageService.remove(Keys.userId),
            this.storageService.remove(Keys.userEmail),
            this.storageService.remove(Keys.stamp),
            this.clearOrganizations(userId),
        ]);

        this.userId = this.email = this.stamp = null;
    }

    async isAuthenticated(): Promise<boolean> {
        const token = await this.tokenService.getToken();
        if (token == null) {
            return false;
        }

        const userId = await this.getUserId();
        return userId != null;
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
