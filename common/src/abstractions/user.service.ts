import { OrganizationData } from '../models/data/organizationData';
import { ProviderData } from '../models/data/providerData';
import { Organization } from '../models/domain/organization';
import { Provider } from '../models/domain/provider';

import { KdfType } from '../enums/kdfType';

export abstract class UserService {
    setInformation: (userId: string, email: string, kdf: KdfType, kdfIterations: number) => Promise<any>;
    setEmailVerified: (emailVerified: boolean) => Promise<any>;
    setSecurityStamp: (stamp: string) => Promise<any>;
    getUserId: () => Promise<string>;
    getEmail: () => Promise<string>;
    getSecurityStamp: () => Promise<string>;
    getKdf: () => Promise<KdfType>;
    getKdfIterations: () => Promise<number>;
    getEmailVerified: () => Promise<boolean>;
    clear: () => Promise<any>;
    isAuthenticated: () => Promise<boolean>;
    canAccessPremium: () => Promise<boolean>;
    getOrganization: (id: string) => Promise<Organization>;
    getAllOrganizations: () => Promise<Organization[]>;
    replaceOrganizations: (organizations: { [id: string]: OrganizationData; }) => Promise<any>;
    clearOrganizations: (userId: string) => Promise<any>;
    getProvider: (id: string) => Promise<Provider>;
    getAllProviders: () => Promise<Provider[]>;
    replaceProviders: (providers: { [id: string]: ProviderData; }) => Promise<any>;
    clearProviders: (userId: string) => Promise<any>;
}
