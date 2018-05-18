import { OrganizationData } from '../models/data/organizationData';
import { Organization } from '../models/domain/organization';

export abstract class UserService {
    userId: string;
    email: string;
    stamp: string;

    setUserIdAndEmail: (userId: string, email: string) => Promise<any>;
    setSecurityStamp: (stamp: string) => Promise<any>;
    getUserId: () => Promise<string>;
    getEmail: () => Promise<string>;
    getSecurityStamp: () => Promise<string>;
    clear: () => Promise<any>;
    isAuthenticated: () => Promise<boolean>;
    getOrganization: (id: string) => Promise<Organization>;
    getAllOrganizations: () => Promise<Organization[]>;
    replaceOrganizations: (organizations: { [id: string]: OrganizationData; }) => Promise<any>;
    clearOrganizations: (userId: string) => Promise<any>;
}
