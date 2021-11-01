import { OrganizationData } from '../models/data/organizationData';

import { Organization } from '../models/domain/organization';

export abstract class OrganizationService {
    get: (id: string) => Promise<Organization>;
    getByIdentifier: (identifier: string) => Promise<Organization>;
    getAll: () => Promise<Organization[]>;
    save: (orgs: {[id: string]: OrganizationData}) => Promise<any>;
}
